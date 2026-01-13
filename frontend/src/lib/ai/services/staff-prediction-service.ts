import { PrismaClient, Staff, Teacher } from '@prisma/client'
import { StaffPrediction } from '../types/staff-prediction'

export class StaffPredictionService {
  private prisma: PrismaClient

  constructor() {
    this.prisma = new PrismaClient()
  }

  async generatePredictions(): Promise<StaffPrediction> {
    const [
      allStaff,
      allTeachers,
      departmentGroups,
      lessonGroups,
      auditLogGroups
    ] = await Promise.all([
      this.prisma.staff.findMany({
        select: {
          id: true,
          firstName: true,
          lastName: true,
          department: true,
          designation: true,
          joinDate: true,
          salary: true,
          status: true
        }
      }),
      this.prisma.teacher.findMany({
        select: {
          id: true,
          firstName: true,
          lastName: true,
          department: true,
          joinDate: true,
          salary: true,
          status: true
        }
      }),
      this.prisma.staff.groupBy({
        by: ['department'],
        _count: true,
        _avg: { salary: true }
      }),
      this.prisma.lesson.groupBy({
        by: ['teacherId'],
        _count: true
      }),
      this.prisma.auditLog.groupBy({
        by: ['userId'],
        _count: true,
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        }
      })
    ])

    const staffSummary = this.getStaffSummary(allStaff)
    const tenureAnalysis = this.analyzeTenure(allStaff)
    const departmentBalance = this.analyzeDepartmentBalance(allStaff, departmentGroups)
    const retentionRisk = this.detectRetentionRisk(allStaff, auditLogGroups)
    const salaryAnalysis = this.analyzeSalary(allStaff, departmentGroups)
    const workloadDistribution = this.analyzeWorkload(allTeachers, lessonGroups)
    const recommendations = this.generateRecommendations({
      staffSummary,
      tenureAnalysis,
      departmentBalance,
      retentionRisk,
      salaryAnalysis,
      workloadDistribution
    })

    return {
      staffSummary,
      tenureAnalysis,
      departmentBalance,
      retentionRisk,
      salaryAnalysis,
      workloadDistribution,
      recommendations
    }
  }

  private getStaffSummary(staff: Staff[]) {
    const total = staff.length
    const teachers = staff.filter(s => s.designation.toLowerCase().includes('teacher') || s.department.toLowerCase().includes('teaching')).length
    const adminStaff = total - teachers
    const activeCount = staff.filter(s => s.status === 'Active').length
    const onLeaveCount = staff.filter(s => s.status === 'On Leave').length
    const activeRate = total > 0 ? Math.round((activeCount / total) * 100) : 0

    return {
      total,
      teachers,
      adminStaff,
      activeRate,
      activeCount,
      onLeaveCount
    }
  }

  private analyzeTenure(staff: Staff[]) {
    const now = new Date()
    const tenures = staff.map(s => ({
      name: `${s.firstName} ${s.lastName}`,
      department: s.department,
      joinDate: s.joinDate,
      years: (now.getTime() - new Date(s.joinDate).getTime()) / (1000 * 60 * 60 * 24 * 365.25)
    }))

    const averageTenure = tenures.length > 0
      ? Math.round((tenures.reduce((sum, t) => sum + t.years, 0) / tenures.length) * 10) / 10
      : 0

    const longestServing = tenures.length > 0
      ? tenures.reduce((max, t) => t.years > max.years ? t : max)
      : null

    const tenureDistribution = {
      lessThan1Year: tenures.filter(t => t.years < 1).length,
      oneToThreeYears: tenures.filter(t => t.years >= 1 && t.years < 3).length,
      threeToFiveYears: tenures.filter(t => t.years >= 3 && t.years < 5).length,
      fivePlusYears: tenures.filter(t => t.years >= 5).length
    }

    return {
      averageTenure,
      tenureDistribution,
      longestServing: longestServing ? {
        name: longestServing.name,
        department: longestServing.department,
        tenureYears: Math.round(longestServing.years * 10) / 10
      } : null
    }
  }

  private analyzeDepartmentBalance(staff: Staff[], departmentGroups: any[]) {
    const total = staff.length

    return departmentGroups.map(dept => {
      const percentage = total > 0 ? Math.round((dept._count / total) * 100) : 0
      let workloadLevel: 'balanced' | 'high' | 'overloaded' = 'balanced'

      if (percentage > 50) {
        workloadLevel = 'overloaded'
      } else if (percentage > 35) {
        workloadLevel = 'high'
      }

      return {
        name: dept.department,
        count: dept._count,
        percentage,
        workloadLevel
      }
    })
  }

  private detectRetentionRisk(staff: Staff[], auditLogGroups: any[]) {
    const auditActivity = new Map<string, number>()
    auditLogGroups.forEach(log => {
      auditActivity.set(log.userId, log._count)
    })

    const now = new Date()
    const atRiskStaff: any[] = []

    staff.forEach(s => {
      const activityCount = auditActivity.get(s.userId) || 0
      const tenure = (now.getTime() - new Date(s.joinDate).getTime()) / (1000 * 60 * 60 * 24 * 365.25)
      let riskFactor: 'low' | 'medium' | 'high' = 'low'
      let reason = ''

      if (s.status === 'On Leave') {
        riskFactor = 'high'
        reason = 'Currently on leave - check return date'
      } else if (tenure > 0.5 && activityCount < 5) {
        riskFactor = 'medium'
        reason = 'Low system activity - may indicate disengagement'
      } else if (tenure < 0.5 && activityCount > 10) {
        riskFactor = 'low'
        reason = 'New hire showing high engagement'
      }

      if (riskFactor !== 'low') {
        atRiskStaff.push({
          name: `${s.firstName} ${s.lastName}`,
          department: s.department,
          riskFactor,
          reason
        })
      }
    })

    return atRiskStaff
  }

  private analyzeSalary(staff: Staff[], departmentGroups: any[]) {
    const staffWithSalary = staff.filter(s => s.salary !== null)
    const salaries = staffWithSalary.map(s => s.salary!)

    const averageSalary = salaries.length > 0
      ? Math.round((salaries.reduce((sum, s) => sum + s, 0) / salaries.length))
      : 0

    const salaryRange = {
      min: salaries.length > 0 ? Math.round(Math.min(...salaries)) : 0,
      max: salaries.length > 0 ? Math.round(Math.max(...salaries)) : 0
    }

    const salaryByDepartment = departmentGroups
      .filter(d => d._avg.salary !== null)
      .map(d => ({
        department: d.department,
        averageSalary: Math.round(d._avg.salary),
        count: d._count
      }))

    return {
      averageSalary,
      salaryRange,
      salaryByDepartment
    }
  }

  private analyzeWorkload(teachers: Teacher[], lessonGroups: any[]) {
    const lessonCountMap = new Map<string, number>()
    lessonGroups.forEach(group => {
      lessonCountMap.set(group.teacherId, group._count)
    })

    const teacherWorkloads = teachers.map(t => ({
      id: t.id,
      name: `${t.firstName} ${t.lastName}`,
      department: t.department || 'Unassigned',
      lessonCount: lessonCountMap.get(t.id) || 0
    }))

    const averageLessons = teacherWorkloads.length > 0
      ? Math.round(teacherWorkloads.reduce((sum, t) => sum + t.lessonCount, 0) / teacherWorkloads.length)
      : 0

    const overloadedTeachers = teacherWorkloads.filter(t => t.lessonCount > 30).map(t => ({
      name: t.name,
      department: t.department,
      lessonCount: t.lessonCount
    }))

    const underutilizedTeachers = teacherWorkloads.filter(t => t.lessonCount < 10 && t.lessonCount > 0).map(t => ({
      name: t.name,
      department: t.department,
      lessonCount: t.lessonCount
    }))

    return {
      averageLessonsPerTeacher: averageLessons,
      overloadedTeachers,
      underutilizedTeachers
    }
  }

  private generateRecommendations(data: any) {
    const recommendations: any[] = []

    if (data.staffSummary.activeRate < 85) {
      recommendations.push({
        title: 'Staff Attendance Concern',
        message: `Active staff rate is ${data.staffSummary.activeRate}%. Consider reviewing leave policies.`,
        type: 'warning' as const,
        priority: 'high' as const
      })
    }

    if (data.departmentBalance.some((d: any) => d.workloadLevel === 'overloaded')) {
      const overloaded = data.departmentBalance.filter((d: any) => d.workloadLevel === 'overloaded')
      recommendations.push({
        title: 'Department Imbalance',
        message: `${overloaded.map((d: any) => d.name).join(', ')} departments have >50% of staff. Consider redistribution.`,
        type: 'warning' as const,
        priority: 'medium' as const
      })
    }

    if (data.retentionRisk.length > 0) {
      const highRisk = data.retentionRisk.filter((r: any) => r.riskFactor === 'high')
      if (highRisk.length > 0) {
        recommendations.push({
          title: 'Retention Risk Alert',
          message: `${highRisk.length} staff members at high risk. Schedule 1-on-1 meetings.`,
          type: 'warning' as const,
          priority: 'high' as const
        })
      }
    }

    if (data.workloadDistribution.overloadedTeachers.length > 0) {
      recommendations.push({
        title: 'Teacher Workload',
        message: `${data.workloadDistribution.overloadedTeachers.length} teachers have >30 lessons. Consider rebalancing.`,
        type: 'info' as const,
        priority: 'medium' as const
      })
    }

    if (data.tenureAnalysis.averageTenure < 2 && data.staffSummary.total > 10) {
      recommendations.push({
        title: 'Team Experience',
        message: 'Average tenure is under 2 years. Consider mentorship programs.',
        type: 'info' as const,
        priority: 'low' as const
      })
    }

    if (recommendations.length === 0) {
      recommendations.push({
        title: 'Staff Operations Healthy',
        message: 'All metrics are within optimal ranges.',
        type: 'success' as const,
        priority: 'low' as const
      })
    }

    return recommendations
  }
}

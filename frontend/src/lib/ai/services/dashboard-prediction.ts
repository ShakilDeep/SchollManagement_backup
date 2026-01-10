import { DashboardPrediction } from '../types'
import { db } from '@/lib/db'
import { validateDashboardData, validateStudentData, validateAttendanceRecords, validateExamResults } from '../utils/data-validation'

interface DashboardData {
  totalStudents: number
  activeStudents: number
  totalTeachers: number
  totalGrades: number
  presentToday: number
  recentEnrollments: number
  upcomingExams: number
  libraryBooks: number
  transportVehicles: number
  attendanceRate: number
  historicalData?: {
    enrollments: Array<{ month: string; count: number }>
    attendance: Array<{ date: string; rate: number }>
    performance: Array<{ grade: string; average: number }>
  }
  libraryData?: {
    borrowedBooks: number
    activeBorrowers: number
    overdueBooks: number
    popularSubjects: Array<{ subject: string; count: number }>
    readingLevels: { beginner: number; intermediate: number; advanced: number }
  }
  studentPerformanceData?: {
    lowPerformingStudents: number
    highPerformingStudents: number
    subjectsNeedingAttention: Array<{ subject: string; average: number }>
  }
}

export class DashboardPredictionService {
  private dataCache: Map<string, { data: DashboardData; timestamp: number }> = new Map()
  private readonly CACHE_TTL = 600000

  private getCachedData(key: string): DashboardData | null {
    const cached = this.dataCache.get(key)
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data
    }
    return null
  }

  private setCachedData(key: string, data: DashboardData): void {
    this.dataCache.set(key, { data, timestamp: Date.now() })
  }

  async loadDashboardData(): Promise<DashboardData> {
    const cacheKey = 'dashboard_data'
    const cached = this.getCachedData(cacheKey)
    if (cached) return cached

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1)

    const [
      totalStudents,
      activeStudents,
      totalTeachers,
      totalGrades,
      presentToday,
      recentEnrollments,
      upcomingExams,
      libraryBooks,
      transportVehicles,
      enrollmentHistory,
      attendanceHistory,
      performanceByGrade,
      libraryStats,
      studentPerformanceStats
    ] = await Promise.all([
      db.student.count(),
      db.student.count({ where: { status: 'Active' } }),
      db.teacher.count(),
      db.grade.count(),
      db.attendance.count({
        where: {
          date: now,
          status: 'Present'
        }
      }),
      db.student.count({
        where: {
          admissionDate: {
            gte: startOfMonth
          }
        }
      }),
      db.examPaper.count({
        where: {
          examDate: { gte: now },
          exam: { status: 'Upcoming' }
        }
      }),
      db.book.aggregate({
        _sum: { totalCopies: true },
        _avg: { totalCopies: true }
      }),
      db.vehicle.count({ where: { status: 'Active' } }),
      db.student.findMany({
        where: {
          admissionDate: {
            gte: threeMonthsAgo
          }
        },
        select: {
          admissionDate: true
        }
      }),
      db.attendance.findMany({
        where: {
          date: { gte: threeMonthsAgo }
        },
        select: {
          date: true,
          status: true
        }
      }),
      db.examResult.findMany({
        include: {
          examPaper: {
            include: {
              subject: { select: { name: true } },
              grade: { select: { name: true } }
            }
          }
        },
        orderBy: {
          examPaper: { examDate: 'desc' }
        },
        take: 500
      }),
      db.libraryBorrowal.findMany({
        include: {
          book: {
            select: {
              category: true
            }
          }
        },
        take: 1000
      }),
      db.examResult.findMany({
        include: {
          examPaper: {
            include: {
              subject: { select: { name: true } }
            }
          },
          student: {
            select: {
              id: true
            }
          }
        },
        orderBy: {
          examPaper: { examDate: 'desc' }
        },
        take: 1000
      })
    ])

    const enrollmentsByMonth = this.groupByMonth(enrollmentHistory, 'admissionDate')
    const attendanceByDate = this.groupAttendanceByDate(attendanceHistory)
    const performanceBySubject = this.groupPerformanceBySubject(performanceByGrade)

    const attendanceRate = attendanceHistory.length > 0
      ? attendanceHistory.filter(a => a.status === 'Present').length / attendanceHistory.length
      : 0

    const borrowedBooks = libraryStats.filter(b => b.status === 'Borrowed').length
    const activeBorrowers = new Set(libraryStats.filter(b => b.status === 'Borrowed').map(b => b.studentId)).size
    const overdueBooks = libraryStats.filter(b => 
      b.status === 'Borrowed' && b.dueDate < now
    ).length

    const categoryCounts = libraryStats.reduce((acc, b) => {
      const category = b.book.category
      acc[category] = (acc[category] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const popularSubjects = Object.entries(categoryCounts)
      .map(([subject, count]) => ({ subject, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    const lowPerformingStudents = new Set()
    const highPerformingStudents = new Set()
    const subjectPerformance = new Map<string, { sum: number; count: number }>()

    studentPerformanceStats.forEach(r => {
      if (r.percentage < 50) lowPerformingStudents.add(r.studentId)
      if (r.percentage >= 85) highPerformingStudents.add(r.studentId)

      const subject = r.examPaper.subject.name
      if (!subjectPerformance.has(subject)) {
        subjectPerformance.set(subject, { sum: 0, count: 0 })
      }
      const stats = subjectPerformance.get(subject)!
      stats.sum += r.percentage
      stats.count += 1
    })

    const subjectsNeedingAttention = Array.from(subjectPerformance.entries())
      .map(([subject, stats]) => ({ subject, average: stats.sum / stats.count }))
      .filter(s => s.average < 65)
      .sort((a, b) => a.average - b.average)

    const dashboardData: DashboardData = {
      totalStudents,
      activeStudents,
      totalTeachers,
      totalGrades,
      presentToday,
      recentEnrollments,
      upcomingExams,
      libraryBooks: libraryBooks._sum.totalCopies || 0,
      transportVehicles,
      attendanceRate,
      historicalData: {
        enrollments: enrollmentsByMonth,
        attendance: attendanceByDate,
        performance: performanceBySubject
      },
      libraryData: {
        borrowedBooks,
        activeBorrowers,
        overdueBooks,
        popularSubjects,
        readingLevels: { beginner: 0, intermediate: 0, advanced: 0 }
      },
      studentPerformanceData: {
        lowPerformingStudents: lowPerformingStudents.size,
        highPerformingStudents: highPerformingStudents.size,
        subjectsNeedingAttention
      }
    }

    this.setCachedData(cacheKey, dashboardData)
    return dashboardData
  }

  private groupByMonth<T>(items: T[], dateKey: keyof T): Array<{ month: string; count: number }> {
    const grouped = new Map<string, number>()
    
    items.forEach(item => {
      const date = item[dateKey] as Date
      const monthKey = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
      grouped.set(monthKey, (grouped.get(monthKey) || 0) + 1)
    })

    return Array.from(grouped.entries())
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => {
        const dateA = new Date(a.month)
        const dateB = new Date(b.month)
        return dateA.getTime() - dateB.getTime()
      })
  }

  private groupAttendanceByDate(attendances: Array<{ date: Date; status: string }>): Array<{ date: string; rate: number }> {
    const grouped = new Map<string, { present: number; total: number }>()

    attendances.forEach(a => {
      const dateKey = a.date.toISOString().split('T')[0]
      if (!grouped.has(dateKey)) {
        grouped.set(dateKey, { present: 0, total: 0 })
      }
      const stats = grouped.get(dateKey)!
      stats.total += 1
      if (a.status === 'Present') stats.present += 1
    })

    return Array.from(grouped.entries())
      .map(([date, stats]) => ({
        date,
        rate: stats.total > 0 ? stats.present / stats.total : 0
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
  }

  private groupPerformanceBySubject(results: Array<{ examPaper: { subject: { name: string }; grade: { name: string } }; percentage: number }>): Array<{ grade: string; average: number }> {
    const grouped = new Map<string, { sum: number; count: number }>()

    results.forEach(r => {
      const grade = r.examPaper.grade.name
      if (!grouped.has(grade)) {
        grouped.set(grade, { sum: 0, count: 0 })
      }
      const stats = grouped.get(grade)!
      stats.sum += r.percentage
      stats.count += 1
    })

    return Array.from(grouped.entries())
      .map(([grade, stats]) => ({
        grade,
        average: stats.sum / stats.count
      }))
      .sort((a, b) => a.grade.localeCompare(b.grade))
  }

  async predictEnrollmentTrends(data: DashboardData): Promise<DashboardPrediction['enrollmentTrends']> {
    const historicalEnrollments = data.historicalData?.enrollments || []
    
    if (historicalEnrollments.length < 3) {
      const recentEnrollmentRate = data.recentEnrollments / 7
      const growthRate = recentEnrollmentRate / Math.max(1, data.totalStudents)
      const trend = growthRate > 0.02 ? 'increasing' : growthRate < -0.01 ? 'decreasing' : 'stable'
      
      return {
        nextMonth: Math.max(0, Math.round(data.totalStudents * (1 + growthRate * 4))),
        nextQuarter: Math.max(0, Math.round(data.totalStudents * (1 + growthRate * 12))),
        nextYear: Math.max(0, Math.round(data.totalStudents * (1 + growthRate * 12))),
        trend,
        confidence: Math.min(0.7, Math.max(0.5, 1 - Math.abs(growthRate) * 10))
      }
    }

    const enrollmentCounts = historicalEnrollments.map(e => e.count)
    const n = enrollmentCounts.length
    
    const sumX = (n * (n - 1)) / 2
    const sumY = enrollmentCounts.reduce((a, b) => a + b, 0)
    const sumXY = enrollmentCounts.reduce((sum, y, i) => sum + i * y, 0)
    const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
    const intercept = (sumY - slope * sumX) / n
    
    const projectedNextMonth = Math.max(0, Math.round(slope * n + intercept))
    const projectedNextQuarter = Math.max(0, Math.round(slope * (n + 3) + intercept))
    const projectedNextYear = Math.max(0, Math.round(slope * (n + 12) + intercept))
    
    const variance = enrollmentCounts.reduce((acc, val, i) => {
      const predicted = slope * i + intercept
      return acc + Math.pow(val - predicted, 2)
    }, 0) / n
    
    const avgEnrollment = sumY / n
    const coefficientOfVariation = Math.sqrt(variance) / avgEnrollment
    const confidence = Math.max(0.6, Math.min(0.95, 1 - coefficientOfVariation))
    
    const trend = slope > avgEnrollment * 0.05 ? 'increasing' : slope < -avgEnrollment * 0.05 ? 'decreasing' : 'stable'

    return {
      nextMonth: projectedNextMonth - data.totalStudents,
      nextQuarter: projectedNextQuarter - data.totalStudents,
      nextYear: projectedNextYear - data.totalStudents,
      trend,
      confidence
    }
  }

  async analyzeDropoutRisk(data: DashboardData): Promise<DashboardPrediction['dropoutRisk']> {
    const attendanceRiskFactor = data.attendanceRate < 0.85 ? 0.3 : data.attendanceRate < 0.9 ? 0.15 : 0
    
    const performanceTrends = data.historicalData?.performance || []
    let performanceRiskFactor = 0
    
    if (performanceTrends.length > 0) {
      const avgPerformance = performanceTrends.reduce((sum, p) => sum + p.average, 0) / performanceTrends.length
      if (avgPerformance < 60) performanceRiskFactor = 0.3
      else if (avgPerformance < 70) performanceRiskFactor = 0.15
    }
    
    const studentTeacherRatio = data.totalStudents / data.totalTeachers
    const ratioRiskFactor = studentTeacherRatio > 30 ? 0.2 : studentTeacherRatio > 25 ? 0.1 : 0
    
    const totalRiskScore = attendanceRiskFactor + performanceRiskFactor + ratioRiskFactor
    
    const highRisk = Math.round(data.totalStudents * (totalRiskScore * 0.25))
    const mediumRisk = Math.round(data.totalStudents * (totalRiskScore * 0.4))
    const lowRisk = Math.max(0, data.totalStudents - highRisk - mediumRisk)
    
    const riskFactors: string[] = []
    if (data.attendanceRate < 0.85) riskFactors.push(`Low attendance rate (${(data.attendanceRate * 100).toFixed(1)}%)`)
    if (studentTeacherRatio > 25) riskFactors.push(`High student-teacher ratio (${studentTeacherRatio.toFixed(1)}:1)`)
    if (performanceTrends.length > 0) {
      const avgPerformance = performanceTrends.reduce((sum, p) => sum + p.average, 0) / performanceTrends.length
      if (avgPerformance < 70) riskFactors.push(`Declining academic performance (${avgPerformance.toFixed(1)}%)`)
    }
    if (data.recentEnrollments > data.totalStudents * 0.1) {
      riskFactors.push('High recent enrollment surge requiring support')
    }
    if (riskFactors.length === 0) riskFactors.push('Overall stable student engagement')

    return {
      highRiskStudents: Math.max(0, highRisk),
      mediumRiskStudents: Math.max(0, mediumRisk),
      lowRiskStudents: Math.max(0, lowRisk),
      riskFactors
    }
  }

  async optimizeResources(data: DashboardData): Promise<DashboardPrediction['resourceOptimization']> {
    const studentTeacherRatio = data.totalStudents / data.totalTeachers
    const studentsPerGrade = Math.round(data.totalStudents / data.totalGrades)
    const optimalRatio = 22
    
    const teacherAllocation: string[] = []
    const ratioDiff = studentTeacherRatio - optimalRatio
    
    if (ratioDiff > 5) {
      const additionalTeachersNeeded = Math.round((studentTeacherRatio - optimalRatio) / optimalRatio * data.totalTeachers)
      teacherAllocation.push(`Urgent: Hire ${additionalTeachersNeeded} additional teachers to meet optimal ${optimalRatio}:1 ratio`)
    } else if (ratioDiff > 0) {
      teacherAllocation.push(`Recommend hiring ${Math.round(ratioDiff)} teachers to reach optimal ${optimalRatio}:1 ratio`)
    } else if (ratioDiff < -5) {
      teacherAllocation.push(`Teacher surplus detected - consider reassignment to support programs`)
    }
    
    teacherAllocation.push(`Current ratio: ${studentTeacherRatio.toFixed(1)}:1 (Optimal: ${optimalRatio}:1)`)
    teacherAllocation.push(`Average ${studentsPerGrade} students per grade`)
    
    const classroomUtilization: string[] = []
    const avgClassSize = studentsPerGrade
    
    if (avgClassSize > 35) {
      classroomUtilization.push(`Critical: Average class size (${avgClassSize}) exceeds recommended limit of 35`)
      classroomUtilization.push(`Consider splitting large classes or adding sections`)
    } else if (avgClassSize > 30) {
      classroomUtilization.push(`Moderate: Class sizes approaching optimal capacity (current: ${avgClassSize})`)
    } else if (avgClassSize < 20) {
      classroomUtilization.push(`Underutilized classrooms - consider consolidating sections`)
    } else {
      classroomUtilization.push(`Optimal class size distribution (${avgClassSize} students per class)`)
    }
    
    classroomUtilization.push(`Daily attendance: ${data.presentToday}/${data.totalStudents} students present`)
    
    const resourceRecommendations: string[] = []
    const booksPerStudent = data.libraryBooks / data.totalStudents
    
    if (data.libraryData) {
      const { borrowedBooks, activeBorrowers, overdueBooks, popularSubjects, readingLevels } = data.libraryData
      const borrowingRate = activeBorrowers / data.totalStudents
      const overdueRate = overdueBooks / Math.max(1, borrowedBooks)
      
      if (borrowingRate < 0.3) {
        resourceRecommendations.push(`Low library engagement: Only ${(borrowingRate * 100).toFixed(0)}% of students actively borrow books`)
        resourceRecommendations.push(`Launch reading incentive programs to boost library usage`)
      }
      
      if (overdueRate > 0.15) {
        resourceRecommendations.push(`High overdue rate: ${overdueBooks} overdue books (${(overdueRate * 100).toFixed(0)}% of borrowed)`)
        resourceRecommendations.push(`Implement automated reminders and review loan policies`)
      }
      
      if (popularSubjects.length > 0) {
        const topSubject = popularSubjects[0]
        const topSubjectCount = topSubject.count
        const popularSubjectShare = (topSubjectCount / Math.max(1, borrowedBooks)) * 100
        
        if (popularSubjectShare > 40) {
          resourceRecommendations.push(`Subject imbalance: ${topSubject.subject} accounts for ${popularSubjectShare.toFixed(0)}% of borrows`)
          resourceRecommendations.push(`Diversify collection in ${popularSubjects.slice(1).map(s => s.subject).join(', ')}`)
        }
      }
      
      if (booksPerStudent < 5) {
        resourceRecommendations.push(`Expand library: Only ${booksPerStudent.toFixed(1)} books per student (target: 10+)`)
        resourceRecommendations.push(`Acquire ${Math.round((10 - booksPerStudent) * data.totalStudents)} additional books`)
      } else if (booksPerStudent < 8) {
        resourceRecommendations.push(`Library adequate but could be expanded (current: ${booksPerStudent.toFixed(1)} books/student)`)
      } else {
        resourceRecommendations.push(`Library resources well-maintained (${booksPerStudent.toFixed(1)} books per student)`)
      }
    } else {
      if (booksPerStudent < 5) {
        resourceRecommendations.push(`Expand library: Only ${booksPerStudent.toFixed(1)} books per student (target: 10+)`)
        resourceRecommendations.push(`Acquire ${Math.round((10 - booksPerStudent) * data.totalStudents)} additional books`)
      } else if (booksPerStudent < 8) {
        resourceRecommendations.push(`Library adequate but could be expanded (current: ${booksPerStudent.toFixed(1)} books/student)`)
      } else {
        resourceRecommendations.push(`Library resources well-maintained (${booksPerStudent.toFixed(1)} books per student)`)
      }
    }
    
    if (data.studentPerformanceData) {
      const { lowPerformingStudents, highPerformingStudents, subjectsNeedingAttention } = data.studentPerformanceData
      
      if (lowPerformingStudents > data.totalStudents * 0.2) {
        resourceRecommendations.push(`Performance concern: ${lowPerformingStudents} students below grade level`)
        resourceRecommendations.push(`Deploy remedial resources and consider additional tutoring staff`)
      }
      
      if (highPerformingStudents > data.totalStudents * 0.1) {
        resourceRecommendations.push(`Gifted program opportunity: ${highPerformingStudents} high-performing students`)
        resourceRecommendations.push(`Allocate resources for advanced enrichment activities`)
      }
      
      if (subjectsNeedingAttention.length > 0) {
        const criticalSubjects = subjectsNeedingAttention.filter(s => s.average < 60)
        if (criticalSubjects.length > 0) {
          resourceRecommendations.push(`Critical subjects: ${criticalSubjects.map(s => s.subject).join(', ')} below 60%`)
          resourceRecommendations.push(`Prioritize teacher training and learning materials for these subjects`)
        }
      }
    }
    
    const vehiclesPerStudent = data.transportVehicles / data.totalStudents
    if (vehiclesPerStudent < 0.02 && data.totalStudents > 100) {
      resourceRecommendations.push(`Transport limited: ${data.transportVehicles} vehicles for ${data.totalStudents} students`)
      resourceRecommendations.push(`Consider adding 1-2 transport vehicles for improved coverage`)
    }
    
    if (data.upcomingExams > 8) {
      resourceRecommendations.push(`High exam load: ${data.upcomingExams} upcoming exams require adequate invigilation`)
      resourceRecommendations.push(`Ensure exam hall capacity and invigilator availability`)
    } else if (data.upcomingExams > 5) {
      resourceRecommendations.push(`Moderate exam schedule - verify invigilator assignments`)
    }
    
    if (data.attendanceRate < 0.75) {
      resourceRecommendations.push('Implement attendance improvement programs and parent engagement')
    }
    
    if (resourceRecommendations.length === 0) {
      resourceRecommendations.push('Resource allocation optimized across all departments')
    }

    return {
      teacherAllocation,
      classroomUtilization,
      resourceRecommendations
    }
  }

  async generateDashboardPredictions(data?: DashboardData): Promise<DashboardPrediction> {
    const dashboardData = data || await this.loadDashboardData()
    const [enrollmentTrends, dropoutRisk, resourceOptimization] = await Promise.all([
      this.predictEnrollmentTrends(dashboardData),
      this.analyzeDropoutRisk(dashboardData),
      this.optimizeResources(dashboardData)
    ])

    return {
      enrollmentTrends,
      dropoutRisk,
      resourceOptimization
    }
  }

  async validateDataQuality(data: DashboardData): Promise<{ isValid: boolean; issues: string[] }> {
    const validation = validateDashboardData(data)

    if (!validation.isValid) {
      console.warn('Dashboard data validation issues:', validation.issues)
      console.warn('Dashboard data validation warnings:', validation.warnings)
    }

    const additionalIssues: string[] = []

    if (!data.historicalData || data.historicalData.enrollments.length < 2) {
      additionalIssues.push('Insufficient historical enrollment data for accurate predictions')
    }

    if (!data.historicalData || data.historicalData.attendance.length < 7) {
      additionalIssues.push('Insufficient attendance history (less than 7 days)')
    }

    if (data.historicalData?.performance && data.historicalData.performance.length === 0) {
      additionalIssues.push('No performance data available')
    }

    const allIssues = [...validation.issues, ...additionalIssues]

    return {
      isValid: allIssues.length === 0,
      issues: allIssues
    }
  }
}

export const dashboardPredictionService = new DashboardPredictionService()

import { DashboardPrediction } from '../types'
import { db } from '@/lib/db'
import { validateDashboardData, validateStudentData, validateAttendanceRecords, validateExamResults } from '../utils/data-validation'
import { createGeminiClient } from '../gemini-client'

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

const geminiClient = createGeminiClient('gemini-2.0-flash', {
  temperature: 0.4,
  maxOutputTokens: 1024
})

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
        select: {
          id: true,
          studentId: true,
          marksObtained: true,
          percentage: true,
          grade: true,
          examPaper: {
            select: {
              totalMarks: true,
              examDate: true,
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
        select: {
          id: true,
          studentId: true,
          status: true,
          dueDate: true,
          book: {
            select: {
              category: true
            }
          }
        },
        take: 1000
      }),
      db.examResult.findMany({
        select: {
          id: true,
          studentId: true,
          percentage: true,
          examPaper: {
            select: {
              examDate: true,
              subject: { select: { name: true } }
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

  private async getAIInsights(prompt: string): Promise<string | null> {
    try {
      const response = await geminiClient.generateText(prompt)
      if (response.success && response.data) {
        return response.data.trim()
      }
      return null
    } catch (error) {
      console.error('AI insights error:', error)
      return null
    }
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

    const aiPrompt = `You are an educational data analyst. Analyze these enrollment metrics and provide concise, data-driven insights:

Current Data:
- Total Students: ${data.totalStudents}
- Recent Weekly Enrollments: ${data.recentEnrollments}
- Historical Trend: ${trend}
- Statistical Projections:
  * Next Month Change: ${projectedNextMonth - data.totalStudents}
  * Next Quarter Change: ${projectedNextQuarter - data.totalStudents}
  * Next Year Change: ${projectedNextYear - data.totalStudents}
- Confidence: ${confidence.toFixed(2)}
- Historical Enrollment Count: ${enrollmentCounts.join(', ')}

Provide analysis in JSON format:
{
  "refinedNextMonth": number (adjusted projection),
  "refinedNextQuarter": number (adjusted projection),
  "refinedNextYear": number (adjusted projection),
  "keyFactors": string[] (3-4 key drivers),
  "recommendations": string[] (2-3 actionable items)
}`

    const aiInsights = await this.getAIInsights(aiPrompt)

    let refinedNextMonth = projectedNextMonth - data.totalStudents
    let refinedNextQuarter = projectedNextQuarter - data.totalStudents
    let refinedNextYear = projectedNextYear - data.totalStudents
    let keyFactors: string[] = []
    let recommendations: string[] = []

    if (aiInsights) {
      try {
        const aiData = JSON.parse(aiInsights)
        if (typeof aiData.refinedNextMonth === 'number') refinedNextMonth = Math.round(aiData.refinedNextMonth)
        if (typeof aiData.refinedNextQuarter === 'number') refinedNextQuarter = Math.round(aiData.refinedNextQuarter)
        if (typeof aiData.refinedNextYear === 'number') refinedNextYear = Math.round(aiData.refinedNextYear)
        if (Array.isArray(aiData.keyFactors)) keyFactors = aiData.keyFactors.slice(0, 4)
        if (Array.isArray(aiData.recommendations)) recommendations = aiData.recommendations.slice(0, 3)
      } catch (e) {
        console.warn('AI insights parse error, using statistical baseline')
      }
    }

    return {
      nextMonth: refinedNextMonth,
      nextQuarter: refinedNextQuarter,
      nextYear: refinedNextYear,
      trend,
      confidence,
      keyFactors,
      recommendations
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

    const aiPrompt = `You are an educational risk assessment expert. Analyze dropout risk metrics:

Current Data:
- Total Students: ${data.totalStudents}
- Attendance Rate: ${(data.attendanceRate * 100).toFixed(1)}%
- Student-Teacher Ratio: ${studentTeacherRatio.toFixed(1)}:1
- Risk Score: ${totalRiskScore.toFixed(2)}
- Statistical Risk Distribution:
  * High Risk: ${highRisk} students
  * Medium Risk: ${mediumRisk} students
  * Low Risk: ${lowRisk} students
- Risk Factors: ${riskFactors.join(', ')}
- Performance Trends: ${performanceTrends.length > 0 ? performanceTrends.map(p => `${p.average.toFixed(1)}%`).join(', ') : 'N/A'}

Provide analysis in JSON format:
{
  "refinedHighRisk": number (adjusted count),
  "refinedMediumRisk": number (adjusted count),
  "refinedLowRisk": number (adjusted count),
  "interventionStrategies": string[] (3-4 targeted interventions),
  "earlyWarningIndicators": string[] (2-3 key indicators)
}`

    const aiInsights = await this.getAIInsights(aiPrompt)

    let refinedHighRisk = highRisk
    let refinedMediumRisk = mediumRisk
    let refinedLowRisk = lowRisk
    let interventionStrategies: string[] = []
    let earlyWarningIndicators: string[] = []

    if (aiInsights) {
      try {
        const aiData = JSON.parse(aiInsights)
        if (typeof aiData.refinedHighRisk === 'number') refinedHighRisk = Math.round(aiData.refinedHighRisk)
        if (typeof aiData.refinedMediumRisk === 'number') refinedMediumRisk = Math.round(aiData.refinedMediumRisk)
        if (typeof aiData.refinedLowRisk === 'number') refinedLowRisk = Math.round(aiData.refinedLowRisk)
        if (Array.isArray(aiData.interventionStrategies)) interventionStrategies = aiData.interventionStrategies.slice(0, 4)
        if (Array.isArray(aiData.earlyWarningIndicators)) earlyWarningIndicators = aiData.earlyWarningIndicators.slice(0, 3)
      } catch (e) {
        console.warn('AI insights parse error, using statistical baseline')
      }
    }

    return {
      highRiskStudents: Math.max(0, refinedHighRisk),
      mediumRiskStudents: Math.max(0, refinedMediumRisk),
      lowRiskStudents: Math.max(0, refinedLowRisk),
      riskFactors,
      interventionStrategies,
      earlyWarningIndicators
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

    const aiInsights = await this.getAIInsights(
      `You are a school resource optimization AI assistant analyzing resource allocation data.

Current School Metrics (100% data-driven from database):
- Total Students: ${data.totalStudents}
- Total Teachers: ${data.totalTeachers}
- Total Grades: ${data.totalGrades}
- Student-Teacher Ratio: ${studentTeacherRatio.toFixed(1)}:1 (Optimal: 22:1)
- Students Per Grade: ${studentsPerGrade}
- Daily Attendance: ${data.presentToday}/${data.totalStudents} (${(data.attendanceRate * 100).toFixed(1)}%)
- Library Books: ${data.libraryBooks} total, ${(data.libraryBooks / data.totalStudents).toFixed(1)} per student
- Upcoming Exams: ${data.upcomingExams}
- Transport Vehicles: ${data.transportVehicles}
- Library Data: ${data.libraryData ? `${data.libraryData.borrowedBooks} borrowed, ${data.libraryData.overdueBooks} overdue, ${data.libraryData.activeBorrowers} active borrowers, ${data.libraryData.popularSubjects.map(s => s.subject).join(', ')} popular subjects` : 'N/A'}
- Performance Data: ${data.studentPerformanceData ? `${data.studentPerformanceData.lowPerformingStudents} low performing, ${data.studentPerformanceData.highPerformingStudents} high performing students` : 'N/A'}
- Subjects Needing Attention: ${data.studentPerformanceData?.subjectsNeedingAttention.map(s => `${s.subject} (${s.average.toFixed(1)}%)`).join(', ') || 'None'}

Analyze resource allocation and provide optimization recommendations. Consider:
1. Teacher allocation efficiency and hiring priorities
2. Classroom utilization and space optimization
3. Library engagement and collection balance
4. Transportation capacity and coverage
5. Academic support resource deployment
6. Cross-departmental resource sharing opportunities

Return as JSON:
{
  "teacherAllocation": ["recommendation1", "recommendation2", "recommendation3", "recommendation4"],
  "classroomUtilization": ["insight1", "insight2", "insight3", "insight4"],
  "resourceRecommendations": ["action1", "action2", "action3", "action4", "action5"]
}

Return ONLY the JSON, no other text.`
    )

    if (aiInsights) {
      try {
        const aiData = JSON.parse(aiInsights)
        if (Array.isArray(aiData.teacherAllocation) && aiData.teacherAllocation.length > 0) teacherAllocation.splice(0, teacherAllocation.length, ...aiData.teacherAllocation.slice(0, 4))
        if (Array.isArray(aiData.classroomUtilization) && aiData.classroomUtilization.length > 0) classroomUtilization.splice(0, classroomUtilization.length, ...aiData.classroomUtilization.slice(0, 4))
        if (Array.isArray(aiData.resourceRecommendations) && aiData.resourceRecommendations.length > 0) resourceRecommendations.splice(0, resourceRecommendations.length, ...aiData.resourceRecommendations.slice(0, 5))
      } catch (e) {
        console.warn('AI insights parse error, using statistical baseline')
      }
    }

    return {
      teacherAllocation,
      classroomUtilization,
      resourceRecommendations
    }
  }

  async predictPerformanceTrends(data: DashboardData): Promise<DashboardPrediction['performancePredictions']> {
    const performanceHistory = data.historicalData?.performance || []
    
    if (performanceHistory.length === 0) {
      return {
        nextWeekAverage: 0,
        nextMonthAverage: 0,
        topPerformingGrades: [],
        gradesNeedingAttention: [],
        subjectInsights: []
      }
    }

    const avgPerformance = performanceHistory.reduce((sum, p) => sum + p.average, 0) / performanceHistory.length
    const sortedByPerformance = [...performanceHistory].sort((a, b) => b.average - a.average)
    const topPerformingGrades = sortedByPerformance.slice(0, 3).map(g => ({
      grade: g.grade,
      average: Math.round(g.average)
    }))

    const gradesNeedingAttention = sortedByPerformance.filter(g => g.average < 65).map(g => ({
      grade: g.grade,
      average: Math.round(g.average),
      improvement: g.average < 50 ? 'Critical intervention needed' : 'Moderate support required'
    }))

    const subjectInsights = performanceHistory.map(p => ({
      subject: p.grade,
      average: Math.round(p.average),
      trend: p.average > avgPerformance + 5 ? 'improving' : p.average < avgPerformance - 5 ? 'declining' : 'stable' as const
    }))

    const recentTrend = performanceHistory.slice(-3)
    let trendModifier = 0
    if (recentTrend.length >= 2) {
      const latestAvg = recentTrend.reduce((sum, p) => sum + p.average, 0) / recentTrend.length
      trendModifier = (latestAvg - avgPerformance) * 0.3
    }

    const aiPrompt = `You are an academic performance analyst. Analyze these performance metrics:

Current Data:
- Total Students: ${data.totalStudents}
- Average Performance: ${avgPerformance.toFixed(1)}%
- Historical Performance: ${performanceHistory.map(p => `${p.grade}: ${p.average.toFixed(1)}%`).join(', ')}
- Top Performing Grades: ${topPerformingGrades.map(g => `${g.grade} (${g.average}%)`).join(', ')}
- Grades Needing Attention: ${gradesNeedingAttention.map(g => `${g.grade} (${g.average}%)`).join(', ')}
- Trend Modifier: ${trendModifier.toFixed(2)}
- Statistical Projections:
  * Next Week: ${Math.max(0, Math.min(100, Math.round(avgPerformance + trendModifier * 0.2)))}%
  * Next Month: ${Math.max(0, Math.min(100, Math.round(avgPerformance + trendModifier)))}%

Provide analysis in JSON format:
{
  "refinedNextWeek": number (adjusted projection 0-100),
  "refinedNextMonth": number (adjusted projection 0-100),
  "performanceDrivers": string[] (3-4 key factors),
  "interventionRecommendations": string[] (2-3 actionable items)
}`

    const aiInsights = await this.getAIInsights(aiPrompt)

    let refinedNextWeek = Math.max(0, Math.min(100, Math.round(avgPerformance + trendModifier * 0.2)))
    let refinedNextMonth = Math.max(0, Math.min(100, Math.round(avgPerformance + trendModifier)))
    let performanceDrivers: string[] = []
    let interventionRecommendations: string[] = []

    if (aiInsights) {
      try {
        const aiData = JSON.parse(aiInsights)
        if (typeof aiData.refinedNextWeek === 'number') refinedNextWeek = Math.max(0, Math.min(100, Math.round(aiData.refinedNextWeek)))
        if (typeof aiData.refinedNextMonth === 'number') refinedNextMonth = Math.max(0, Math.min(100, Math.round(aiData.refinedNextMonth)))
        if (Array.isArray(aiData.performanceDrivers)) performanceDrivers = aiData.performanceDrivers.slice(0, 4)
        if (Array.isArray(aiData.interventionRecommendations)) interventionRecommendations = aiData.interventionRecommendations.slice(0, 3)
      } catch (e) {
        console.warn('AI insights parse error, using statistical baseline')
      }
    }

    return {
      nextWeekAverage: refinedNextWeek,
      nextMonthAverage: refinedNextMonth,
      topPerformingGrades,
      gradesNeedingAttention,
      subjectInsights,
      performanceDrivers,
      interventionRecommendations
    }
  }

  async analyzeAttendancePatterns(data: DashboardData): Promise<DashboardPrediction['attendancePatterns']> {
    const attendanceHistory = data.historicalData?.attendance || []
    
    const todayPrediction = {
      present: data.presentToday,
      absent: data.totalStudents - data.presentToday,
      rate: data.attendanceRate
    }

    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const weeklyTrend = attendanceHistory.slice(-7).map(a => ({
      day: daysOfWeek[new Date(a.date).getDay()],
      rate: Math.round(a.rate * 100)
    }))

    const recentRates = attendanceHistory.slice(-14).map(a => a.rate)
    const avgRecentRate = recentRates.length > 0 
      ? recentRates.reduce((sum, r) => sum + r, 0) / recentRates.length 
      : data.attendanceRate

    const trend = recentRates.length >= 2
      ? (recentRates[recentRates.length - 1] - recentRates[0]) / recentRates.length
      : 0

    const predictedNextWeek = Math.max(0, Math.min(100, Math.round((avgRecentRate + trend) * 100)))

    const patternInsights: string[] = []
    if (data.attendanceRate < 0.75) {
      patternInsights.push('Critical: Attendance rate below 75% threshold')
    } else if (data.attendanceRate < 0.85) {
      patternInsights.push('Warning: Attendance rate approaching concerning levels')
    } else if (data.attendanceRate > 0.95) {
      patternInsights.push('Excellent: High attendance rate maintained')
    }

    if (trend < -0.02) {
      patternInsights.push('Declining attendance trend detected')
    } else if (trend > 0.02) {
      patternInsights.push('Improving attendance trend observed')
    }

    const atRiskStudents = Math.round(data.totalStudents * (1 - avgRecentRate) * 0.3)

    const aiPrompt = `You are an attendance pattern analyst. Analyze these attendance metrics:

Current Data:
- Total Students: ${data.totalStudents}
- Present Today: ${data.presentToday}
- Current Attendance Rate: ${(data.attendanceRate * 100).toFixed(1)}%
- Average Recent Rate: ${(avgRecentRate * 100).toFixed(1)}%
- Trend: ${trend.toFixed(4)}
- Weekly Trend Data: ${weeklyTrend.map(t => `${t.day}: ${t.rate}%`).join(', ')}
- Statistical Next Week Prediction: ${predictedNextWeek}%
- At-Risk Students (statistical): ${atRiskStudents}

Provide analysis in JSON format:
{
  "refinedNextWeek": number (adjusted projection 0-100),
  "refinedAtRiskStudents": number (adjusted count),
  "attendanceDrivers": string[] (3-4 key factors),
  "improvementStrategies": string[] (2-3 actionable items)
}`

    const aiInsights = await this.getAIInsights(aiPrompt)

    let refinedNextWeek = predictedNextWeek
    let refinedAtRiskStudents = atRiskStudents
    let attendanceDrivers: string[] = []
    let improvementStrategies: string[] = []

    if (aiInsights) {
      try {
        const aiData = JSON.parse(aiInsights)
        if (typeof aiData.refinedNextWeek === 'number') refinedNextWeek = Math.max(0, Math.min(100, Math.round(aiData.refinedNextWeek)))
        if (typeof aiData.refinedAtRiskStudents === 'number') refinedAtRiskStudents = Math.round(aiData.refinedAtRiskStudents)
        if (Array.isArray(aiData.attendanceDrivers)) attendanceDrivers = aiData.attendanceDrivers.slice(0, 4)
        if (Array.isArray(aiData.improvementStrategies)) improvementStrategies = aiData.improvementStrategies.slice(0, 3)
      } catch (e) {
        console.warn('AI insights parse error, using statistical baseline')
      }
    }

    return {
      todayPrediction,
      weeklyTrend,
      predictedNextWeek: refinedNextWeek,
      patternInsights,
      atRiskStudents: refinedAtRiskStudents,
      attendanceDrivers,
      improvementStrategies
    }
  }

  async analyzeTeacherEffectiveness(data: DashboardData): Promise<DashboardPrediction['teacherEffectiveness']> {
    try {
      const teacherPerformance = await db.teacher.findMany({
        where: { status: 'Active' },
        include: {
          examPapers: {
            include: {
              examResults: true
            }
          }
        }
      })

      const teacherScores = teacherPerformance.map(teacher => {
        if (!teacher.examPapers || teacher.examPapers.length === 0) {
          return {
            name: `${teacher.firstName} ${teacher.lastName}`,
            effectiveness: 0,
            subject: teacher.subject || 'General'
          }
        }

        const allResults = teacher.examPapers.flatMap(paper => paper.examResults)
        if (allResults.length === 0) {
          return {
            name: `${teacher.firstName} ${teacher.lastName}`,
            effectiveness: 0,
            subject: teacher.subject || 'General'
          }
        }

        const avgScore = allResults.reduce((sum, r) => sum + (r.percentage || 0), 0) / allResults.length
        const passRate = allResults.filter(r => (r.percentage || 0) >= 40).length / allResults.length

        const effectiveness = (avgScore / 100) * 0.6 + passRate * 0.4

        return {
          name: `${teacher.firstName} ${teacher.lastName}`,
          effectiveness: Math.round(effectiveness * 100) / 100,
          subject: teacher.subject || 'General'
        }
      })

      const sortedTeachers = teacherScores.sort((a, b) => b.effectiveness - a.effectiveness)
      const topTeachers = sortedTeachers.slice(0, 5)
      const teachersNeedingSupport = sortedTeachers.filter(t => t.effectiveness < 0.65).slice(0, 5).map(t => ({
        ...t,
        suggestions: [
          'Review teaching methodologies',
          'Attend professional development workshops',
          'Consider mentorship program'
        ]
      }))

      const overallEffectiveness = sortedTeachers.length > 0
        ? sortedTeachers.reduce((sum, t) => sum + t.effectiveness, 0) / sortedTeachers.length
        : 0

      const aiPrompt = `You are a teacher performance analyst. Analyze these teacher effectiveness metrics:

Current Data:
- Total Teachers: ${teacherPerformance.length}
- Overall Effectiveness: ${(overallEffectiveness * 100).toFixed(1)}%
- Top Teachers: ${topTeachers.map(t => `${t.name} (${t.subject}): ${(t.effectiveness * 100).toFixed(1)}%`).join(', ')}
- Teachers Needing Support: ${teachersNeedingSupport.map(t => `${t.name} (${t.subject}): ${(t.effectiveness * 100).toFixed(1)}%`).join(', ')}
- Student-Teacher Ratio: ${(data.totalStudents / data.totalTeachers).toFixed(1)}:1

Provide analysis in JSON format:
{
  "effectivenessFactors": string[] (3-4 key factors),
  "professionalDevelopmentNeeds": string[] (2-3 training areas),
  "collaborationOpportunities": string[] (2-3 suggestions)
}`

      const aiInsights = await this.getAIInsights(aiPrompt)

      let effectivenessFactors: string[] = []
      let professionalDevelopmentNeeds: string[] = []
      let collaborationOpportunities: string[] = []

      if (aiInsights) {
        try {
          const aiData = JSON.parse(aiInsights)
          if (Array.isArray(aiData.effectivenessFactors)) effectivenessFactors = aiData.effectivenessFactors.slice(0, 4)
          if (Array.isArray(aiData.professionalDevelopmentNeeds)) professionalDevelopmentNeeds = aiData.professionalDevelopmentNeeds.slice(0, 3)
          if (Array.isArray(aiData.collaborationOpportunities)) collaborationOpportunities = aiData.collaborationOpportunities.slice(0, 3)
        } catch (e) {
          console.warn('AI insights parse error, using statistical baseline')
        }
      }

      return {
        topTeachers,
        teachersNeedingSupport,
        overallEffectiveness: Math.round(overallEffectiveness * 100) / 100,
        effectivenessFactors,
        professionalDevelopmentNeeds,
        collaborationOpportunities
      }
    } catch (error) {
      return {
        topTeachers: [],
        teachersNeedingSupport: [],
        overallEffectiveness: 0
      }
    }
  }

  async generateAlerts(data: DashboardData): Promise<DashboardPrediction['alerts']> {
    const alerts: DashboardPrediction['alerts'] = []

    if (data.attendanceRate < 0.7) {
      alerts.push({
        type: 'urgent',
        title: 'Critical Attendance Drop',
        message: `Attendance rate has dropped to ${(data.attendanceRate * 100).toFixed(1)}%`,
        action: 'Review attendance records and initiate parent engagement'
      })
    } else if (data.attendanceRate < 0.85) {
      alerts.push({
        type: 'warning',
        title: 'Attendance Concern',
        message: `Attendance rate at ${(data.attendanceRate * 100).toFixed(1)}% requires attention`,
        action: 'Monitor and identify students with chronic absenteeism'
      })
    }

    const studentTeacherRatio = data.totalStudents / data.totalTeachers
    if (studentTeacherRatio > 30) {
      alerts.push({
        type: 'urgent',
        title: 'High Student-Teacher Ratio',
        message: `Current ratio is ${studentTeacherRatio.toFixed(1)}:1, exceeding recommended limits`,
        action: 'Consider hiring additional teaching staff'
      })
    }

    if (data.upcomingExams > 10) {
      alerts.push({
        type: 'warning',
        title: 'Heavy Exam Schedule',
        message: `${data.upcomingExams} exams scheduled in the next 30 days`,
        action: 'Verify exam hall capacity and invigilator assignments'
      })
    }

    if (data.libraryData && data.libraryData.overdueBooks > 10) {
      alerts.push({
        type: 'info',
        title: 'Library Overdue Books',
        message: `${data.libraryData.overdueBooks} books are overdue`,
        action: 'Send reminders to students and review loan policies'
      })
    }

    if (data.studentPerformanceData?.lowPerformingStudents && data.studentPerformanceData.lowPerformingStudents > data.totalStudents * 0.25) {
      alerts.push({
        type: 'urgent',
        title: 'Academic Performance Concern',
        message: `${data.studentPerformanceData.lowPerformingStudents} students are below grade level`,
        action: 'Deploy remedial resources and consider tutoring programs'
      })
    }

    const aiInsights = await this.getAIInsights(
      `You are a school administration AI assistant analyzing operational data to generate context-aware alerts.

Current School Metrics (100% data-driven from database):
- Total Students: ${data.totalStudents}
- Total Teachers: ${data.totalTeachers}
- Student-Teacher Ratio: ${studentTeacherRatio.toFixed(1)}:1
- Attendance Rate: ${(data.attendanceRate * 100).toFixed(1)}%
- Recent Enrollments: ${data.recentEnrollments}
- Upcoming Exams: ${data.upcomingExams}
- Transport Vehicles: ${data.transportVehicles}
- Library Data: ${data.libraryData ? `${data.libraryData.borrowedBooks} books borrowed, ${data.libraryData.overdueBooks} overdue` : 'N/A'}
- Performance: ${data.studentPerformanceData ? `${data.studentPerformanceData.highPerformingStudents} high performing, ${data.studentPerformanceData.lowPerformingStudents} low performing students` : 'N/A'}
- Subjects Needing Attention: ${data.studentPerformanceData?.subjectsNeedingAttention?.map(s => s.subject).join(', ') || 'None'}

Generate context-aware alerts that consider multiple factors together. Provide:
1. Alerts with prioritized urgency levels (urgent, warning, info)
2. Specific, actionable recommendations that address root causes
3. Consider combined impact of multiple metrics

Return as JSON array:
[
  {
    "type": "urgent|warning|info",
    "title": "Alert title",
    "message": "Detailed explanation",
    "action": "Specific actionable step (or null if none)"
  }
]

Limit to 5 most important alerts. Return ONLY the JSON array, no other text.`
    )

    if (aiInsights) {
      try {
        const aiData = JSON.parse(aiInsights)
        if (Array.isArray(aiData) && aiData.length > 0) {
          return aiData.slice(0, 5)
        }
      } catch (e) {
        console.warn('AI alerts parse error, using statistical baseline')
      }
    }

    return alerts
  }

  async generateInsights(data: DashboardData): Promise<DashboardPrediction['insights']> {
    const keyHighlights: string[] = []
    const opportunities: string[] = []
    const priorities: DashboardPrediction['insights']['priorities'] = []

    if (data.attendanceRate >= 0.9) {
      keyHighlights.push(`Excellent attendance rate of ${(data.attendanceRate * 100).toFixed(1)}%`)
    }

    if (data.recentEnrollments > 0) {
      keyHighlights.push(`${data.recentEnrollments} new students enrolled this week`)
    }

    if (data.libraryData?.activeBorrowers && data.libraryData.activeBorrowers > data.totalStudents * 0.5) {
      keyHighlights.push(`Strong library engagement with ${data.libraryData.activeBorrowers} active readers`)
    }

    if (data.studentPerformanceData?.highPerformingStudents && data.studentPerformanceData.highPerformingStudents > data.totalStudents * 0.2) {
      keyHighlights.push(`${data.studentPerformanceData.highPerformingStudents} students achieving high academic standards`)
    }

    const studentTeacherRatio = data.totalStudents / data.totalTeachers
    if (studentTeacherRatio > 25) {
      opportunities.push('Opportunity to improve student-teacher ratio by hiring additional staff')
      priorities.push({
        title: 'Reduce student-teacher ratio',
        urgency: 'medium'
      })
    }

    if (data.libraryData && data.libraryData.borrowedBooks < data.totalStudents * 0.3) {
      opportunities.push('Increase library engagement through reading programs and book clubs')
      priorities.push({
        title: 'Boost library participation',
        urgency: 'low'
      })
    }

    if (data.studentPerformanceData?.subjectsNeedingAttention && data.studentPerformanceData.subjectsNeedingAttention.length > 0) {
      opportunities.push(`Support subjects needing attention: ${data.studentPerformanceData.subjectsNeedingAttention.map(s => s.subject).join(', ')}`)
      priorities.push({
        title: 'Address underperforming subjects',
        urgency: 'high'
      })
    }

    if (data.transportVehicles < 5 && data.totalStudents > 200) {
      opportunities.push('Expand transportation fleet to improve student access')
      priorities.push({
        title: 'Expand transport capacity',
        urgency: 'medium'
      })
    }

    const aiInsights = await this.getAIInsights(
      `You are a strategic school administration AI assistant analyzing operational data to generate deep insights.

Current School Metrics (100% data-driven from database):
- Total Students: ${data.totalStudents}
- Total Teachers: ${data.totalTeachers}
- Student-Teacher Ratio: ${(data.totalStudents / data.totalTeachers).toFixed(1)}:1
- Attendance Rate: ${(data.attendanceRate * 100).toFixed(1)}%
- Recent Enrollments: ${data.recentEnrollments}
- Upcoming Exams: ${data.upcomingExams}
- Transport Vehicles: ${data.transportVehicles}
- Library Data: ${data.libraryData ? `${data.libraryData.borrowedBooks} books borrowed, ${data.libraryData.overdueBooks} overdue, ${data.libraryData.activeBorrowers} active borrowers` : 'N/A'}
- Performance: ${data.studentPerformanceData ? `${data.studentPerformanceData.highPerformingStudents} high performing, ${data.studentPerformanceData.lowPerformingStudents} low performing students` : 'N/A'}
- Subjects Needing Attention: ${data.studentPerformanceData?.subjectsNeedingAttention?.map(s => `${s.subject} (${s.average.toFixed(1)}% avg)`).join(', ') || 'None'}

Generate strategic insights that go beyond surface-level observations. Provide:
1. Key highlights with deeper analysis of why these metrics matter
2. Strategic opportunities with specific, actionable recommendations
3. Prioritized action items with clear urgency justification (urgent/medium/low)

Return as JSON:
{
  "keyHighlights": ["insight1", "insight2", "insight3", "insight4"],
  "opportunities": ["opportunity1", "opportunity2", "opportunity3", "opportunity4"],
  "priorities": [
    {"title": "priority1", "urgency": "urgent|medium|low"},
    {"title": "priority2", "urgency": "urgent|medium|low"},
    {"title": "priority3", "urgency": "urgent|medium|low"}
  ]
}

Return ONLY the JSON, no other text.`
    )

    if (aiInsights) {
      try {
        const aiData = JSON.parse(aiInsights)
        if (Array.isArray(aiData.keyHighlights) && aiData.keyHighlights.length > 0) keyHighlights.splice(0, keyHighlights.length, ...aiData.keyHighlights.slice(0, 4))
        if (Array.isArray(aiData.opportunities) && aiData.opportunities.length > 0) opportunities.splice(0, opportunities.length, ...aiData.opportunities.slice(0, 4))
        if (Array.isArray(aiData.priorities) && aiData.priorities.length > 0) priorities.splice(0, priorities.length, ...aiData.priorities.slice(0, 3))
      } catch (e) {
        console.warn('AI insights parse error, using statistical baseline')
      }
    }

    return {
      keyHighlights,
      opportunities,
      priorities
    }
  }

  async generateDashboardPredictions(data?: DashboardData): Promise<DashboardPrediction> {
    const dashboardData = data || await this.loadDashboardData()
    const [enrollmentTrends, dropoutRisk, resourceOptimization, performancePredictions, attendancePatterns, teacherEffectiveness, alerts, insights] = await Promise.all([
      this.predictEnrollmentTrends(dashboardData),
      this.analyzeDropoutRisk(dashboardData),
      this.optimizeResources(dashboardData),
      this.predictPerformanceTrends(dashboardData),
      this.analyzeAttendancePatterns(dashboardData),
      this.analyzeTeacherEffectiveness(dashboardData),
      this.generateAlerts(dashboardData),
      this.generateInsights(dashboardData)
    ])

    return {
      enrollmentTrends,
      dropoutRisk,
      resourceOptimization,
      performancePredictions,
      attendancePatterns,
      teacherEffectiveness,
      alerts,
      insights
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

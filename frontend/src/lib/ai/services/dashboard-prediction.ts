import { DashboardPrediction } from '../types'

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

  async generateDashboardPredictions(data: DashboardData): Promise<DashboardPrediction> {
    const [enrollmentTrends, dropoutRisk, resourceOptimization] = await Promise.all([
      this.predictEnrollmentTrends(data),
      this.analyzeDropoutRisk(data),
      this.optimizeResources(data)
    ])

    return {
      enrollmentTrends,
      dropoutRisk,
      resourceOptimization
    }
  }
}

export const dashboardPredictionService = new DashboardPredictionService()

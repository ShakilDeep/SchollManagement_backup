import { db } from '@/lib/db'

interface AttendanceMetrics {
  rate: number
  totalDays: number
  presentDays: number
  absentDays: number
  consecutiveAbsences: number
  trend: 'improving' | 'stable' | 'declining'
}

interface ExamPerformance {
  averageScore: number
  averagePercentage: number
  recentAverage: number
  trend: 'improving' | 'stable' | 'declining'
  consistency: number
  subjectBreakdown: Array<{
    subject: string
    average: number
    trend: 'improving' | 'stable' | 'declining'
  }>
  failingSubjects: number
  belowAverageSubjects: number
}

interface BehaviorAnalysis {
  totalPoints: number
  positivePoints: number
  negativePoints: number
  recentBehavior: 'improving' | 'stable' | 'declining'
  majorIncidents: number
  categories: Array<{
    category: string
    count: number
    points: number
  }>
}

interface DataQuality {
  attendanceDataPoints: number
  examDataPoints: number
  behaviorDataPoints: number
  timeSpanDays: number
  completeness: number
  consistency: number
}

interface StudentPredictionResult {
  studentId: string
  riskLevel: 'high' | 'medium' | 'low'
  riskFactors: string[]
  predictedGrade: string
  confidence: number
  recommendations: string[]
  metrics: {
    attendance: AttendanceMetrics
    performance: ExamPerformance
    behavior: BehaviorAnalysis
    dataQuality: DataQuality
  }
}

export class StudentPredictionService {
  async analyzeAttendance(studentId: string): Promise<AttendanceMetrics> {
    const attendances = await db.attendance.findMany({
      where: { studentId },
      orderBy: { date: 'desc' },
      take: 60
    })

    if (attendances.length === 0) {
      return {
        rate: 0,
        totalDays: 0,
        presentDays: 0,
        absentDays: 0,
        consecutiveAbsences: 0,
        trend: 'stable'
      }
    }

    const presentDays = attendances.filter(a => a.status === 'Present').length
    const absentDays = attendances.filter(a => a.status === 'Absent').length
    const rate = presentDays / attendances.length

    let consecutiveAbsences = 0
    let maxConsecutiveAbsences = 0
    for (const attendance of attendances.reverse()) {
      if (attendance.status === 'Absent') {
        consecutiveAbsences++
        maxConsecutiveAbsences = Math.max(maxConsecutiveAbsences, consecutiveAbsences)
      } else {
        consecutiveAbsences = 0
      }
    }

    const recentAttendance = attendances.slice(0, 10)
    const olderAttendance = attendances.slice(10, 20)
    const recentRate = recentAttendance.filter(a => a.status === 'Present').length / recentAttendance.length
    const olderRate = olderAttendance.length > 0 
      ? olderAttendance.filter(a => a.status === 'Present').length / olderAttendance.length
      : recentRate

    const trend = recentRate > olderRate + 0.05 ? 'improving' 
      : recentRate < olderRate - 0.05 ? 'declining' 
      : 'stable'

    return {
      rate,
      totalDays: attendances.length,
      presentDays,
      absentDays,
      consecutiveAbsences: maxConsecutiveAbsences,
      trend
    }
  }

  async analyzePerformance(studentId: string): Promise<ExamPerformance> {
    const examResults = await db.examResult.findMany({
      where: { studentId },
      include: { examPaper: { include: { subject: true } } },
      orderBy: { examPaper: { examDate: 'desc' } }
    })

    if (examResults.length === 0) {
      return {
        averageScore: 0,
        averagePercentage: 0,
        recentAverage: 0,
        trend: 'stable',
        consistency: 0,
        subjectBreakdown: [],
        failingSubjects: 0,
        belowAverageSubjects: 0
      }
    }

    const percentages = examResults.map(r => r.percentage)
    const averagePercentage = percentages.reduce((a, b) => a + b, 0) / percentages.length
    const averageScore = examResults.reduce((sum, r) => sum + r.marksObtained, 0) / examResults.length

    const recentResults = examResults.slice(0, 5)
    const recentAverage = recentResults.length > 0
      ? recentResults.reduce((sum, r) => sum + r.percentage, 0) / recentResults.length
      : averagePercentage

    const olderResults = examResults.slice(5, 10)
    const olderAverage = olderResults.length > 0
      ? olderResults.reduce((sum, r) => sum + r.percentage, 0) / olderResults.length
      : recentAverage

    const trend = recentAverage > olderAverage + 5 ? 'improving'
      : recentAverage < olderAverage - 5 ? 'declining'
      : 'stable'

    const variance = percentages.reduce((sum, p) => sum + Math.pow(p - averagePercentage, 2), 0) / percentages.length
    const consistency = Math.max(0, 1 - (Math.sqrt(variance) / 100))

    const subjectMap = new Map<string, number[]>()
    examResults.forEach(result => {
      const subject = result.examPaper.subject.name
      if (!subjectMap.has(subject)) {
        subjectMap.set(subject, [])
      }
      subjectMap.get(subject)!.push(result.percentage)
    })

    const subjectBreakdown = Array.from(subjectMap.entries()).map(([subject, scores]) => {
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length
      const recentScores = scores.slice(0, 3)
      const olderScores = scores.slice(3, 6)
      const recentAvg = recentScores.length > 0 ? recentScores.reduce((a, b) => a + b, 0) / recentScores.length : avg
      const olderAvg = olderScores.length > 0 ? olderScores.reduce((a, b) => a + b, 0) / olderScores.length : recentAvg
      
      return {
        subject,
        average: avg,
        trend: recentAvg > olderAvg + 5 ? 'improving'
          : recentAvg < olderAvg - 5 ? 'declining'
          : 'stable'
      }
    })

    const failingSubjects = subjectBreakdown.filter(s => s.average < 40).length
    const belowAverageSubjects = subjectBreakdown.filter(s => s.average < 60).length

    return {
      averageScore,
      averagePercentage,
      recentAverage,
      trend,
      consistency,
      subjectBreakdown,
      failingSubjects,
      belowAverageSubjects
    }
  }

  async analyzeBehavior(studentId: string): Promise<BehaviorAnalysis> {
    const behaviorRecords = await db.behaviorRecord.findMany({
      where: { studentId },
      orderBy: { date: 'desc' },
      take: 20
    })

    if (behaviorRecords.length === 0) {
      return {
        totalPoints: 0,
        positivePoints: 0,
        negativePoints: 0,
        recentBehavior: 'stable',
        majorIncidents: 0,
        categories: []
      }
    }

    const positivePoints = behaviorRecords
      .filter(r => r.points > 0)
      .reduce((sum, r) => sum + r.points, 0)
    const negativePoints = behaviorRecords
      .filter(r => r.points < 0)
      .reduce((sum, r) => sum + Math.abs(r.points), 0)

    const totalPoints = positivePoints - negativePoints

    const recentRecords = behaviorRecords.slice(0, 5)
    const olderRecords = behaviorRecords.slice(5, 10)
    const recentPoints = recentRecords.reduce((sum, r) => sum + r.points, 0)
    const olderPoints = olderRecords.length > 0 ? olderRecords.reduce((sum, r) => sum + r.points, 0) : recentPoints

    const recentBehavior = recentPoints > olderPoints + 2 ? 'improving'
      : recentPoints < olderPoints - 2 ? 'declining'
      : 'stable'

    const majorIncidents = behaviorRecords.filter(r => r.points <= -5).length

    const categoryMap = new Map<string, { count: number; points: number }>()
    behaviorRecords.forEach(record => {
      if (!categoryMap.has(record.category)) {
        categoryMap.set(record.category, { count: 0, points: 0 })
      }
      const cat = categoryMap.get(record.category)!
      cat.count++
      cat.points += record.points
    })

    const categories = Array.from(categoryMap.entries()).map(([category, data]) => ({
      category,
      count: data.count,
      points: data.points
    }))

    return {
      totalPoints,
      positivePoints,
      negativePoints,
      recentBehavior,
      majorIncidents,
      categories
    }
  }

  async analyzeDataQuality(
    studentId: string,
    attendanceDataPoints: number,
    examDataPoints: number,
    behaviorDataPoints: number
  ): Promise<DataQuality> {
    const student = await db.student.findUnique({
      where: { id: studentId },
      select: { admissionDate: true }
    })

    if (!student) {
      return {
        attendanceDataPoints,
        examDataPoints,
        behaviorDataPoints,
        timeSpanDays: 0,
        completeness: 0,
        consistency: 0
      }
    }

    const timeSpanDays = Math.floor((Date.now() - student.admissionDate.getTime()) / (1000 * 60 * 60 * 24))
    const expectedAttendanceDays = Math.max(1, timeSpanDays / 7 * 5)
    const expectedExams = Math.max(1, timeSpanDays / 30)

    const attendanceCompleteness = Math.min(1, attendanceDataPoints / expectedAttendanceDays)
    const examCompleteness = Math.min(1, examDataPoints / expectedExams)
    const behaviorCompleteness = Math.min(1, behaviorDataPoints / (timeSpanDays / 30))

    const completeness = (attendanceCompleteness * 0.4) + (examCompleteness * 0.4) + (behaviorCompleteness * 0.2)

    const consistency = Math.min(1, (attendanceDataPoints + examDataPoints) / (timeSpanDays / 10))

    return {
      attendanceDataPoints,
      examDataPoints,
      behaviorDataPoints,
      timeSpanDays,
      completeness,
      consistency
    }
  }

  calculateRiskLevel(
    attendance: AttendanceMetrics,
    performance: ExamPerformance,
    behavior: BehaviorAnalysis
  ): 'high' | 'medium' | 'low' {
    let riskScore = 0

    if (attendance.rate < 0.75) riskScore += 3
    else if (attendance.rate < 0.85) riskScore += 1

    if (attendance.consecutiveAbsences >= 5) riskScore += 2
    else if (attendance.consecutiveAbsences >= 3) riskScore += 1

    if (attendance.trend === 'declining') riskScore += 1

    if (performance.averagePercentage < 40) riskScore += 3
    else if (performance.averagePercentage < 60) riskScore += 1

    if (performance.trend === 'declining') riskScore += 2

    if (performance.failingSubjects >= 2) riskScore += 2
    else if (performance.failingSubjects >= 1) riskScore += 1

    if (performance.belowAverageSubjects >= 3) riskScore += 1

    if (behavior.totalPoints < -10) riskScore += 3
    else if (behavior.totalPoints < 0) riskScore += 1

    if (behavior.majorIncidents >= 2) riskScore += 2
    else if (behavior.majorIncidents >= 1) riskScore += 1

    if (behavior.recentBehavior === 'declining') riskScore += 1

    if (riskScore >= 7) return 'high'
    if (riskScore >= 4) return 'medium'
    return 'low'
  }

  generateRiskFactors(
    attendance: AttendanceMetrics,
    performance: ExamPerformance,
    behavior: BehaviorAnalysis
  ): string[] {
    const factors: string[] = []

    if (attendance.rate < 0.75) {
      factors.push(`Critical attendance rate: ${(attendance.rate * 100).toFixed(1)}%`)
    } else if (attendance.rate < 0.85) {
      factors.push(`Low attendance rate: ${(attendance.rate * 100).toFixed(1)}%`)
    }

    if (attendance.consecutiveAbsences >= 5) {
      factors.push(`${attendance.consecutiveAbsences} consecutive absences recorded`)
    } else if (attendance.consecutiveAbsences >= 3) {
      factors.push(`${attendance.consecutiveAbsences} consecutive absences`)
    }

    if (attendance.trend === 'declining') {
      factors.push('Attendance trend declining')
    }

    if (performance.averagePercentage < 40) {
      factors.push(`Critical performance: ${performance.averagePercentage.toFixed(1)}% average`)
    } else if (performance.averagePercentage < 60) {
      factors.push(`Below average performance: ${performance.averagePercentage.toFixed(1)}%`)
    }

    if (performance.trend === 'declining') {
      factors.push('Performance trend declining')
    }

    if (performance.failingSubjects >= 1) {
      factors.push(`Failing in ${performance.failingSubjects} subject(s)`)
    }

    if (performance.belowAverageSubjects >= 2) {
      factors.push(`Below average in ${performance.belowAverageSubjects} subject(s)`)
    }

    performance.subjectBreakdown.forEach(subject => {
      if (subject.average < 40) {
        factors.push(`Critical performance in ${subject.subject}: ${subject.average.toFixed(1)}%`)
      } else if (subject.average < 60 && subject.trend === 'declining') {
        factors.push(`Declining performance in ${subject.subject}`)
      }
    })

    if (behavior.totalPoints < -10) {
      factors.push(`Significant behavior concerns: ${behavior.totalPoints} points`)
    } else if (behavior.totalPoints < 0) {
      factors.push(`Behavior concerns: ${behavior.totalPoints} points`)
    }

    if (behavior.majorIncidents >= 1) {
      factors.push(`${behavior.majorIncidents} major behavior incident(s) recorded`)
    }

    if (behavior.recentBehavior === 'declining') {
      factors.push('Behavior trend declining')
    }

    if (factors.length === 0) {
      factors.push('No significant risk factors identified')
    }

    return factors.slice(0, 5)
  }

  predictGrade(performance: ExamPerformance, attendance: AttendanceMetrics): string {
    const weightedScore = (performance.recentAverage * 0.7) + (performance.averagePercentage * 0.3)

    if (attendance.rate < 0.75) {
      return 'D'
    } else if (attendance.rate < 0.85) {
      return Math.max('D', weightedScore < 50 ? 'D' : weightedScore < 60 ? 'C' : weightedScore < 75 ? 'B' : 'A')
    }

    if (weightedScore >= 80) return 'A'
    if (weightedScore >= 65) return 'B'
    if (weightedScore >= 50) return 'C'
    return 'D'
  }

  calculateConfidence(
    dataQuality: DataQuality,
    performance: ExamPerformance
  ): number {
    const dataScore = Math.min(1, dataQuality.completeness)
    const consistencyScore = performance.consistency
    const spanScore = Math.min(1, dataQuality.timeSpanDays / 90)

    const baseConfidence = (dataScore * 0.4) + (consistencyScore * 0.3) + (spanScore * 0.3)

    return Math.min(0.95, baseConfidence)
  }

  generateRecommendations(
    riskLevel: 'high' | 'medium' | 'low',
    attendance: AttendanceMetrics,
    performance: ExamPerformance,
    behavior: BehaviorAnalysis
  ): string[] {
    const recommendations: string[] = []

    if (attendance.rate < 0.75) {
      recommendations.push('Immediate parent meeting required to address attendance')
      recommendations.push('Implement daily attendance monitoring')
    } else if (attendance.rate < 0.85) {
      recommendations.push('Schedule parent meeting to discuss attendance')
      recommendations.push('Implement weekly attendance tracking')
    }

    if (attendance.consecutiveAbsences >= 3) {
      recommendations.push('Investigate reasons for consecutive absences')
    }

    if (performance.averagePercentage < 40) {
      recommendations.push('Arrange intensive tutoring support')
      recommendations.push('Consider academic intervention program')
    } else if (performance.averagePercentage < 60) {
      recommendations.push('Provide additional academic support')
      recommendations.push('Schedule regular progress monitoring')
    }

    if (performance.failingSubjects >= 1) {
      const failingSubjects = performance.subjectBreakdown
        .filter(s => s.average < 40)
        .map(s => s.subject)
        .join(', ')
      recommendations.push(`Targeted intervention needed for: ${failingSubjects}`)
    }

    if (performance.trend === 'declining') {
      recommendations.push('Conduct performance review meeting')
      recommendations.push('Identify and address root causes of decline')
    }

    if (behavior.totalPoints < -5) {
      recommendations.push('Implement behavior improvement plan')
      recommendations.push('Schedule counseling session')
    }

    if (behavior.majorIncidents >= 1) {
      recommendations.push('Review behavior management strategy')
    }

    if (riskLevel === 'low') {
      recommendations.push('Continue current performance')
      recommendations.push('Consider advanced learning opportunities')
    } else if (riskLevel === 'medium') {
      recommendations.push('Monitor progress closely')
      recommendations.push('Encourage participation in class activities')
    }

    if (recommendations.length === 0) {
      recommendations.push('Maintain current academic trajectory')
      recommendations.push('Continue regular progress monitoring')
    }

    return recommendations.slice(0, 4)
  }

  async generatePrediction(studentId: string): Promise<StudentPredictionResult> {
    const attendance = await this.analyzeAttendance(studentId)
    const performance = await this.analyzePerformance(studentId)
    const behavior = await this.analyzeBehavior(studentId)
    const dataQuality = await this.analyzeDataQuality(
      studentId,
      attendance.totalDays,
      performance.subjectBreakdown.length,
      behavior.categories.length
    )

    const riskLevel = this.calculateRiskLevel(attendance, performance, behavior)
    const riskFactors = this.generateRiskFactors(attendance, performance, behavior)
    const predictedGrade = this.predictGrade(performance, attendance)
    const confidence = this.calculateConfidence(dataQuality, performance)
    const recommendations = this.generateRecommendations(riskLevel, attendance, performance, behavior)

    return {
      studentId,
      riskLevel,
      riskFactors,
      predictedGrade,
      confidence,
      recommendations,
      metrics: {
        attendance,
        performance,
        behavior,
        dataQuality
      }
    }
  }
}

export const studentPredictionService = new StudentPredictionService()

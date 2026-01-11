export interface DashboardPrediction {
  enrollmentTrends: {
    nextMonth: number
    nextQuarter: number
    nextYear: number
    trend: 'increasing' | 'stable' | 'decreasing'
    confidence: number
    keyFactors?: string[]
    recommendations?: string[]
  }
  dropoutRisk: {
    highRiskStudents: number
    mediumRiskStudents: number
    lowRiskStudents: number
    riskFactors: string[]
    interventionStrategies?: string[]
    earlyWarningIndicators?: string[]
  }
  resourceOptimization: {
    teacherAllocation: string[]
    classroomUtilization: string[]
    resourceRecommendations: string[]
  }
  performancePredictions: {
    nextWeekAverage: number
    nextMonthAverage: number
    topPerformingGrades: Array<{ grade: string; average: number }>
    gradesNeedingAttention: Array<{ grade: string; average: number; improvement: string }>
    subjectInsights: Array<{ subject: string; average: number; trend: 'improving' | 'stable' | 'declining' }>
    performanceDrivers?: string[]
    interventionRecommendations?: string[]
  }
  attendancePatterns: {
    todayPrediction: { present: number; absent: number; rate: number }
    weeklyTrend: Array<{ day: string; rate: number }>
    predictedNextWeek: number
    patternInsights: string[]
    atRiskStudents: number
    attendanceDrivers?: string[]
    improvementStrategies?: string[]
  }
  teacherEffectiveness: {
    topTeachers: Array<{ name: string; effectiveness: number; subject: string }>
    teachersNeedingSupport: Array<{ name: string; effectiveness: number; suggestions: string[] }>
    overallEffectiveness: number
    effectivenessFactors?: string[]
    professionalDevelopmentNeeds?: string[]
    collaborationOpportunities?: string[]
  }
  alerts: Array<{
    type: 'urgent' | 'warning' | 'info'
    title: string
    message: string
    action?: string
  }>
  insights: {
    keyHighlights: string[]
    opportunities: string[]
    priorities: Array<{ title: string; urgency: 'high' | 'medium' | 'low' }>
  }
}

export interface StudentPerformance {
  studentId: string
  studentName: string
  currentPerformance: {
    averageGrade: number
    attendanceRate: number
    subjectPerformance: Record<string, number>
  }
  predictions: {
    finalGradePrediction: number
    probabilityOfPassing: number
    riskLevel: 'high' | 'medium' | 'low'
    improvementAreas: string[]
    recommendedActions: string[]
  }
}

export interface AttendanceAlert {
  studentId: string
  studentName: string
  pattern: {
    type: 'chronic_absence' | 'systematic_skipping' | 'sudden_change' | 'family_issue'
    severity: 'high' | 'medium' | 'low'
    description: string
  }
  analytics: {
    totalAbsences: number
    consecutiveDays: number
    affectedSubjects: string[]
    trend: 'worsening' | 'stable' | 'improving'
  }
  recommendations: string[]
  suggestedActions: string[]
}

export interface BookRecommendation {
  bookId: string
  title: string
  author: string
  genre: string
  relevanceScore: number
  reason: string
  relatedToStudentInterests: string[]
  difficulty: 'easy' | 'medium' | 'hard'
  estimatedReadingTime: string
}

export interface ChatbotResponse {
  message: string
  suggestedActions?: Array<{
    label: string
    action: string
    parameters?: Record<string, any>
  }>
  followUpQuestions?: string[]
  relatedResources?: Array<{
    title: string
    url: string
    description: string
  }>
}

export interface AIAnalytics {
  totalRequests: number
  successfulRequests: number
  failedRequests: number
  averageResponseTime: number
  lastUpdated: Date
}

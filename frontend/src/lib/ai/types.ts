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

export interface InventoryPrediction {
  overallHealth: {
    score: number
    status: 'excellent' | 'good' | 'fair' | 'poor'
    totalValue: number
    assetCount: number
    depreciationRate: number
  }
  maintenancePredictions: {
    assetsNeedingMaintenance: number
    estimatedCost: number
    urgentRepairs: Array<{
      assetCode: string
      name: string
      reason: string
      estimatedCost: number
      urgency: 'high' | 'medium' | 'low'
    }>
    predictedNextMonthCost: number
  }
  replacementNeeds: {
    highPriority: Array<{
      assetCode: string
      name: string
      reason: string
      estimatedCost: number
      recommendedAction: string
    }>
    mediumPriority: Array<{
      assetCode: string
      name: string
      reason: string
      estimatedCost: number
    }>
    totalReplacementBudget: number
    timeFrame: string
  }
  utilizationAnalysis: {
    underutilizedAssets: Array<{
      assetCode: string
      name: string
      category: string
      lastUsed: string
      recommendation: string
    }>
    overutilizedAssets: Array<{
      assetCode: string
      name: string
      category: string
      usageFrequency: number
      recommendation: string
    }>
    utilizationRate: number
    improvementOpportunities: string[]
  }
  categoryInsights: Array<{
    category: string
    assetCount: number
    totalValue: number
    conditionDistribution: Record<string, number>
    averageAge: number
    maintenanceTrend: 'increasing' | 'stable' | 'decreasing'
    recommendations: string[]
  }>
  financialProjections: {
    nextQuarterMaintenanceCost: number
    nextYearDepreciation: number
    totalAssetValueLoss: number
    budgetRecommendations: Array<{
      category: string
      recommendedAmount: number
      reason: string
    }>
  }
  alerts: Array<{
    type: 'urgent' | 'warning' | 'info'
    title: string
    message: string
    action?: string
    priority: 'high' | 'medium' | 'low'
  }>
  insights: {
    keyHighlights: string[]
    opportunities: string[]
    priorities: Array<{
      title: string
      urgency: 'high' | 'medium' | 'low'
      impact: 'high' | 'medium' | 'low'
    }>
  }
  generatedAt: Date
}

export interface LibraryPrediction {
  overallHealth: {
    score: number
    status: 'excellent' | 'good' | 'fair' | 'poor'
    totalBooks: number
    totalCopies: number
    collectionValue: number
    averageBookAge: number
  }
  popularBooks: {
    trendingBooks: Array<{
      isbn: string
      title: string
      author: string
      category: string
      borrowCount: number
      availableCopies: number
      recommendation: string
    }>
    highDemandCategories: Array<{
      category: string
      borrowCount: number
      totalBooks: number
      demandTrend: 'increasing' | 'stable' | 'decreasing'
    }>
    seasonalityInsights: string[]
  }
  stockAlerts: {
    outOfStockBooks: Array<{
      isbn: string
      title: string
      author: string
      category: string
      totalCopies: number
      recommendation: string
      urgency: 'high' | 'medium' | 'low'
    }>
    lowStockBooks: Array<{
      isbn: string
      title: string
      author: string
      category: string
      availableCopies: number
      recommendedReorder: number
    }>
    needRestocking: boolean
    estimatedRestockCost: number
  }
  borrowingPatterns: {
    averageLoanDuration: number
    peakBorrowingTimes: Array<{
      day: string
      time: string
      borrowCount: number
    }>
    overdueTrend: 'increasing' | 'stable' | 'decreasing'
    averageReturnDelay: number
    frequentBorrowers: Array<{
      studentName: string
      rollNumber: string
      borrowCount: number
      overdueCount: number
    }>
    borrowingFrequency: string
  }
  acquisitionRecommendations: {
    recommendedPurchases: Array<{
      title: string
      author: string
      category: string
      estimatedCost: number
      reason: string
      priority: 'high' | 'medium' | 'low'
    }>
    categoriesToExpand: Array<{
      category: string
      currentBooks: number
      demandGap: number
      suggestedAdditions: number
    }>
    totalBudgetRequired: number
    budgetBreakdown: Record<string, number>
  }
  categoryPerformance: {
    topPerforming: Array<{
      category: string
      totalBooks: number
      borrowRate: number
      averageRating: number
      recommendations: string[]
    }>
    underperforming: Array<{
      category: string
      totalBooks: number
      borrowRate: number
      improvementSuggestions: string[]
    }>
    diversificationOpportunities: string[]
  }
  spaceUtilization: {
    shelfUsage: number
    overcrowdedCategories: Array<{
      category: string
      bookCount: number
      availableSpace: string
      recommendation: string
    }>
    underutilizedAreas: Array<{
      location: string
      currentUsage: number
      potentialCapacity: number
    }>
    reorganizationSuggestions: string[]
  }
  alerts: Array<{
    type: 'urgent' | 'warning' | 'info'
    title: string
    message: string
    action?: string
    priority: 'high' | 'medium' | 'low'
  }>
  insights: {
    keyHighlights: string[]
    opportunities: string[]
    priorities: Array<{
      title: string
      urgency: 'high' | 'medium' | 'low'
      impact: 'high' | 'medium' | 'low'
    }>
  }
  generatedAt: Date
}

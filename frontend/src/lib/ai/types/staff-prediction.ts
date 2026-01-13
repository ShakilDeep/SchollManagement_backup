export interface StaffPrediction {
  staffSummary: {
    total: number
    teachers: number
    adminStaff: number
    activeRate: number
    activeCount: number
    onLeaveCount: number
  }
  tenureAnalysis: {
    averageTenure: number
    tenureDistribution: {
      lessThan1Year: number
      oneToThreeYears: number
      threeToFiveYears: number
      fivePlusYears: number
    }
    longestServing: {
      name: string
      department: string
      tenureYears: number
    } | null
  }
  departmentBalance: {
    name: string
    count: number
    percentage: number
    workloadLevel: 'balanced' | 'high' | 'overloaded'
  }[]
  retentionRisk: {
    name: string
    department: string
    riskFactor: 'low' | 'medium' | 'high'
    reason: string
  }[]
  salaryAnalysis: {
    averageSalary: number
    salaryRange: {
      min: number
      max: number
    }
    salaryByDepartment: {
      department: string
      averageSalary: number
      count: number
    }[]
  }
  workloadDistribution: {
    averageLessonsPerTeacher: number
    overloadedTeachers: {
      name: string
      department: string
      lessonCount: number
    }[]
    underutilizedTeachers: {
      name: string
      department: string
      lessonCount: number
    }[]
  }
  recommendations: {
    title: string
    message: string
    type: 'info' | 'warning' | 'success'
    priority: 'low' | 'medium' | 'high'
  }[]
}

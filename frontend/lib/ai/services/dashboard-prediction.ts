import { GeminiClient } from '../gemini-client'
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
}

export class DashboardPredictionService {
  private client: GeminiClient

  constructor() {
    this.client = new GeminiClient('gemini-1.5-flash', {
      temperature: 0.3,
      maxOutputTokens: 2048
    })
  }

  async predictEnrollmentTrends(data: DashboardData): Promise<DashboardPrediction['enrollmentTrends']> {
    const prompt = `
      You are an educational data analyst. Based on the following school data, predict enrollment trends:

      Current Stats:
      - Total Students: ${data.totalStudents}
      - Active Students: ${data.activeStudents}
      - Total Teachers: ${data.totalTeachers}
      - Total Grades: ${data.totalGrades}
      - Present Today: ${data.presentToday}
      - Recent Enrollments (last 7 days): ${data.recentEnrollments}
      - Upcoming Exams: ${data.upcomingExams}
      - Library Books: ${data.libraryBooks}
      - Transport Vehicles: ${data.transportVehicles}
      - Attendance Rate: ${(data.attendanceRate * 100).toFixed(1)}%

      ${data.historicalData ? `
      Historical Data:
      - Monthly enrollments: ${JSON.stringify(data.historicalData.enrollments)}
      - Daily attendance: ${JSON.stringify(data.historicalData.attendance.slice(-30))}
      - Grade performance: ${JSON.stringify(data.historicalData.performance)}
      ` : ''}

      Analyze this data and provide predictions for:
      1. Next month enrollment
      2. Next quarter enrollment  
      3. Next year enrollment
      4. Overall trend (increasing, stable, decreasing)
      5. Confidence level (0-1)

      Respond in JSON format:
      {
        "nextMonth": number,
        "nextQuarter": number,
        "nextYear": number,
        "trend": "increasing" | "stable" | "decreasing",
        "confidence": number
      }
    `

    const result = await this.client.generateJSON<DashboardPrediction['enrollmentTrends']>(prompt)

    if (!result.success) {
      throw new Error(result.error || 'Failed to predict enrollment trends')
    }

    return result.data
  }

  async analyzeDropoutRisk(data: DashboardData): Promise<DashboardPrediction['dropoutRisk']> {
    const prompt = `
      You are an educational consultant specializing in student retention. Analyze the following data to identify dropout risk factors:

      School Metrics:
      - Total Students: ${data.totalStudents}
      - Active Students: ${data.activeStudents}
      - Attendance Rate: ${(data.attendanceRate * 100).toFixed(1)}%
      - Recent Enrollments: ${data.recentEnrollments}
      - Student-Teacher Ratio: ${(data.totalStudents / data.totalTeachers).toFixed(1)}:1

      ${data.historicalData ? `
      Performance Trends:
      ${data.historicalData.performance.map(p => `- Grade ${p.grade}: ${p.average.toFixed(1)}%`).join('\n')}
      ` : ''}

      Based on this data, estimate:
      1. Number of students at high risk of dropping out
      2. Number at medium risk
      3. Number at low risk
      4. Key risk factors contributing to potential dropouts

      Respond in JSON format:
      {
        "highRiskStudents": number,
        "mediumRiskStudents": number,
        "lowRiskStudents": number,
        "riskFactors": string[]
      }
    `

    const result = await this.client.generateJSON<DashboardPrediction['dropoutRisk']>(prompt)

    if (!result.success) {
      throw new Error(result.error || 'Failed to analyze dropout risk')
    }

    return result.data
  }

  async optimizeResources(data: DashboardData): Promise<DashboardPrediction['resourceOptimization']> {
    const prompt = `
      You are a school resource optimization expert. Analyze the following data and provide resource recommendations:

      Current Resources:
      - Students: ${data.totalStudents}
      - Active Students: ${data.activeStudents}
      - Teachers: ${data.totalTeachers}
      - Grades: ${data.totalGrades}
      - Attendance Today: ${data.presentToday}
      - Library Books: ${data.libraryBooks}
      - Transport Vehicles: ${data.transportVehicles}
      - Upcoming Exams: ${data.upcomingExams}

      Student-Teacher Ratio: ${(data.totalStudents / data.totalTeachers).toFixed(1)}:1
      Attendance Rate: ${(data.attendanceRate * 100).toFixed(1)}%

      Provide recommendations for:
      1. Optimal teacher allocation across grades
      2. Classroom utilization optimization
      3. General resource recommendations

      Respond in JSON format:
      {
        "teacherAllocation": string[],
        "classroomUtilization": string[],
        "resourceRecommendations": string[]
      }
    `

    const result = await this.client.generateJSON<DashboardPrediction['resourceOptimization']>(prompt)

    if (!result.success) {
      throw new Error(result.error || 'Failed to optimize resources')
    }

    return result.data
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

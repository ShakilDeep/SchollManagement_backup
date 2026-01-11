import { GeminiClient } from '../gemini-client'
import { StudentPerformance } from '../types'

interface StudentData {
  id: string
  name: string
  grade: string
  section: string
  attendanceRate: number
  examResults: Array<{
    subject: string
    marksObtained: number
    totalMarks: number
    percentage: number
    date: string
  }>
  behaviorRecords?: Array<{
    type: string
    date: string
    description: string
  }>
}

export class StudentPerformanceService {
  private client: GeminiClient

  constructor() {
    this.client = new GeminiClient('gemini-2.0-flash', {
      temperature: 0.4,
      maxOutputTokens: 2048
    })
  }

  async predictStudentPerformance(student: StudentData): Promise<StudentPerformance> {
    const prompt = `
      You are an educational psychologist specializing in student performance prediction. Analyze the following student data:

      Student Profile:
      - Name: ${student.name}
      - Grade: ${student.grade} ${student.section}
      - ID: ${student.id}

      Academic Performance:
      ${student.examResults.map(exam => 
        `- ${exam.subject}: ${exam.marksObtained}/${exam.totalMarks} (${exam.percentage.toFixed(1)}%)`
      ).join('\n')}

      Attendance: ${(student.attendanceRate * 100).toFixed(1)}%

      ${student.behaviorRecords && student.behaviorRecords.length > 0 ? `
      Behavior Records:
      ${student.behaviorRecords.map(record => 
        `- ${record.type}: ${record.description} (${record.date})`
      ).join('\n')}
      ` : ''}

      Based on this data, predict:
      1. Final grade prediction (0-100)
      2. Probability of passing (0-1)
      3. Risk level (high, medium, low)
      4. Areas needing improvement
      5. Recommended actions for teachers/parents

      Respond in JSON format:
      {
        "studentId": "${student.id}",
        "studentName": "${student.name}",
        "currentPerformance": {
          "averageGrade": number,
          "attendanceRate": ${student.attendanceRate},
          "subjectPerformance": {
            [subject: string]: number
          }
        },
        "predictions": {
          "finalGradePrediction": number,
          "probabilityOfPassing": number,
          "riskLevel": "high" | "medium" | "low",
          "improvementAreas": string[],
          "recommendedActions": string[]
        }
      }
    `

    const result = await this.client.generateJSON<StudentPerformance>(prompt)

    if (!result.success) {
      throw new Error(result.error || 'Failed to predict student performance')
    }

    return result.data
  }

  async predictMultipleStudents(students: StudentData[]): Promise<StudentPerformance[]> {
    const predictions = await Promise.allSettled(
      students.map(student => this.predictStudentPerformance(student))
    )

    return predictions
      .filter((result): result is PromiseFulfilledResult<StudentPerformance> => result.status === 'fulfilled')
      .map(result => result.value)
  }

  async getAtRiskStudents(students: StudentData[]): Promise<StudentPerformance[]> {
    const predictions = await this.predictMultipleStudents(students)
    return predictions.filter(
      prediction => prediction.predictions.riskLevel === 'high' || prediction.predictions.riskLevel === 'medium'
    )
  }
}

export const studentPerformanceService = new StudentPerformanceService()

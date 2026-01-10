import { GeminiClient } from '../gemini-client'
import { AttendanceAlert } from '../types'

interface StudentAttendanceData {
  id: string
  name: string
  grade: string
  section: string
  attendanceRecords: Array<{
    date: string
    status: 'Present' | 'Absent' | 'Late' | 'Half-Day'
    subject?: string
  }>
  consecutiveAbsences: number
  totalAbsences: number
  attendanceRate: number
  affectedSubjects: string[]
}

export class AttendanceAlertService {
  private client: GeminiClient

  constructor() {
    this.client = new GeminiClient('gemini-1.5-flash', {
      temperature: 0.3,
      maxOutputTokens: 2048
    })
  }

  async detectAttendancePatterns(student: StudentAttendanceData): Promise<AttendanceAlert> {
    const prompt = `
      You are an educational expert specializing in attendance analysis. Analyze the following student attendance data to detect patterns and risks:

      Student Profile:
      - Name: ${student.name}
      - Grade: ${student.grade} ${student.section}
      - ID: ${student.id}

      Attendance Summary:
      - Total Absences: ${student.totalAbsences}
      - Consecutive Absences: ${student.consecutiveAbsences}
      - Attendance Rate: ${(student.attendanceRate * 100).toFixed(1)}%
      - Affected Subjects: ${student.affectedSubjects.join(', ')}

      Recent Attendance Records (last 30 days):
      ${student.attendanceRecords.slice(-30).map(record => 
        `- ${record.date}: ${record.status}${record.subject ? ` (${record.subject})` : ''}`
      ).join('\n')}

      Analyze this data and identify:
      1. Pattern type (chronic_absence, systematic_skipping, sudden_change, family_issue)
      2. Severity level (high, medium, low)
      3. Pattern description
      4. Trend (worsening, stable, improving)
      5. Specific recommendations for intervention
      6. Suggested immediate actions

      Respond in JSON format:
      {
        "studentId": "${student.id}",
        "studentName": "${student.name}",
        "pattern": {
          "type": "chronic_absence" | "systematic_skipping" | "sudden_change" | "family_issue",
          "severity": "high" | "medium" | "low",
          "description": string
        },
        "analytics": {
          "totalAbsences": ${student.totalAbsences},
          "consecutiveDays": ${student.consecutiveAbsences},
          "affectedSubjects": ${JSON.stringify(student.affectedSubjects)},
          "trend": "worsening" | "stable" | "improving"
        },
        "recommendations": string[],
        "suggestedActions": string[]
      }
    `

    const result = await this.client.generateJSON<AttendanceAlert>(prompt)

    if (!result.success) {
      throw new Error(result.error || 'Failed to detect attendance patterns')
    }

    return result.data
  }

  async scanForAlerts(students: StudentAttendanceData[]): Promise<AttendanceAlert[]> {
    const alerts = await Promise.allSettled(
      students.map(student => this.detectAttendancePatterns(student))
    )

    return alerts
      .filter((result): result is PromiseFulfilledResult<AttendanceAlert> => result.status === 'fulfilled')
      .map(result => result.value)
      .filter(alert => alert.pattern.severity === 'high' || alert.pattern.severity === 'medium')
  }

  async getCriticalAlerts(students: StudentAttendanceData[]): Promise<AttendanceAlert[]> {
    const alerts = await this.scanForAlerts(students)
    return alerts.filter(alert => alert.pattern.severity === 'high')
  }
}

export const attendanceAlertService = new AttendanceAlertService()

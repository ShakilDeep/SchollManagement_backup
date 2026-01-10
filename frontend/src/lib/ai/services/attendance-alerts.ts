import { GeminiClient } from '../gemini-client'
import { db } from '@/lib/db'
import { validateAttendanceRecords } from '../utils/data-validation'

export interface AttendanceRecord {
  id: string
  studentId: string
  studentName: string
  date: Date
  status: 'Present' | 'Absent' | 'Late' | 'HalfDay'
  checkIn?: string
  checkOut?: string
}

export interface AbsencePattern {
  studentId: string
  studentName: string
  consecutiveAbsences: number
  patternType: 'consecutive' | 'recurrent' | 'sporadic' | 'none'
  daysAbsent: number[]
  lastAbsentDate: Date
  riskLevel: 'critical' | 'high' | 'medium' | 'low'
  patternDescription: string
  recommendations: string[]
}

export interface AttendanceAlert {
  id: string
  type: 'absence_pattern' | 'declining_trend' | 'borderline' | 'critical'
  studentId: string
  studentName: string
  grade: string
  section: string
  message: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  actionRequired: boolean
  createdAt: Date
  metrics: {
    consecutiveAbsences?: number
    attendanceRate?: number
    daysAbsent?: number
    pattern?: string
  }
}

export class AttendanceAlertsService {
  private client: GeminiClient
  private dataCache: Map<string, { data: AttendanceRecord[]; timestamp: number }> = new Map()
  private readonly CACHE_TTL = 300000

  constructor() {
    this.client = new GeminiClient('gemini-2.0-flash', {
      temperature: 0.3,
      maxOutputTokens: 2048
    })
  }

  private clearExpiredCache(): void {
    const now = Date.now()
    for (const [key, value] of this.dataCache) {
      if (now - value.timestamp > this.CACHE_TTL) {
        this.dataCache.delete(key)
      }
    }
  }

  private getCachedData(key: string): AttendanceRecord[] | null {
    const cached = this.dataCache.get(key)
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data
    }
    return null
  }

  private setCachedData(key: string, data: AttendanceRecord[]): void {
    this.dataCache.set(key, { data, timestamp: Date.now() })
  }

  async loadAttendanceRecords(options?: {
    studentId?: string
    gradeId?: string
    sectionId?: string
    startDate?: Date
    endDate?: Date
    limit?: number
  }): Promise<AttendanceRecord[]> {
    const cacheKey = `attendance_${JSON.stringify(options)}`
    const cached = this.getCachedData(cacheKey)
    if (cached) return cached

    const where: any = {}
    if (options?.studentId) where.studentId = options.studentId
    if (options?.startDate) where.date = { ...where.date, gte: options.startDate }
    if (options?.endDate) where.date = { ...where.date, lte: options.endDate }

    const attendances = await db.attendance.findMany({
      where,
      include: {
        student: {
          include: {
            section: {
              include: {
                grade: true
              }
            }
          }
        }
      },
      orderBy: {
        date: 'desc'
      },
      take: options?.limit || 1000
    })

    const records: AttendanceRecord[] = attendances.map(a => ({
      id: a.id,
      studentId: a.studentId,
      studentName: `${a.student.firstName} ${a.student.lastName}`,
      date: a.date,
      status: a.status as 'Present' | 'Absent' | 'Late' | 'HalfDay',
      checkIn: a.checkInTime?.toISOString(),
      checkOut: a.checkOutTime?.toISOString()
    }))

    this.setCachedData(cacheKey, records)
    return records
  }

  async loadStudentAttendanceRecords(studentId: string, days: number = 30): Promise<AttendanceRecord[]> {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    return this.loadAttendanceRecords({
      studentId,
      startDate,
      endDate: new Date()
    })
  }

  async loadGradeAttendanceRecords(gradeId: string, sectionId?: string, days: number = 30): Promise<AttendanceRecord[]> {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const where: any = {
      date: {
        gte: startDate,
        lte: new Date()
      }
    }

    const attendances = await db.attendance.findMany({
      where,
      include: {
        student: {
          include: {
            section: {
              include: {
                grade: true
              }
            }
          }
        }
      },
      orderBy: {
        date: 'desc'
      },
      take: 2000
    })

    const records: AttendanceRecord[] = attendances
      .filter(a => a.student.section.gradeId === gradeId && (!sectionId || a.student.sectionId === sectionId))
      .map(a => ({
        id: a.id,
        studentId: a.studentId,
        studentName: `${a.student.firstName} ${a.student.lastName}`,
        date: a.date,
        status: a.status as 'Present' | 'Absent' | 'Late' | 'HalfDay',
        checkIn: a.checkInTime?.toISOString(),
        checkOut: a.checkOutTime?.toISOString()
      }))

    return records
  }

  async analyzeAbsencePattern(attendanceRecords: AttendanceRecord[]): Promise<AbsencePattern> {
    if (attendanceRecords.length === 0) {
      throw new Error('No attendance records provided')
    }

    const validation = validateAttendanceRecords(attendanceRecords)

    if (!validation.isValid) {
      console.warn('Attendance records validation issues:', validation.issues)
    }

    if (validation.warnings.length > 0) {
      console.warn('Attendance records validation warnings:', validation.warnings)
    }

    const studentId = attendanceRecords[0].studentId
    const studentName = attendanceRecords[0].studentName

    const absences = attendanceRecords.filter(r => r.status === 'Absent').sort((a, b) => 
      b.date.getTime() - a.date.getTime()
    )

    if (absences.length === 0) {
      return {
        studentId,
        studentName,
        consecutiveAbsences: 0,
        patternType: 'none',
        daysAbsent: [],
        lastAbsentDate: new Date(),
        riskLevel: 'low',
        patternDescription: 'No absences recorded',
        recommendations: ['Continue monitoring attendance']
      }
    }

    const daysAbsent = absences.map(r => r.date.getDate())
    const lastAbsentDate = absences[0].date

    let consecutiveAbsences = 0
    const today = new Date()
    let currentDate = new Date(today)
    
    while (consecutiveAbsences < absences.length) {
      const found = absences.find(a => 
        a.date.getDate() === currentDate.getDate() && 
        a.date.getMonth() === currentDate.getMonth() &&
        a.date.getFullYear() === currentDate.getFullYear()
      )
      
      if (found) {
        consecutiveAbsences++
        currentDate.setDate(currentDate.getDate() - 1)
      } else {
        break
      }
    }

    const patternType = this.detectPatternType(absences)
    const riskLevel = this.calculateRiskLevel(consecutiveAbsences, patternType, absences.length)

    try {
      const prompt = `
        You are a school attendance specialist. Analyze the following attendance data for a student:

        Student: ${studentName}
        Total Absences: ${absences.length}
        Consecutive Absences: ${consecutiveAbsences}
        Pattern Type: ${patternType}
        Days Absent: ${daysAbsent.join(', ')}
        Last Absent: ${lastAbsentDate.toISOString()}

        Absence Dates:
        ${absences.map(a => `- ${a.date.toDateString()}: ${a.status}`).join('\n')}

        Analyze this attendance pattern and provide:
        1. A detailed description of the pattern
        2. 3-5 specific recommendations for intervention

        Respond in JSON format:
        {
          "patternDescription": string,
          "recommendations": string[]
        }
      `

      const result = await this.client.generateJSON<{ patternDescription: string; recommendations: string[] }>(prompt)

      if (result.success && result.data) {
        return {
          studentId,
          studentName,
          consecutiveAbsences,
          patternType,
          daysAbsent,
          lastAbsentDate,
          riskLevel,
          patternDescription: result.data.patternDescription,
          recommendations: result.data.recommendations
        }
      }
    } catch (error) {
      console.error('AI analysis failed, using fallback logic:', error)
    }

    return {
      studentId,
      studentName,
      consecutiveAbsences,
      patternType,
      daysAbsent,
      lastAbsentDate,
      riskLevel,
      patternDescription: this.generateFallbackDescription(consecutiveAbsences, patternType),
      recommendations: this.generateFallbackRecommendations(consecutiveAbsences, patternType)
    }
  }

  private detectPatternType(absences: AttendanceRecord[]): AbsencePattern['patternType'] {
    if (absences.length < 2) return 'sporadic'

    const sortedAbsences = [...absences].sort((a, b) => a.date.getTime() - b.date.getTime())
    const dayOfWeekCounts = new Map<number, number>()

    sortedAbsences.forEach(a => {
      const day = a.date.getDay()
      dayOfWeekCounts.set(day, (dayOfWeekCounts.get(day) || 0) + 1)
    })

    const maxDayCount = Math.max(...dayOfWeekCounts.values())
    
    if (maxDayCount >= absences.length * 0.6) {
      return 'recurrent'
    }

    let consecutive = 1
    let maxConsecutive = 1

    for (let i = 1; i < sortedAbsences.length; i++) {
      const prev = sortedAbsences[i - 1].date
      const curr = sortedAbsences[i].date
      const diffDays = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24)

      if (diffDays === 1) {
        consecutive++
        maxConsecutive = Math.max(maxConsecutive, consecutive)
      } else {
        consecutive = 1
      }
    }

    if (maxConsecutive >= 3) return 'consecutive'
    return 'sporadic'
  }

  private calculateRiskLevel(
    consecutiveAbsences: number,
    patternType: AbsencePattern['patternType'],
    totalAbsences: number
  ): AbsencePattern['riskLevel'] {
    if (consecutiveAbsences >= 5) return 'critical'
    if (consecutiveAbsences >= 3 || patternType === 'consecutive') return 'high'
    if (patternType === 'recurrent' || totalAbsences >= 5) return 'medium'
    return 'low'
  }

  private generateFallbackDescription(consecutiveAbsences: number, patternType: string): string {
    if (patternType === 'consecutive') {
      return `Student has ${consecutiveAbsences} consecutive absences, indicating potential ongoing issues`
    }
    if (patternType === 'recurrent') {
      return 'Student shows recurrent absence patterns on specific days of the week'
    }
    if (consecutiveAbsences >= 3) {
      return `Student has ${consecutiveAbsences} consecutive absences requiring immediate attention`
    }
    return 'Student has sporadic absences that should be monitored'
  }

  private generateFallbackRecommendations(consecutiveAbsences: number, patternType: string): string[] {
    const recommendations: string[] = []

    if (consecutiveAbsences >= 3) {
      recommendations.push('Contact parents/guardians immediately to discuss the absences')
      recommendations.push('Schedule a meeting with school counselor')
      recommendations.push('Document intervention efforts in student records')
    }

    if (patternType === 'recurrent') {
      recommendations.push('Investigate specific days of the week when absences occur')
      recommendations.push('Check for transportation or scheduling issues on those days')
    }

    if (consecutiveAbsences >= 5) {
      recommendations.push('Consider home visit by school representative')
      recommendations.push('Engage external support services if needed')
    }

    if (recommendations.length === 0) {
      recommendations.push('Monitor attendance closely in coming weeks')
      recommendations.push('Send gentle reminder to parents about importance of attendance')
    }

    return recommendations
  }

  async generateAttendanceAlerts(
    attendanceRecords: AttendanceRecord[],
    grade?: string,
    section?: string
  ): Promise<AttendanceAlert[]> {
    const alerts: AttendanceAlert[] = []

    try {
      const prompt = `
        You are a school attendance monitoring system. Analyze the following attendance data and generate alerts:

        ${grade ? `Grade: ${grade}` : ''}
        ${section ? `Section: ${section}` : ''}
        Total Students: ${attendanceRecords.length}
        Total Absences: ${attendanceRecords.filter(r => r.status === 'Absent').length}

        Attendance Data:
        ${attendanceRecords.slice(0, 20).map(r => 
          `- ${r.studentName} (${r.studentId}): ${r.date.toDateString()} - ${r.status}`
        ).join('\n')}

        Generate alerts for students with concerning attendance patterns. For each alert, provide:
        1. Alert type (absence_pattern, declining_trend, borderline, critical)
        2. Severity (critical, high, medium, low)
        3. Alert message
        4. Whether action is required
        5. Key metrics

        Respond in JSON array format:
        [
          {
            "type": string,
            "severity": string,
            "message": string,
            "actionRequired": boolean,
            "metrics": {
              "consecutiveAbsences": number,
              "attendanceRate": number,
              "daysAbsent": number,
              "pattern": string
            }
          }
        ]

        Limit to maximum 5 most critical alerts.
      `

      const result = await this.client.generateJSON<any[]>(prompt)

      if (result.success && result.data) {
        result.data.forEach((alert, index) => {
          alerts.push({
            id: `alert-${Date.now()}-${index}`,
            type: alert.type || 'absence_pattern',
            studentId: attendanceRecords[0]?.studentId || '',
            studentName: attendanceRecords[0]?.studentName || 'Unknown',
            grade: grade || '',
            section: section || '',
            message: alert.message || 'Attendance concern detected',
            severity: alert.severity || 'medium',
            actionRequired: alert.actionRequired ?? true,
            createdAt: new Date(),
            metrics: alert.metrics || {}
          })
        })

        return alerts
      }
    } catch (error) {
      console.error('AI alert generation failed, using fallback logic:', error)
    }

    return this.generateFallbackAlerts(attendanceRecords, grade, section)
  }

  private generateFallbackAlerts(
    attendanceRecords: AttendanceRecord[],
    grade?: string,
    section?: string
  ): AttendanceAlert[] {
    const alerts: AttendanceAlert[] = []

    const studentGroups = new Map<string, AttendanceRecord[]>()
    attendanceRecords.forEach(r => {
      if (!studentGroups.has(r.studentId)) {
        studentGroups.set(r.studentId, [])
      }
      studentGroups.get(r.studentId)!.push(r)
    })

    for (const [studentId, records] of studentGroups) {
      const absences = records.filter(r => r.status === 'Absent')
      
      if (absences.length >= 3) {
        const consecutive = this.calculateConsecutiveAbsences(absences)
        const alertType = consecutive >= 3 ? 'critical' : absences.length >= 5 ? 'high' : 'medium'
        
        alerts.push({
          id: `alert-${Date.now()}-${studentId}`,
          type: 'absence_pattern',
          studentId,
          studentName: records[0].studentName,
          grade: grade || '',
          section: section || '',
          message: `Student has ${absences.length} absences in recent period${consecutive >= 3 ? ` including ${consecutive} consecutive days` : ''}`,
          severity: alertType,
          actionRequired: consecutive >= 3,
          createdAt: new Date(),
          metrics: {
            consecutiveAbsences: consecutive,
            daysAbsent: absences.length,
            pattern: consecutive >= 3 ? 'consecutive' : 'sporadic'
          }
        })
      }
    }

    return alerts.sort((a, b) => {
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
      return severityOrder[a.severity] - severityOrder[b.severity]
    }).slice(0, 5)
  }

  private calculateConsecutiveAbsences(absences: AttendanceRecord[]): number {
    const sorted = [...absences].sort((a, b) => a.date.getTime() - b.date.getTime())
    let maxConsecutive = 1
    let currentConsecutive = 1

    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1].date
      const curr = sorted[i].date
      const diffDays = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24)

      if (diffDays === 1) {
        currentConsecutive++
        maxConsecutive = Math.max(maxConsecutive, currentConsecutive)
      } else {
        currentConsecutive = 1
      }
    }

    return maxConsecutive
  }
}

export const attendanceAlertsService = new AttendanceAlertsService()

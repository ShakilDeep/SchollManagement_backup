import { GeminiClient } from '../gemini-client'
import { ChatbotResponse } from '../types'
import { db } from '@/lib/db'
import { validateStudentData, validateAttendanceRecords, validateExamResults, validateMessageData } from '../utils/data-validation'

export interface SchoolContext {
  schoolInfo: {
    schoolName: string
    academicYear: string
    upcomingEvents: Array<{ date: Date; title: string }>
    totalStudents: number
    totalTeachers: number
    totalClasses: number
    libraryBooks: number
    transportVehicles: number
  }
  currentUser: {
    id: string
    name: string
    role: string
    email?: string
  }
  studentData?: {
    studentId: string
    name: string
    grade: string
    section: string
    attendanceRate: number
    recentAttendance: Array<{ date: Date; status: string }>
    examResults: Array<{ subject: string; marks: number; totalMarks: number; percentage: number }>
    upcomingExams: Array<{ subject: string; date: Date }>
    feesDue?: number
    libraryBooks?: number
  }
  recentMessages?: Array<{
    id: string
    senderId: string
    receiverId: string
    content: string
    timestamp: Date
  }>
}

interface ConversationHistory {
  role: 'user' | 'assistant'
  message: string
  timestamp: Date
}

export class SmartChatbotService {
  private client: GeminiClient
  private conversationHistory: Map<string, ConversationHistory[]> = new Map()
  private contextCache: Map<string, { data: any; timestamp: number }> = new Map()
  private readonly CACHE_TTL = 300000

  constructor() {
    this.client = new GeminiClient('gemini-2.0-flash', {
      temperature: 0.6,
      maxOutputTokens: 1024
    })
  }

  private getCachedData<T>(key: string): T | null {
    const cached = this.contextCache.get(key)
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data as T
    }
    return null
  }

  private setCachedData<T>(key: string, data: T): void {
    this.contextCache.set(key, { data, timestamp: Date.now() })
  }

  private clearExpiredCache(): void {
    const now = Date.now()
    for (const [key, value] of this.contextCache.entries()) {
      if (now - value.timestamp >= this.CACHE_TTL) {
        this.contextCache.delete(key)
      }
    }
  }

  async getSchoolContext(): Promise<SchoolContext['schoolInfo']> {
    const cacheKey = 'school_context'
    const cached = this.getCachedData<SchoolContext['schoolInfo']>(cacheKey)
    if (cached) return cached

    const [settings, upcomingEvents] = await Promise.all([
      db.systemSettings.findMany({
        where: { category: 'school' },
        select: { key: true, value: true }
      }),
      db.notification.findMany({
        where: {
          type: 'event',
          createdAt: { gte: new Date() }
        },
        orderBy: { createdAt: 'asc' },
        take: 10
      })
    ])

    const getSettingValue = (key: string, defaultValue: string = ''): string => {
      return settings.find(s => s.key === key)?.value || defaultValue
    }

    const schoolInfo: SchoolContext['schoolInfo'] = {
      name: getSettingValue('school_name', 'EduCore School'),
      contact: {
        phone: getSettingValue('school_phone', ''),
        email: getSettingValue('school_email', ''),
        address: getSettingValue('school_address', '')
      },
      workingHours: getSettingValue('working_hours', '8:00 AM - 4:00 PM'),
      upcomingEvents: upcomingEvents.map(e => ({
        name: e.title,
        date: e.createdAt.toISOString().split('T')[0],
        description: e.message
      }))
    }

    this.setCachedData(cacheKey, schoolInfo)
    return schoolInfo
  }

  async getStudentData(studentId: string): Promise<SchoolContext['studentData']> {
    const cacheKey = `student_${studentId}`
    const cached = this.getCachedData<SchoolContext['studentData']>(cacheKey)
    if (cached) return cached

    const [student, attendances, examResults, upcomingExams] = await Promise.all([
      db.student.findUnique({
        where: { id: studentId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          grade: { select: { name: true } },
          section: { select: { name: true } }
        }
      }),
      db.attendance.findMany({
        where: { studentId },
        orderBy: { date: 'desc' },
        take: 90
      }),
      db.examResult.findMany({
        where: { studentId },
        include: {
          examPaper: {
            include: {
              subject: { select: { name: true } }
            }
          }
        },
        orderBy: { examPaper: { examDate: 'desc' } },
        take: 10
      }),
      db.examPaper.findMany({
        where: {
          exam: { status: 'Upcoming' },
          exam: {
            gradeId: (await db.student.findUnique({
              where: { id: studentId },
              select: { gradeId: true }
            }))?.gradeId
          }
        },
        include: { subject: { select: { name: true } } },
        orderBy: { examDate: 'asc' },
        take: 5
      })
    ])

    if (!student) {
      throw new Error('Student not found')
    }

    const studentValidation = validateStudentData(student)
    if (!studentValidation.isValid) {
      console.warn('Student data validation warnings:', studentValidation.warnings)
    }

    const attendanceValidation = validateAttendanceRecords(attendances.map(a => ({
      id: a.id,
      studentId: a.studentId,
      studentName: `${student.firstName} ${student.lastName}`,
      date: a.date,
      status: a.status,
      checkIn: a.checkInTime?.toISOString(),
      checkOut: a.checkOutTime?.toISOString()
    })))

    if (!attendanceValidation.isValid) {
      console.warn('Attendance data validation issues:', attendanceValidation.issues)
    }

    const examResultsValidation = validateExamResults(examResults.map(r => ({
      studentId,
      subject: r.examPaper.subject.name,
      obtainedMarks: r.marksObtained,
      totalMarks: r.examPaper.totalMarks
    })))

    if (!examResultsValidation.isValid) {
      console.warn('Exam results validation issues:', examResultsValidation.issues)
    }

    const presentDays = attendances.filter(a => a.status === 'Present').length
    const attendanceRate = attendances.length > 0 ? presentDays / attendances.length : 0

    const recentAttendance = attendances.map(a => ({
      date: a.date,
      status: a.status
    }))

    const examResultsList = examResults.map(r => ({
      subject: r.examPaper.subject.name,
      marks: r.marksObtained,
      totalMarks: r.examPaper.totalMarks,
      percentage: r.percentage
    }))

    const upcomingExamsList = upcomingExams.map(e => ({
      subject: e.subject.name,
      date: e.examDate
    }))

    const studentData: SchoolContext['studentData'] = {
      studentId: student.id,
      name: `${student.firstName} ${student.lastName}`,
      grade: student.grade?.name || 'N/A',
      section: student.section?.name || 'N/A',
      attendanceRate,
      recentAttendance,
      examResults: examResultsList,
      upcomingExams: upcomingExamsList
    }

    this.setCachedData(cacheKey, studentData)
    return studentData
  }

  async getUserContext(userId: string, role: string): Promise<SchoolContext['currentUser']> {
    const cacheKey = `user_${userId}`
    const cached = this.getCachedData<SchoolContext['currentUser']>(cacheKey)
    if (cached) return cached

    let userContext: SchoolContext['currentUser']

    if (role === 'STUDENT') {
      const student = await db.student.findUnique({
        where: { userId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          grade: { select: { name: true } },
          section: { select: { name: true } }
        }
      })

      if (!student) {
        throw new Error('Student not found')
      }

      userContext = {
        id: student.id,
        name: `${student.firstName} ${student.lastName}`,
        role: 'student' as const,
        grade: student.grade.name,
        section: student.section.name
      }
    } else if (role === 'TEACHER') {
      const teacher = await db.teacher.findUnique({
        where: { userId },
        select: {
          id: true,
          firstName: true,
          lastName: true
        }
      })

      if (!teacher) {
        throw new Error('Teacher not found')
      }

      userContext = {
        id: teacher.id,
        name: `${teacher.firstName} ${teacher.lastName}`,
        role: 'teacher' as const
      }
    } else if (role === 'PARENT') {
      const parent = await db.parent.findUnique({
        where: { userId },
        select: {
          id: true,
          firstName: true,
          lastName: true
        }
      })

      if (!parent) {
        throw new Error('Parent not found')
      }

      userContext = {
        id: parent.id,
        name: `${parent.firstName} ${parent.lastName}`,
        role: 'parent' as const
      }
    } else {
      userContext = {
        id: userId,
        name: 'Administrator',
        role: 'admin' as const
      }
    }

    this.setCachedData(cacheKey, userContext)
    return userContext
  }

  async buildContext(userId: string, role: string): Promise<SchoolContext> {
    this.clearExpiredCache()

    const [currentUser, schoolInfo] = await Promise.all([
      this.getUserContext(userId, role),
      this.getSchoolContext()
    ])

    let studentData: SchoolContext['studentData'] | undefined

    if (role === 'PARENT' || role === 'STUDENT') {
      try {
        const studentId = role === 'PARENT'
          ? (await db.parent.findUnique({ where: { userId }, select: { children: { take: 1, select: { id: true } } } }))?.children[0]?.id
          : currentUser.id

        if (studentId) {
          studentData = await this.getStudentData(studentId)
        }
      } catch (error) {
        console.error('Error fetching student data:', error)
      }
    }

    return {
      currentUser,
      studentData,
      schoolInfo
    }
  }

  private getSystemPrompt(context: SchoolContext): string {
    const roleInstructions: Record<string, string> = {
      admin: 'You are assisting a school administrator. Provide information about school operations, staff management, enrollment, and administrative tasks.',
      teacher: 'You are assisting a teacher. Provide information about students, curriculum, attendance, exams, and teaching resources.',
      parent: 'You are assisting a parent. Provide information about their child\'s progress, attendance, fees, school events, and how to support their child.',
      student: 'You are assisting a student. Provide information about their studies, exams, timetable, library books, and school activities.'
    }

    return `
      ${roleInstructions[context.currentUser.role]}

      School Information:
      - Name: ${context.schoolInfo.name}
      - Phone: ${context.schoolInfo.contact.phone}
      - Email: ${context.schoolInfo.contact.email}
      - Address: ${context.schoolInfo.contact.address}
      - Working Hours: ${context.schoolInfo.workingHours}

      ${context.schoolInfo.upcomingEvents.length > 0 ? `
      Upcoming Events:
      ${context.schoolInfo.upcomingEvents.map(event => 
        `- ${event.name} on ${event.date}: ${event.description}`
      ).join('\n')}
      ` : ''}

      ${context.studentData ? `
      Student Information:
      - Name: ${context.studentData.name}
      - Attendance Rate: ${(context.studentData.attendanceRate * 100).toFixed(1)}%
      ${context.studentData.recentExamResults.length > 0 ? `
      Recent Exam Results:
      ${context.studentData.recentExamResults.map(exam => 
        `- ${exam.subject}: ${exam.marks}/${exam.total} (${exam.percentage.toFixed(1)}%)`
      ).join('\n')}
      ` : ''}
      ${context.studentData.upcomingExams.length > 0 ? `
      Upcoming Exams:
      ${context.studentData.upcomingExams.map(exam => 
        `- ${exam.subject} on ${exam.date}`
      ).join('\n')}
      ` : ''}
      ${context.studentData.feeDue ? `- Fee Due: $${context.studentData.feeDue}` : ''}
      ` : ''}

      Provide helpful, accurate, and contextually relevant responses. When appropriate, suggest actions or provide related resources. Be friendly and professional.
    `
  }

  async processMessage(
    userId: string,
    message: string,
    context: SchoolContext
  ): Promise<ChatbotResponse> {
    const conversationHistory = this.conversationHistory.get(userId) || []

    const historyContext = conversationHistory
      .slice(-5)
      .map(entry => `${entry.role}: ${entry.message}`)
      .join('\n')

    const prompt = `
      ${this.getSystemPrompt(context)}

      ${historyContext ? `Conversation History:\n${historyContext}\n\n` : ''}
      User: ${message}

      Provide a helpful response. If appropriate, include:
      - Suggested actions the user can take
      - Follow-up questions to gather more information
      - Related resources (if applicable)

      Respond in JSON format:
      {
        "message": string,
        "suggestedActions": [
          {
            "label": string,
            "action": string,
            "parameters": { [key: string]: any }
          }
        ],
        "followUpQuestions": string[],
        "relatedResources": [
          {
            "title": string,
            "url": string,
            "description": string
          }
        ]
      }
    `

    const result = await this.client.generateJSON<ChatbotResponse>(prompt)

    if (!result.success) {
      throw new Error(result.error || 'Failed to process message')
    }

    this.updateConversationHistory(userId, message, result.data.message)

    return result.data
  }

  async processMessageWithStreaming(
    userId: string,
    message: string,
    context: SchoolContext,
    onChunk: (chunk: string) => void
  ): Promise<ChatbotResponse> {
    const conversationHistory = this.conversationHistory.get(userId) || []

    const historyContext = conversationHistory
      .slice(-5)
      .map(entry => `${entry.role}: ${entry.message}`)
      .join('\n')

    const prompt = `
      ${this.getSystemPrompt(context)}

      ${historyContext ? `Conversation History:\n${historyContext}\n\n` : ''}
      User: ${message}

      Provide a helpful response. Be conversational and engaging.
    `

    let fullMessage = ''
    const streamingResult = await this.client.generateWithStreaming(prompt, (chunk) => {
      fullMessage += chunk
      onChunk(chunk)
    })

    if (!streamingResult.success) {
      throw new Error(streamingResult.error || 'Failed to process message with streaming')
    }

    this.updateConversationHistory(userId, message, fullMessage)

    return {
      message: fullMessage,
      suggestedActions: [],
      followUpQuestions: []
    }
  }

  private updateConversationHistory(userId: string, userMessage: string, assistantMessage: string): void {
    const history = this.conversationHistory.get(userId) || []
    history.push(
      { role: 'user', message: userMessage, timestamp: new Date() },
      { role: 'assistant', message: assistantMessage, timestamp: new Date() }
    )
    
    if (history.length > 20) {
      history.splice(0, history.length - 20)
    }
    
    this.conversationHistory.set(userId, history)
  }

  clearConversationHistory(userId: string): void {
    this.conversationHistory.delete(userId)
  }

  getConversationHistory(userId: string): ConversationHistory[] {
    return this.conversationHistory.get(userId) || []
  }
}

export const smartChatbotService = new SmartChatbotService()

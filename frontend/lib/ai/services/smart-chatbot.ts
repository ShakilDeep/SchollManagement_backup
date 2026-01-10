import { GeminiClient } from '../gemini-client'
import { ChatbotResponse } from '../types'

interface SchoolContext {
  currentUser: {
    id: string
    name: string
    role: 'admin' | 'teacher' | 'parent' | 'student'
    grade?: string
    section?: string
  }
  studentData?: {
    id: string
    name: string
    attendanceRate: number
    recentExamResults: Array<{
      subject: string
      marks: number
      total: number
      percentage: number
    }>
    upcomingExams: Array<{
      subject: string
      date: string
    }>
    feeDue?: number
  }
  schoolInfo: {
    name: string
    contact: {
      phone: string
      email: string
      address: string
    }
    workingHours: string
    upcomingEvents: Array<{
      name: string
      date: string
      description: string
    }>
  }
}

interface ConversationHistory {
  role: 'user' | 'assistant'
  message: string
  timestamp: Date
}

export class SmartChatbotService {
  private client: GeminiClient
  private conversationHistory: Map<string, ConversationHistory[]> = new Map()

  constructor() {
    this.client = new GeminiClient('gemini-1.5-flash', {
      temperature: 0.6,
      maxOutputTokens: 1024
    })
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

import { GeminiClient } from '../gemini-client'
import { db } from '@/lib/db'
import { validateMessageData } from '../utils/data-validation'

export interface MessageContext {
  id: string
  senderId: string
  senderName: string
  receiverId: string
  receiverName: string
  subject?: string
  content: string
  type: string
  priority: string
  createdAt: Date
}

export interface ReplySuggestion {
  id: string
  message: string
  tone: 'formal' | 'friendly' | 'urgent' | 'professional' | 'neutral'
  confidence: number
  category: string
}

export class MessageReplySuggestionsService {
  private client: GeminiClient
  private dataCache: Map<string, { data: MessageContext[]; timestamp: number }> = new Map()
  private readonly CACHE_TTL = 180000

  constructor() {
    this.client = new GeminiClient('gemini-1.5-flash', {
      temperature: 0.7,
      maxOutputTokens: 1024
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

  private getCachedData(key: string): MessageContext[] | null {
    const cached = this.dataCache.get(key)
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data
    }
    return null
  }

  private setCachedData(key: string, data: MessageContext[]): void {
    this.dataCache.set(key, { data, timestamp: Date.now() })
  }

  async loadMessageHistory(
    userId: string,
    otherUserId: string,
    limit: number = 10
  ): Promise<MessageContext[]> {
    const cacheKey = `messages_${userId}_${otherUserId}_${limit}`
    const cached = this.getCachedData(cacheKey)
    if (cached) return cached

    const [messages, sender, receiver] = await Promise.all([
      db.message.findMany({
        where: {
          OR: [
            { senderId: userId, receiverId: otherUserId },
            { senderId: otherUserId, receiverId: userId }
          ]
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: limit
      }),
      db.user.findUnique({
        where: { id: userId },
        select: { name: true, email: true, role: true }
      }),
      db.user.findUnique({
        where: { id: otherUserId },
        select: { name: true, email: true, role: true }
      })
    ])

    const context: MessageContext[] = messages.map(m => ({
      id: m.id,
      senderId: m.senderId,
      senderName: m.senderId === userId ? sender?.name || 'Unknown' : receiver?.name || 'Unknown',
      receiverId: m.receiverId,
      receiverName: m.receiverId === userId ? sender?.name || 'Unknown' : receiver?.name || 'Unknown',
      subject: m.subject || undefined,
      content: m.content,
      type: m.type,
      priority: m.priority,
      createdAt: m.createdAt
    }))

    this.setCachedData(cacheKey, context)
    return context
  }

  async loadRecentMessages(userId: string, limit: number = 20): Promise<MessageContext[]> {
    const cacheKey = `recent_messages_${userId}_${limit}`
    const cached = this.getCachedData(cacheKey)
    if (cached) return cached

    const messages = await db.message.findMany({
      where: {
        OR: [
          { senderId: userId },
          { receiverId: userId }
        ]
      },
      include: {
        sender: {
          select: { name: true, email: true, role: true }
        },
        receiver: {
          select: { name: true, email: true, role: true }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    })

    const context: MessageContext[] = messages.map(m => ({
      id: m.id,
      senderId: m.senderId,
      senderName: m.sender.name,
      receiverId: m.receiverId,
      receiverName: m.receiver.name,
      subject: m.subject || undefined,
      content: m.content,
      type: m.type,
      priority: m.priority,
      createdAt: m.createdAt
    }))

    this.setCachedData(cacheKey, context)
    return context
  }

  async generateReplySuggestions(
    message: MessageContext,
    messageHistory?: MessageContext[],
    tone?: 'formal' | 'friendly' | 'urgent' | 'professional' | 'neutral'
  ): Promise<ReplySuggestion[]> {
    this.clearExpiredCache()

    const validation = validateMessageData({
      senderId: message.senderId,
      receiverId: message.receiverId,
      content: message.content,
      type: message.type,
      priority: message.priority
    })

    if (!validation.isValid) {
      console.warn('Message validation issues:', validation.issues)
    }

    const history = messageHistory || await this.loadMessageHistory(message.receiverId, message.senderId, 5)
    const conversationContext = history.slice(0, 5).map(m => ({
      from: m.senderName,
      to: m.receiverName,
      content: m.content,
      date: m.createdAt.toISOString()
    }))

    try {
      const prompt = `
        You are an expert communication assistant for a school management system. Generate reply suggestions for the following message:

        Message Details:
        - From: ${message.senderName}
        - To: ${message.receiverName}
        - Subject: ${message.subject || 'No subject'}
        - Type: ${message.type}
        - Priority: ${message.priority}
        - Content: ${message.content}

        Conversation History (recent):
        ${conversationContext.map(h => `- ${h.from} to ${h.to} (${h.date}): ${h.content}`).join('\n')}

        ${tone ? `Tone Preference: ${tone}` : ''}

        Generate 3-5 reply suggestions. Each suggestion should be:
        1. Appropriate for a school environment
        2. Respectful and professional
        3. Concise but clear
        4. Contextually relevant

        For each suggestion, provide:
        - The suggested reply message
        - Tone (formal, friendly, urgent, professional, neutral)
        - Confidence score (0.0-1.0)
        - Category (acknowledgment, question, request, information, action_required)

        Respond in JSON array format:
        [
          {
            "message": string,
            "tone": string,
            "confidence": number,
            "category": string
          }
        ]
      `

      const result = await this.client.generateJSON<ReplySuggestion[]>(prompt)

      if (result.success && result.data && result.data.length > 0) {
        return result.data.map((suggestion, index) => ({
          id: `suggestion-${Date.now()}-${index}`,
          message: suggestion.message,
          tone: suggestion.tone,
          confidence: suggestion.confidence,
          category: suggestion.category
        }))
      }
    } catch (error) {
      console.error('AI reply suggestion generation failed, using fallback logic:', error)
    }

    return this.generateFallbackSuggestions(message, tone)
  }

  private generateFallbackSuggestions(
    message: MessageContext,
    tone?: 'formal' | 'friendly' | 'urgent' | 'professional' | 'neutral'
  ): ReplySuggestion[] {
    const suggestions: ReplySuggestion[] = []
    const defaultTone = tone || 'professional'

    if (message.priority === 'Urgent' || message.type === 'Complaint') {
      suggestions.push({
        id: `suggestion-${Date.now()}-1`,
        message: `Thank you for bringing this to my attention. I understand the urgency and will look into this matter immediately. I'll get back to you as soon as possible with an update.`,
        tone: 'urgent',
        confidence: 0.85,
        category: 'acknowledgment'
      })
      suggestions.push({
        id: `suggestion-${Date.now()}-2`,
        message: `I've received your message and understand this requires immediate attention. I'm reviewing the details now and will provide a response shortly.`,
        tone: 'professional',
        confidence: 0.8,
        category: 'action_required'
      })
    } else if (message.type === 'Inquiry') {
      suggestions.push({
        id: `suggestion-${Date.now()}-3`,
        message: `Thank you for your inquiry. I'll gather the necessary information and get back to you with a detailed response.`,
        tone: defaultTone,
        confidence: 0.75,
        category: 'acknowledgment'
      })
      suggestions.push({
        id: `suggestion-${Date.now()}-4`,
        message: `I received your question and I'm happy to help. Let me check and provide you with the information you need.`,
        tone: 'friendly',
        confidence: 0.7,
        category: 'information'
      })
    } else {
      suggestions.push({
        id: `suggestion-${Date.now()}-5`,
        message: `Thank you for your message. I've noted the details and will respond accordingly.`,
        tone: defaultTone,
        confidence: 0.7,
        category: 'acknowledgment'
      })
      suggestions.push({
        id: `suggestion-${Date.now()}-6`,
        message: `Received, thank you. I'll review this and follow up as needed.`,
        tone: 'neutral',
        confidence: 0.65,
        category: 'acknowledgment'
      })
    }

    return suggestions.slice(0, 5)
  }

  async getQuickReplies(
    messageContent: string,
    messageType: string
  ): Promise<string[]> {
    const quickReplies: string[] = []

    if (messageType === 'Inquiry') {
      quickReplies.push('Thank you for your inquiry. I\'ll look into this and get back to you.')
      quickReplies.push('I\'ve received your question. Let me check and provide you with an update.')
    } else if (messageType === 'Complaint') {
      quickReplies.push('I understand your concern and will address this matter immediately.')
      quickReplies.push('Thank you for bringing this to my attention. I\'ll investigate and resolve this issue.')
    } else if (messageType === 'Request') {
      quickReplies.push('I\'ve received your request and will process it shortly.')
      quickReplies.push('Thank you for your request. I\'ll review it and respond accordingly.')
    } else {
      quickReplies.push('Thank you for your message. I\'ll review and respond as needed.')
      quickReplies.push('Received. I\'ll get back to you soon.')
    }

    return quickReplies
  }
}

export const messageReplySuggestionsService = new MessageReplySuggestionsService()

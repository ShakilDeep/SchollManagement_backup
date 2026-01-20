import { NextRequest, NextResponse } from 'next/server'
import { messageReplySuggestionsService } from '@/lib/ai/services/message-reply-suggestions'
import { fetchAPI } from '@/lib/api/client'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { messageId, message, senderId, receiverId, tone } = body

    if (!message && !messageId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Either messageId or message object is required'
        },
        { status: 400 }
      )
    }

    let messageContext

    if (messageId) {
      const dbMessage = await fetchAPI<any>(`/messaging/${messageId}/`)

      if (!dbMessage) {
        return NextResponse.json(
          {
            success: false,
            error: 'Message not found'
          },
          { status: 404 }
        )
      }

      messageContext = {
        id: dbMessage.id,
        senderId: dbMessage.sender || dbMessage.senderId,
        senderName: dbMessage.sender_details?.name || dbMessage.sender?.name || 'Unknown',
        receiverId: dbMessage.receiver || dbMessage.receiverId,
        receiverName: dbMessage.receiver_details?.name || dbMessage.receiver?.name || 'Unknown',
        subject: dbMessage.subject || undefined,
        content: dbMessage.content,
        type: dbMessage.type || 'Direct',
        priority: dbMessage.priority || 'Normal',
        createdAt: dbMessage.created_at || dbMessage.createdAt
      }
    } else {
      messageContext = {
        id: message.id || '',
        senderId: message.senderId || senderId,
        senderName: message.senderName || '',
        receiverId: message.receiverId || receiverId,
        receiverName: message.receiverName || '',
        subject: message.subject,
        content: message.content,
        type: message.type || 'General',
        priority: message.priority || 'Normal',
        createdAt: message.createdAt ? new Date(message.createdAt) : new Date()
      }
    }

    const suggestions = await messageReplySuggestionsService.generateReplySuggestions(
      messageContext,
      undefined,
      tone
    )

    return NextResponse.json({
      success: true,
      data: {
        suggestions,
        messageContext: {
          id: messageContext.id,
          subject: messageContext.subject,
          content: messageContext.content,
          type: messageContext.type,
          priority: messageContext.priority
        }
      }
    })
  } catch (error) {
    console.error('Message reply suggestions error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate reply suggestions'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const messageId = searchParams.get('messageId')
    const tone = searchParams.get('tone') as 'formal' | 'friendly' | 'urgent' | 'professional' | 'neutral' | undefined

    if (!messageId) {
      return NextResponse.json(
        {
          success: false,
          error: 'messageId is required'
        },
        { status: 400 }
      )
    }

    const dbMessage = await fetchAPI<any>(`/messaging/${messageId}/`)

    if (!dbMessage) {
      return NextResponse.json(
        {
          success: false,
          error: 'Message not found'
        },
        { status: 404 }
      )
    }

    const messageContext = {
      id: dbMessage.id,
      senderId: dbMessage.sender || dbMessage.senderId,
      senderName: dbMessage.sender_details?.name || dbMessage.sender?.name || 'Unknown',
      receiverId: dbMessage.receiver || dbMessage.receiverId,
      receiverName: dbMessage.receiver_details?.name || dbMessage.receiver?.name || 'Unknown',
      subject: dbMessage.subject || undefined,
      content: dbMessage.content,
      type: dbMessage.type || 'Direct',
      priority: dbMessage.priority || 'Normal',
      createdAt: dbMessage.created_at || dbMessage.createdAt
    }

    const suggestions = await messageReplySuggestionsService.generateReplySuggestions(
      messageContext,
      undefined,
      tone
    )

    return NextResponse.json({
      success: true,
      data: {
        suggestions,
        messageContext: {
          id: messageContext.id,
          subject: messageContext.subject,
          content: messageContext.content,
          type: messageContext.type,
          priority: messageContext.priority
        }
      }
    })
  } catch (error) {
    console.error('Message reply suggestions error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate reply suggestions'
      },
      { status: 500 }
    )
  }
}

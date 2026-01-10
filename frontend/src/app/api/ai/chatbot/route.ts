import { NextRequest, NextResponse } from 'next/server'
import { smartChatbotService } from '@/lib/ai/services/smart-chatbot'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, message, userRole, streaming = false } = body

    if (!userId || !message || !userRole) {
      return NextResponse.json(
        {
          success: false,
          error: 'userId, message, and userRole are required'
        },
        { status: 400 }
      )
    }

    const context = await smartChatbotService.buildContext(userId, userRole)

    if (streaming) {
      const encoder = new TextEncoder()
      const stream = new ReadableStream({
        async start(controller) {
          try {
            await smartChatbotService.processMessageWithStreaming(
              userId,
              message,
              context,
              (chunk) => {
                controller.enqueue(encoder.encode(chunk))
              }
            )
            controller.close()
          } catch (error) {
            controller.error(error)
          }
        }
      })

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/plain',
          'Transfer-Encoding': 'chunked'
        }
      })
    } else {
      const response = await smartChatbotService.processMessage(userId, message, context)

      return NextResponse.json({
        success: true,
        data: response
      })
    }
  } catch (error) {
    console.error('Chatbot error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process message'
      },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'userId is required'
        },
        { status: 400 }
      )
    }

    smartChatbotService.clearConversationHistory(userId)

    return NextResponse.json({
      success: true,
      message: 'Conversation history cleared'
    })
  } catch (error) {
    console.error('Chatbot clear history error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to clear conversation history'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'userId is required'
        },
        { status: 400 }
      )
    }

    const history = chatbotService.getConversationHistory(userId)

    return NextResponse.json({
      success: true,
      data: history
    })
  } catch (error) {
    console.error('Chatbot get history error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get conversation history'
      },
      { status: 500 }
    )
  }
}

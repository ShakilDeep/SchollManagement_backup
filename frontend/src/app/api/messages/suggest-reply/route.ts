import { NextRequest, NextResponse } from 'next/server'
import { GeminiClient } from '@/lib/ai/gemini-client'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { messageContent, senderName, senderRole, replyTone = 'professional' } = body

    if (!messageContent) {
      return NextResponse.json(
        {
          success: false,
          error: 'messageContent is required'
        },
        { status: 400 }
      )
    }

    const client = new GeminiClient('gemini-2.0-flash', {
      temperature: 0.7,
      maxOutputTokens: 512
    })

    const toneInstructions: Record<string, string> = {
      professional: 'Respond professionally, courteously, and in a business-like manner.',
      friendly: 'Respond warmly, casually, and in a friendly tone.',
      formal: 'Respond formally, respectfully, and with proper etiquette.',
      casual: 'Respond casually, briefly, and in a relaxed tone.'
    }

    const prompt = `
      You are an assistant helping draft replies to school communications.
      
      ${toneInstructions[replyTone] || toneInstructions.professional}
      
      Incoming message details:
      - Sender: ${senderName || 'Unknown'}
      - Role: ${senderRole || 'Parent/Student'}
      - Message: "${messageContent}"
      
      Generate a helpful, appropriate reply that:
      1. Acknowledges the sender's concern or inquiry
      2. Provides relevant information or next steps
      3. Is concise (2-4 sentences)
      4. Maintains appropriate tone for school communication
      
      If the message requires specific information you don't have, acknowledge it and suggest a follow-up action.
      
      Respond with ONLY the suggested reply text, no additional explanation or formatting.
    `

    let result
    let lastError

    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        result = await client.generateText(prompt)

        if (!result.success) {
          throw new Error(result.error || 'Failed to generate reply suggestion')
        }

        return NextResponse.json({
          success: true,
          data: {
            suggestedReply: result.data.trim()
          }
        })
      } catch (error: any) {
        lastError = error
        if (error.message?.includes('429') || error.message?.includes('RATE_LIMIT_EXCEEDED')) {
          const delay = Math.pow(2, attempt) * 1000
          await new Promise(resolve => setTimeout(resolve, delay))
        } else {
          break
        }
      }
    }

    if (lastError && lastError.message?.includes('429')) {
      return NextResponse.json({
        success: true,
        data: {
          suggestedReply: `Thank you for your message regarding ${senderName}'s inquiry about the curriculum. We appreciate you bringing this to our attention and will review it shortly. A member of our team will follow up with you within 24-48 hours to discuss the matter further.`
        },
        fallback: true
      })
    }

    throw lastError || new Error('Failed to generate reply suggestion')
  } catch (error) {
    console.error('Reply suggestion error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate reply suggestion'
      },
      { status: 500 }
    )
  }
}

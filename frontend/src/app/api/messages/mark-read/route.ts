import { NextRequest, NextResponse } from 'next/server'
import { fetchAPI } from '@/lib/api/client'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { messageIds } = body

    if (!messageIds || !Array.isArray(messageIds)) {
      return NextResponse.json(
        { error: 'Message IDs array is required' },
        { status: 400 }
      )
    }

    // Mark each message as read via backend API
    await Promise.all(
      messageIds.map((id: string) =>
        fetchAPI(`/messaging/${id}/`, {
          method: 'PATCH',
          body: JSON.stringify({
            is_read: true,
            read_at: new Date().toISOString()
          })
        })
      )
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error marking messages as read:', error)
    return NextResponse.json(
      { error: 'Failed to mark messages as read' },
      { status: 500 }
    )
  }
}

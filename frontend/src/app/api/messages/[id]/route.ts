import { NextRequest, NextResponse } from 'next/server'
import { fetchAPI } from '@/lib/api/client'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const message = await fetchAPI<any>(`/messaging/${params.id}/`)

    const transformedMessage = {
      id: message.id,
      senderId: message.sender || message.senderId,
      receiverId: message.receiver || message.receiverId,
      subject: message.subject,
      content: message.content,
      type: message.type || 'Direct',
      priority: message.priority || 'Normal',
      isRead: message.is_read || message.isRead || false,
      readAt: message.read_at || message.readAt,
      createdAt: message.created_at || message.createdAt,
      sender: message.sender_details || message.sender,
      receiver: message.receiver_details || message.receiver,
    }

    return NextResponse.json(transformedMessage)
  } catch (error) {
    console.error('Error fetching message:', error)
    return NextResponse.json({ error: 'Failed to fetch message' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { isRead } = body

    const updateData: any = {}

    if (isRead !== undefined) {
      updateData.is_read = isRead
      updateData.read_at = isRead ? new Date().toISOString() : null
    }

    const message = await fetchAPI(`/messaging/${params.id}/`, {
      method: 'PATCH',
      body: JSON.stringify(updateData)
    })

    const transformedMessage = {
      id: message.id,
      senderId: message.sender || message.senderId,
      receiverId: message.receiver || message.receiverId,
      subject: message.subject,
      content: message.content,
      type: message.type || 'Direct',
      priority: message.priority || 'Normal',
      isRead: message.is_read || message.isRead || false,
      readAt: message.read_at || message.readAt,
      createdAt: message.created_at || message.createdAt,
      sender: message.sender_details || message.sender,
      receiver: message.receiver_details || message.receiver,
    }

    return NextResponse.json(transformedMessage)
  } catch (error) {
    console.error('Error updating message:', error)
    return NextResponse.json({ error: 'Failed to update message' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await fetchAPI(`/messaging/${params.id}/`, {
      method: 'DELETE'
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting message:', error)
    return NextResponse.json({ error: 'Failed to delete message' }, { status: 500 })
  }
}

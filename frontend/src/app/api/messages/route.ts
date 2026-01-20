import { NextRequest, NextResponse } from 'next/server'
import { fetchAPI } from '@/lib/api/client'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const folder = searchParams.get('folder') || 'inbox'
    const userId = searchParams.get('userId')
    const priority = searchParams.get('priority')
    const isRead = searchParams.get('isRead')

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Build query parameters for backend API
    const queryParams: Record<string, string> = {}
    if (folder === 'inbox') {
      queryParams.receiver = userId
    } else if (folder === 'sent') {
      queryParams.sender = userId
    }
    if (priority) queryParams.priority = priority
    if (isRead !== null) queryParams.is_read = isRead

    const response = await fetchAPI<{ results: any[] }>('/messaging/', { query: queryParams })
    const messages = response.results || []

    const transformedMessages = messages.map((msg: any) => ({
      id: msg.id,
      senderId: msg.sender || msg.senderId,
      receiverId: msg.receiver || msg.receiverId,
      subject: msg.subject,
      content: msg.content,
      type: msg.type || 'Direct',
      priority: msg.priority || 'Normal',
      isRead: msg.is_read || msg.isRead || false,
      createdAt: msg.created_at || msg.createdAt || new Date().toISOString(),
      sender: msg.sender_details || msg.sender,
      receiver: msg.receiver_details || msg.receiver,
    }))

    return NextResponse.json(transformedMessages)
  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { senderId, receiverId, subject, content, type, priority } = body

    if (!senderId || !receiverId || !content) {
      return NextResponse.json(
        { error: 'Sender, receiver, and content are required' },
        { status: 400 }
      )
    }

    let actualReceiverId = receiverId

    // If receiverId is an email, look up the user
    if (receiverId.includes('@')) {
      try {
        const usersResponse = await fetchAPI<{ results: any[] }>('/users/')
        const users = usersResponse.results || []
        const receiver = users.find((u: any) => u.email === receiverId)
        if (!receiver) {
          return NextResponse.json(
            { error: 'Recipient not found' },
            { status: 404 }
          )
        }
        actualReceiverId = receiver.id
      } catch {
        // Continue with original receiverId if lookup fails
      }
    }

    const message = await fetchAPI('/messaging/', {
      method: 'POST',
      body: JSON.stringify({
        sender: senderId,
        receiver: actualReceiverId,
        subject,
        content,
        type: type || 'Direct',
        priority: priority || 'Normal',
        is_read: false,
      })
    })

    return NextResponse.json(message, { status: 201 })
  } catch (error) {
    console.error('Error creating message:', error)
    return NextResponse.json({ error: 'Failed to create message' }, { status: 500 })
  }
}

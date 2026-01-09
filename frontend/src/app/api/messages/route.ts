import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

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

    const where: any = {}

    if (folder === 'inbox') {
      where.receiverId = userId
    } else if (folder === 'sent') {
      where.senderId = userId
    }

    if (priority) {
      where.priority = priority
    }

    if (isRead !== null) {
      where.isRead = isRead === 'true'
    }

    const messages = await db.message.findMany({
      where,
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(messages)
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

    if (receiverId.includes('@')) {
      const receiver = await db.user.findUnique({
        where: { email: receiverId },
        select: { id: true }
      })
      if (!receiver) {
        console.error('Recipient not found:', receiverId)
        return NextResponse.json(
          { error: 'Recipient not found' },
          { status: 404 }
        )
      }
      actualReceiverId = receiver.id
    }

    const sender = await db.user.findUnique({
      where: { id: senderId },
      select: { id: true }
    })

    if (!sender) {
      console.error('Sender not found:', senderId)
      return NextResponse.json(
        { error: 'Sender not found' },
        { status: 404 }
      )
    }

    const message = await db.message.create({
      data: {
        senderId,
        receiverId: actualReceiverId,
        subject,
        content,
        type: type || 'Direct',
        priority: priority || 'Normal',
        isRead: false,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
    })

    return NextResponse.json(message, { status: 201 })
  } catch (error) {
    console.error('Error creating message:', error)
    return NextResponse.json({ error: 'Failed to create message' }, { status: 500 })
  }
}

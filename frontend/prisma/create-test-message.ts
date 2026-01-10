import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function createTestMessage() {
  try {
    const senderUser = await prisma.user.findUnique({
      where: { email: 'robert.anderson@school.edu' },
    })

    const receiverUser = await prisma.user.findUnique({
      where: { email: 'admin@school.edu' },
    })

    if (!senderUser || !receiverUser) {
      console.error('Users not found')
      return
    }

    const message = await prisma.message.create({
      data: {
        senderId: senderUser.id,
        receiverId: receiverUser.id,
        subject: 'Question about math curriculum',
        content: 'I have a question about the calculus curriculum for Grade 10. Can we schedule a meeting to discuss the upcoming exams and potential adjustments to the teaching materials?',
        type: 'Direct',
        priority: 'Normal',
        isRead: false,
      },
      include: {
        sender: { select: { id: true, name: true, email: true, avatar: true } },
        receiver: { select: { id: true, name: true, email: true, avatar: true } },
      },
    })

    console.log('Test message created successfully!')
    console.table(message)
  } catch (error) {
    console.error('Error creating test message:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createTestMessage()

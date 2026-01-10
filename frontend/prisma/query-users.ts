import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function queryUsers() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
      take: 10,
    })

    console.log('Users in database:')
    console.table(users)
  } catch (error) {
    console.error('Error querying users:', error)
  } finally {
    await prisma.$disconnect()
  }
}

queryUsers()

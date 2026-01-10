import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const students = await prisma.student.findMany({
    take: 5,
    select: {
      id: true,
      firstName: true,
      lastName: true,
      grade: {
        select: {
          name: true
        }
      },
      section: {
        select: {
          name: true
        }
      }
    }
  })
  console.log(JSON.stringify(students, null, 2))
  await prisma.$disconnect()
}

main()

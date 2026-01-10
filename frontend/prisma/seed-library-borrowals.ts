import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedLibraryBorrowals() {
  console.log('Starting library borrowals seeding...')

  const books = await prisma.book.findMany()
  if (books.length === 0) {
    console.error('No books found. Please seed books first.')
    return
  }

  const students = await prisma.student.findMany({
    include: {
      grade: true,
      section: true
    }
  })

  if (students.length === 0) {
    console.error('No students found. Please seed students first.')
    return
  }

  const statuses = ['Borrowed', 'Returned', 'Overdue'] as const
  let borrowalsCreated = 0

  const today = new Date()
  const twoWeeksAgo = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000)
  const oneMonthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)

  for (const student of students.slice(0, 20)) {
    const numBorrowals = Math.floor(Math.random() * 3) + 1

    for (let i = 0; i < numBorrowals; i++) {
      const book = books[Math.floor(Math.random() * books.length)]
      const status = statuses[Math.floor(Math.random() * statuses.length)]
      
      const borrowDate = new Date(twoWeeksAgo.getTime() + Math.random() * 14 * 24 * 60 * 60 * 1000)
      const dueDate = new Date(borrowDate.getTime() + 14 * 24 * 60 * 60 * 1000)
      
      let returnDate: Date | null = null
      let fine = 0

      if (status === 'Returned') {
        returnDate = new Date(borrowDate.getTime() + (7 + Math.random() * 10) * 24 * 60 * 60 * 1000)
        if (returnDate > dueDate) {
          const daysOverdue = Math.floor((returnDate.getTime() - dueDate.getTime()) / (24 * 60 * 60 * 1000))
          fine = daysOverdue * 0.5
        }
      } else if (status === 'Overdue') {
        const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (24 * 60 * 60 * 1000))
        fine = daysOverdue * 0.5
      }

      try {
        const borrowal = await prisma.libraryBorrowal.create({
          data: {
            bookId: book.id,
            studentId: student.id,
            borrowDate: borrowDate,
            dueDate: dueDate,
            returnDate: returnDate,
            status: status,
            fine: fine,
            remarks: status === 'Returned' ? 'Returned in good condition' : status === 'Overdue' ? 'Overdue - please return soon' : 'Active borrowing'
          }
        })

        borrowalsCreated++
        console.log(`Created borrowal for ${student.firstName} ${student.lastName} - ${book.title}`)
      } catch (error) {
        console.error(`Error creating borrowal for student ${student.rollNumber}:`, error)
      }
    }
  }

  console.log(`Created ${borrowalsCreated} library borrowals`)
  console.log('Library borrowals seeding completed successfully!')
}

seedLibraryBorrowals()
  .catch((error) => {
    console.error('Error seeding library borrowals:', error)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function updateLibraryAvailability() {
  console.log('Updating library book availability based on borrowals...')

  const books = await prisma.book.findMany()

  for (const book of books) {
    const activeBorrowals = await prisma.libraryBorrowal.count({
      where: {
        bookId: book.id,
        status: 'Borrowed'
      }
    })

    const availableCopies = Math.max(0, book.totalCopies - activeBorrowals)

    if (availableCopies !== book.availableCopies) {
      await prisma.book.update({
        where: { id: book.id },
        data: { availableCopies }
      })
      console.log(`Updated ${book.title}: ${book.totalCopies} total, ${availableCopies} available`)
    }
  }

  console.log('Library availability updated successfully!')
}

updateLibraryAvailability()
  .catch((error) => {
    console.error('Error updating library availability:', error)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { libraryRecommendationsService } from '@/lib/ai/services/library-recommendations'
import { retryWithBackoff } from '@/lib/utils/retry'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const studentId = searchParams.get('studentId')

    if (!studentId) {
      return NextResponse.json(
        { error: 'Student ID is required' },
        { status: 400 }
      )
    }

    const [borrowals, books] = await Promise.all([
      db.libraryBorrowal.findMany({
        where: {
          studentId
        },
        orderBy: {
          borrowDate: 'desc'
        },
        take: 20
      }),
      db.book.findMany({
        where: {
          availableCopies: {
            gt: 0
          }
        },
        orderBy: {
          title: 'asc'
        }
      })
    ])

    const borrowingHistory = borrowals.map(b => ({
      id: b.id,
      bookTitle: b.bookTitle,
      bookIsbn: b.bookIsbn,
      borrowDate: b.borrowDate.toISOString(),
      returnDate: b.returnDate?.toISOString(),
      status: b.returnDate ? 'Returned' : b.status
    }))

    const allBooks = books.map(b => ({
      id: b.id,
      isbn: b.isbn,
      title: b.title,
      author: b.author,
      category: b.category,
      totalCopies: b.totalCopies,
      availableCopies: b.availableCopies,
      location: b.location,
      publisher: b.publisher,
      publicationYear: b.publicationYear
    }))

    const recommendations = await retryWithBackoff(
      () => libraryRecommendationsService.getRecommendationsForStudent(
        studentId,
        borrowingHistory,
        allBooks
      ),
      3,
      1000
    )

    return NextResponse.json(recommendations)
  } catch (error) {
    console.error('Library recommendations error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to generate book recommendations', details: errorMessage },
      { status: 500 }
    )
  }
}

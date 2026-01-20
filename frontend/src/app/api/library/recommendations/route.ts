import { NextRequest, NextResponse } from 'next/server'
import { fetchAPI } from '@/lib/api/client'
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

    // Fetch borrowals from backend API
    const borrowalsResponse = await fetchAPI<{ results: any[] }>(`/library/borrowals/?student=${studentId}`)
    const borrowals = borrowalsResponse.results || []

    // Fetch books from backend API
    const booksResponse = await fetchAPI<{ results: any[] }>('/library/books/')
    const books = booksResponse.results || []

    const borrowingHistory = borrowals.map((b: any) => ({
      id: b.id,
      bookTitle: b.book_title || b.bookTitle || 'Unknown',
      bookIsbn: b.book_isbn || b.bookIsbn || '',
      borrowDate: b.borrow_date || b.borrowDate || new Date().toISOString(),
      returnDate: b.return_date || b.returnDate,
      status: b.return_date ? 'Returned' : (b.status || 'Borrowed')
    }))

    const allBooks = books.map((b: any) => ({
      id: b.id,
      isbn: b.isbn,
      title: b.title || 'Unknown',
      author: b.author || 'Unknown',
      category: b.category,
      totalCopies: b.total_copies || b.totalCopies || 0,
      availableCopies: b.available_copies || b.availableCopies || 0,
      location: b.location,
      publisher: b.publisher,
      publicationYear: b.publication_year || b.publicationYear
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

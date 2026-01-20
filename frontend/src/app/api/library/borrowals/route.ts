import { NextResponse } from 'next/server'
import { fetchAPI } from '@/lib/api/client'

export async function GET() {
  try {
    const response = await fetchAPI<{ results: any[] }>('/library/borrowals/')
    const borrowals = response.results || []

    const formattedBorrowals = borrowals.map((b: any) => ({
      id: b.id,
      bookTitle: b.book_title || b.bookTitle || 'Unknown',
      bookIsbn: b.book_isbn || b.bookIsbn || '',
      studentName: b.student_name || b.studentName || 'Unknown',
      studentRollNumber: b.roll_number || b.rollNumber || '',
      borrowDate: b.borrow_date || b.borrowDate || new Date().toISOString().split('T')[0],
      dueDate: b.due_date || b.dueDate || '',
      returnDate: b.return_date || b.returnDate || null,
      status: b.status || 'Borrowed',
      fine: b.fine || b.fine_amount || 0
    }))

    return NextResponse.json(formattedBorrowals)
  } catch (error) {
    console.error('[BORROWALS_GET]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { bookId, studentId, dueDate, remarks } = body

    if (!bookId || !studentId || !dueDate) {
      return new NextResponse('Missing required fields', { status: 400 })
    }

    const borrowal = await fetchAPI('/library/borrowals/', {
      method: 'POST',
      body: JSON.stringify({
        book: bookId,
        student: studentId,
        due_date: dueDate,
        remarks
      })
    })

    return NextResponse.json(borrowal)
  } catch (error) {
    console.error('[BORROWALS_POST]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}

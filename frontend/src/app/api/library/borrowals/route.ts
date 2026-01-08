import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const borrowals = await db.libraryBorrowal.findMany({
      include: {
        book: {
          select: {
            title: true,
            isbn: true,
          },
        },
        student: {
          select: {
            firstName: true,
            lastName: true,
            rollNumber: true,
          },
        },
      },
      orderBy: {
        borrowDate: 'desc',
      },
    })

    const formattedBorrowals = borrowals.map((borrowal) => ({
      id: borrowal.id,
      bookTitle: borrowal.book.title,
      bookIsbn: borrowal.book.isbn,
      studentName: `${borrowal.student.firstName} ${borrowal.student.lastName}`,
      studentRollNumber: borrowal.student.rollNumber,
      borrowDate: borrowal.borrowDate.toISOString().split('T')[0],
      dueDate: borrowal.dueDate.toISOString().split('T')[0],
      returnDate: borrowal.returnDate?.toISOString().split('T')[0] || null,
      status: borrowal.status,
      fine: borrowal.fine,
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

    const borrowal = await db.libraryBorrowal.create({
      data: {
        bookId,
        studentId,
        borrowDate: new Date(),
        dueDate: new Date(dueDate),
        status: 'Borrowed',
        remarks,
      },
    })

    return NextResponse.json(borrowal)
  } catch (error) {
    console.error('[BORROWALS_POST]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}

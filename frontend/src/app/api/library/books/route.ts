import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const books = await db.book.findMany({
      orderBy: {
        title: 'asc',
      },
    })

    return NextResponse.json(books)
  } catch (error) {
    console.error('[BOOKS_GET]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      isbn,
      title,
      author,
      publisher,
      publicationYear,
      category,
      language,
      pageCount,
      totalCopies,
      location,
      description,
    } = body

    if (!isbn || !title || !author || !category || !totalCopies) {
      return new NextResponse('Missing required fields', { status: 400 })
    }

    const book = await db.book.create({
      data: {
        isbn,
        title,
        author,
        publisher,
        publicationYear: publicationYear ? parseInt(publicationYear) : null,
        category,
        language,
        pageCount: pageCount ? parseInt(pageCount) : null,
        totalCopies: parseInt(totalCopies),
        availableCopies: parseInt(totalCopies),
        location,
        description,
      },
    })

    return NextResponse.json(book)
  } catch (error) {
    console.error('[BOOKS_POST]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}

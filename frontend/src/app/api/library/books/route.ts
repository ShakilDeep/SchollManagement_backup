import { NextResponse } from 'next/server'
import { fetchAPI } from '@/lib/api/client'

export async function GET() {
  try {
    const response = await fetchAPI<{ results: any[] }>('/library/books/')
    const books = (response.results || []).map((b: any) => ({
      id: b.id,
      isbn: b.isbn,
      title: b.title || 'Unknown',
      author: b.author || 'Unknown',
      publisher: b.publisher,
      publicationYear: b.publication_year || b.publicationYear,
      category: b.category,
      language: b.language,
      pageCount: b.page_count || b.pageCount,
      totalCopies: b.total_copies || b.totalCopies || 0,
      availableCopies: b.available_copies || b.availableCopies || 0,
      location: b.location,
      description: b.description,
      createdAt: b.created_at || b.createdAt
    }))

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

    const book = await fetchAPI('/library/books/', {
      method: 'POST',
      body: JSON.stringify({
        isbn,
        title,
        author,
        publisher,
        publication_year: publicationYear ? parseInt(publicationYear) : null,
        category,
        language,
        page_count: pageCount ? parseInt(pageCount) : null,
        total_copies: parseInt(totalCopies),
        available_copies: parseInt(totalCopies),
        location,
        description,
      })
    })

    return NextResponse.json(book)
  } catch (error) {
    console.error('[BOOKS_POST]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}

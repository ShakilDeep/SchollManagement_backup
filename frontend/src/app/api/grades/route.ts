import { NextResponse } from 'next/server'

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'

export async function GET() {
  try {
    const url = new URL('/api/grades/', BACKEND_URL)
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    const data = await response.json()
    if (!response.ok) {
      return NextResponse.json(data, { status: response.status })
    }
    // Extract results from paginated response
    const grades = data.results || data
    return NextResponse.json(grades)
  } catch (error) {
    console.error('[GRADES_GET]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}

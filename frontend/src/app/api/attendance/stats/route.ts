import { NextResponse } from 'next/server'

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'

export const dynamic = 'force-dynamic'
export const revalidate = 60

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const dateStr = searchParams.get('date')

  if (!dateStr) return new NextResponse('Date required', { status: 400 })

  try {
    let formattedDate = dateStr
    try {
      const date = new Date(dateStr)
      if (!isNaN(date.getTime())) {
        formattedDate = date.toISOString().split('T')[0]
      }
    } catch (e) {
    }

    const url = new URL('/api/attendance/stats/', BACKEND_URL)
    url.searchParams.set('date', formattedDate)
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
    return NextResponse.json(data)
  } catch (error) {
    console.error('[ATTENDANCE_STATS_GET]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}

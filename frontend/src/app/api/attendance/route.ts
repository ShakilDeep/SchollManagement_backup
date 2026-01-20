import { NextResponse } from 'next/server'

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'

export const dynamic = 'force-dynamic'
export const revalidate = 60

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const dateStr = searchParams.get('date')
    const gradeId = searchParams.get('gradeId')
    const sectionId = searchParams.get('sectionId')
    const search = searchParams.get('search')

    if (!dateStr) {
      return new NextResponse('Date required', { status: 400 })
    }
    
    const date = new Date(dateStr)
    const formattedDate = date.toISOString().split('T')[0]

    const queryParams = new URLSearchParams()
    queryParams.append('date', formattedDate)
    
    if (gradeId && gradeId !== 'all') {
      queryParams.append('grade_id', gradeId)
    }
    
    if (sectionId && sectionId !== 'all') {
      queryParams.append('section_id', sectionId)
    }
    
    if (search) {
      queryParams.append('search', search)
    }

    const response = await fetch(
      `${BACKEND_URL}/api/attendance/by_date/?${queryParams.toString()}`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store'
      }
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: response.statusText }))
      return NextResponse.json(errorData, { status: response.status })
    }

    const data = await response.json()
    
    const transformedData = data.results || data
    
    return NextResponse.json(transformedData)
  } catch (error) {
    console.error('[ATTENDANCE_GET]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { date, attendanceData } = body
    
    if (!date || !attendanceData) {
      return new NextResponse('Missing data', { status: 400 })
    }

    const formattedDate = new Date(date).toISOString().split('T')[0]

    const response = await fetch(
      `${BACKEND_URL}/api/attendance/bulk_create/`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: formattedDate,
          attendance_data: attendanceData
        })
      }
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: response.statusText }))
      return NextResponse.json(errorData, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)

  } catch (error) {
    console.error('[ATTENDANCE_POST]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}

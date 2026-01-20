import { NextResponse } from 'next/server'
import { fetchAPI } from '@/lib/api/client'

export async function GET() {
  try {
    const response = await fetchAPI<{ results: any[] }>('/academic-years/')
    const academicYears = response.results || []

    const transformedYears = academicYears.map((year: any) => ({
      id: year.id,
      name: year.name,
      startDate: year.start_date || year.startDate,
      endDate: year.end_date || year.endDate,
      isCurrent: year.is_current || year.isCurrent || false,
    }))

    return NextResponse.json(transformedYears)
  } catch (error) {
    console.error('Error fetching academic years:', error)
    return NextResponse.json({ error: 'Failed to fetch academic years' }, { status: 500 })
  }
}

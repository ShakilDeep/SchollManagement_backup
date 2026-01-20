import { NextRequest, NextResponse } from 'next/server'
import { fetchAPI } from '@/lib/api/client'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const subjectId = searchParams.get('subjectId')
    const gradeId = searchParams.get('gradeId')
    const academicYearId = searchParams.get('academicYearId')

    // Build query parameters for backend API
    const queryParams: Record<string, string> = {}
    if (subjectId) queryParams.subject = subjectId
    if (gradeId) queryParams.grade = gradeId
    if (academicYearId) queryParams.academic_year = academicYearId

    const response = await fetchAPI<{ results: any[] }>('/curriculum/', { query: queryParams })
    const curriculums = response.results || []

    const transformedCurriculums = curriculums.map((c: any) => ({
      id: c.id,
      name: c.name || 'Unknown',
      description: c.description,
      objectives: c.objectives || [],
      topics: c.topics || [],
      subject: c.subject_details || c.subject,
      grade: c.grade_details || c.grade,
      academicYear: c.academic_year_details || c.academicYear,
      lessons: c.lessons || [],
    }))

    return NextResponse.json(transformedCurriculums)
  } catch (error) {
    console.error('Error fetching curriculums:', error)
    return NextResponse.json({ error: 'Failed to fetch curriculums' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const curriculum = await fetchAPI('/curriculum/', {
      method: 'POST',
      body: JSON.stringify({
        name: body.name,
        subject: body.subjectId,
        grade: body.gradeId,
        academic_year: body.academicYearId,
        description: body.description,
        objectives: body.objectives,
        topics: body.topics
      })
    })

    return NextResponse.json(curriculum, { status: 201 })
  } catch (error) {
    console.error('Error creating curriculum:', error)
    return NextResponse.json({ error: 'Failed to create curriculum' }, { status: 500 })
  }
}

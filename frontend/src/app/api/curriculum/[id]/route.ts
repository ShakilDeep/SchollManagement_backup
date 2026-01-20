import { NextRequest, NextResponse } from 'next/server'
import { fetchAPI } from '@/lib/api/client'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const curriculum = await fetchAPI<any>(`/curriculum/${params.id}/`)

    const transformedCurriculum = {
      id: curriculum.id,
      name: curriculum.name || 'Unknown',
      description: curriculum.description,
      objectives: curriculum.objectives || [],
      topics: curriculum.topics || [],
      createdAt: curriculum.created_at || curriculum.createdAt,
      updatedAt: curriculum.updated_at || curriculum.updatedAt,
      subject: curriculum.subject_details || curriculum.subject,
      grade: curriculum.grade_details || curriculum.grade,
      academicYear: curriculum.academic_year_details || curriculum.academicYear,
      lessons: curriculum.lessons || [],
    }

    return NextResponse.json(transformedCurriculum)
  } catch (error) {
    console.error('Error fetching curriculum:', error)
    return NextResponse.json({ error: 'Failed to fetch curriculum' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()

    const curriculum = await fetchAPI(`/curriculum/${params.id}/`, {
      method: 'PATCH',
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

    const transformedCurriculum = {
      id: curriculum.id,
      name: curriculum.name || 'Unknown',
      description: curriculum.description,
      objectives: curriculum.objectives || [],
      topics: curriculum.topics || [],
      createdAt: curriculum.created_at || curriculum.createdAt,
      updatedAt: curriculum.updated_at || curriculum.updatedAt,
      subject: curriculum.subject_details || curriculum.subject,
      grade: curriculum.grade_details || curriculum.grade,
      academicYear: curriculum.academic_year_details || curriculum.academicYear,
    }

    return NextResponse.json(transformedCurriculum)
  } catch (error) {
    console.error('Error updating curriculum:', error)
    return NextResponse.json({ error: 'Failed to update curriculum' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await fetchAPI(`/curriculum/${params.id}/`, {
      method: 'DELETE'
    })

    return NextResponse.json({ message: 'Curriculum deleted successfully' })
  } catch (error) {
    console.error('Error deleting curriculum:', error)
    return NextResponse.json({ error: 'Failed to delete curriculum' }, { status: 500 })
  }
}

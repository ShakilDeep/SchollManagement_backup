import { NextRequest, NextResponse } from 'next/server'
import { fetchAPI } from '@/lib/api/client'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const curriculumId = searchParams.get('curriculumId')
    const subjectId = searchParams.get('subjectId')
    const gradeId = searchParams.get('gradeId')
    const teacherId = searchParams.get('teacherId')
    const status = searchParams.get('status')

    // Build query parameters for backend API
    const queryParams: Record<string, string> = {}
    if (curriculumId) queryParams.curriculum = curriculumId
    if (subjectId) queryParams.subject = subjectId
    if (gradeId) queryParams.grade = gradeId
    if (teacherId) queryParams.teacher = teacherId
    if (status) queryParams.status = status

    const response = await fetchAPI<{ results: any[] }>('/curriculum/lessons/', { query: queryParams })
    const lessons = response.results || []

    const transformedLessons = lessons.map((lesson: any) => ({
      id: lesson.id,
      curriculumId: lesson.curriculum || lesson.curriculumId,
      subjectId: lesson.subject || lesson.subjectId,
      gradeId: lesson.grade || lesson.gradeId,
      sectionId: lesson.section || lesson.sectionId,
      teacherId: lesson.teacher || lesson.teacherId,
      title: lesson.title || 'Untitled',
      content: lesson.content,
      resources: lesson.resources || [],
      date: lesson.date || lesson.lesson_date,
      duration: lesson.duration,
      status: lesson.status || 'Planned',
      curriculum: lesson.curriculum_details || lesson.curriculum,
      subject: lesson.subject_details || lesson.subject,
      grade: lesson.grade_details || lesson.grade,
      teacher: lesson.teacher_details || lesson.teacher,
    }))

    return NextResponse.json(transformedLessons)
  } catch (error) {
    console.error('Error fetching lessons:', error)
    return NextResponse.json({ error: 'Failed to fetch lessons' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const lesson = await fetchAPI('/curriculum/lessons/', {
      method: 'POST',
      body: JSON.stringify({
        curriculum: body.curriculumId,
        subject: body.subjectId,
        grade: body.gradeId,
        section: body.sectionId,
        teacher: body.teacherId,
        title: body.title,
        content: body.content,
        resources: body.resources,
        lesson_date: body.date,
        duration: body.duration,
        status: body.status || 'Planned'
      })
    })

    return NextResponse.json(lesson, { status: 201 })
  } catch (error) {
    console.error('Error creating lesson:', error)
    return NextResponse.json({ error: 'Failed to create lesson' }, { status: 500 })
  }
}

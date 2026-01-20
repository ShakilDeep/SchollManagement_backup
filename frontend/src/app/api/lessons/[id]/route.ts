import { NextRequest, NextResponse } from 'next/server'
import { fetchAPI } from '@/lib/api/client'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const lesson = await fetchAPI<any>(`/curriculum/lessons/${params.id}/`)

    const transformedLesson = {
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
      section: lesson.section_details || lesson.section,
      teacher: lesson.teacher_details || lesson.teacher,
    }

    return NextResponse.json(transformedLesson)
  } catch (error) {
    console.error('Error fetching lesson:', error)
    return NextResponse.json({ error: 'Failed to fetch lesson' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()

    const lesson = await fetchAPI(`/curriculum/lessons/${params.id}/`, {
      method: 'PATCH',
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
        status: body.status
      })
    })

    const transformedLesson = {
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
      teacher: lesson.teacher_details || lesson.teacher,
    }

    return NextResponse.json(transformedLesson)
  } catch (error) {
    console.error('Error updating lesson:', error)
    return NextResponse.json({ error: 'Failed to update lesson' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await fetchAPI(`/curriculum/lessons/${params.id}/`, {
      method: 'DELETE'
    })

    return NextResponse.json({ message: 'Lesson deleted successfully' })
  } catch (error) {
    console.error('Error deleting lesson:', error)
    return NextResponse.json({ error: 'Failed to delete lesson' }, { status: 500 })
  }
}

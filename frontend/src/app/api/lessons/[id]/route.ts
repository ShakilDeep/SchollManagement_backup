import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const lesson = await prisma.lesson.findUnique({
      where: { id: params.id },
      include: {
        curriculum: true,
        subject: true,
        grade: true,
        section: true,
        teacher: {
          include: {
            user: true
          }
        }
      }
    })

    if (!lesson) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
    }

    return NextResponse.json(lesson)
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

    const lesson = await prisma.lesson.update({
      where: { id: params.id },
      data: {
        curriculumId: body.curriculumId,
        subjectId: body.subjectId,
        gradeId: body.gradeId,
        sectionId: body.sectionId,
        teacherId: body.teacherId,
        title: body.title,
        content: body.content,
        resources: body.resources,
        date: body.date ? new Date(body.date) : undefined,
        duration: body.duration,
        status: body.status
      },
      include: {
        curriculum: true,
        subject: true,
        teacher: {
          include: {
            user: true
          }
        }
      }
    })

    return NextResponse.json(lesson)
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
    await prisma.lesson.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Lesson deleted successfully' })
  } catch (error) {
    console.error('Error deleting lesson:', error)
    return NextResponse.json({ error: 'Failed to delete lesson' }, { status: 500 })
  }
}

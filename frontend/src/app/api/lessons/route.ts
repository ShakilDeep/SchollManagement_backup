import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const curriculumId = searchParams.get('curriculumId')
    const subjectId = searchParams.get('subjectId')
    const gradeId = searchParams.get('gradeId')
    const teacherId = searchParams.get('teacherId')
    const status = searchParams.get('status')

    const where: any = {}
    if (curriculumId) where.curriculumId = curriculumId
    if (subjectId) where.subjectId = subjectId
    if (gradeId) where.gradeId = gradeId
    if (teacherId) where.teacherId = teacherId
    if (status) where.status = status

    const lessons = await prisma.lesson.findMany({
      where,
      include: {
        curriculum: true,
        subject: true,
        grade: true,
        teacher: {
          include: {
            user: true
          }
        }
      },
      orderBy: {
        date: 'asc'
      }
    })

    return NextResponse.json(lessons)
  } catch (error) {
    console.error('Error fetching lessons:', error)
    return NextResponse.json({ error: 'Failed to fetch lessons' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const lesson = await prisma.lesson.create({
      data: {
        curriculumId: body.curriculumId,
        subjectId: body.subjectId,
        gradeId: body.gradeId,
        sectionId: body.sectionId,
        teacherId: body.teacherId,
        title: body.title,
        content: body.content,
        resources: body.resources,
        date: new Date(body.date),
        duration: body.duration,
        status: body.status || 'Planned'
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

    return NextResponse.json(lesson, { status: 201 })
  } catch (error) {
    console.error('Error creating lesson:', error)
    return NextResponse.json({ error: 'Failed to create lesson' }, { status: 500 })
  }
}

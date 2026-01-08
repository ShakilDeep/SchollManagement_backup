import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const subjectId = searchParams.get('subjectId')
    const gradeId = searchParams.get('gradeId')
    const academicYearId = searchParams.get('academicYearId')

    const where: any = {}
    if (subjectId) where.subjectId = subjectId
    if (gradeId) where.gradeId = gradeId
    if (academicYearId) where.academicYearId = academicYearId

    const curriculums = await prisma.curriculum.findMany({
      where,
      include: {
        subject: true,
        grade: true,
        academicYear: true,
        lessons: {
          include: {
            teacher: {
              include: {
                user: true
              }
            },
            subject: true
          },
          orderBy: {
            date: 'asc'
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json(curriculums)
  } catch (error) {
    console.error('Error fetching curriculums:', error)
    return NextResponse.json({ error: 'Failed to fetch curriculums' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const curriculum = await prisma.curriculum.create({
      data: {
        name: body.name,
        subjectId: body.subjectId,
        gradeId: body.gradeId,
        academicYearId: body.academicYearId,
        description: body.description,
        objectives: body.objectives,
        topics: body.topics
      },
      include: {
        subject: true,
        grade: true,
        academicYear: true
      }
    })

    return NextResponse.json(curriculum, { status: 201 })
  } catch (error) {
    console.error('Error creating curriculum:', error)
    return NextResponse.json({ error: 'Failed to create curriculum' }, { status: 500 })
  }
}

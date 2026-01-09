import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

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

    const curriculums = await db.curriculum.findMany({
      where,
      select: {
        id: true,
        name: true,
        description: true,
        objectives: true,
        topics: true,
        subject: {
          select: {
            id: true,
            name: true,
            code: true,
            color: true
          }
        },
        grade: {
          select: {
            id: true,
            name: true
          }
        },
        academicYear: {
          select: {
            id: true,
            name: true
          }
        },
        lessons: {
          select: {
            id: true,
            title: true,
            content: true,
            date: true,
            duration: true,
            status: true,
            teacher: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                user: {
                  select: {
                    name: true,
                    email: true
                  }
                }
              }
            },
            subject: {
              select: {
                id: true,
                name: true,
                code: true,
                color: true
              }
            }
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

    const curriculum = await db.curriculum.create({
      data: {
        name: body.name,
        subjectId: body.subjectId,
        gradeId: body.gradeId,
        academicYearId: body.academicYearId,
        description: body.description,
        objectives: body.objectives,
        topics: body.topics
      },
      select: {
        id: true,
        name: true,
        description: true,
        objectives: true,
        topics: true,
        subject: {
          select: {
            id: true,
            name: true,
            code: true,
            color: true
          }
        },
        grade: {
          select: {
            id: true,
            name: true
          }
        },
        academicYear: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    return NextResponse.json(curriculum, { status: 201 })
  } catch (error) {
    console.error('Error creating curriculum:', error)
    return NextResponse.json({ error: 'Failed to create curriculum' }, { status: 500 })
  }
}

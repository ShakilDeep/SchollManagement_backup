import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const curriculum = await db.curriculum.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        name: true,
        description: true,
        objectives: true,
        topics: true,
        createdAt: true,
        updatedAt: true,
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
      }
    })

    if (!curriculum) {
      return NextResponse.json({ error: 'Curriculum not found' }, { status: 404 })
    }

    return NextResponse.json(curriculum)
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

    const curriculum = await db.curriculum.update({
      where: { id: params.id },
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
        createdAt: true,
        updatedAt: true,
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

    return NextResponse.json(curriculum)
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
    await db.curriculum.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Curriculum deleted successfully' })
  } catch (error) {
    console.error('Error deleting curriculum:', error)
    return NextResponse.json({ error: 'Failed to delete curriculum' }, { status: 500 })
  }
}

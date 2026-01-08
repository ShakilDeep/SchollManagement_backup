import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const curriculum = await prisma.curriculum.findUnique({
      where: { id: params.id },
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

    const curriculum = await prisma.curriculum.update({
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
      include: {
        subject: true,
        grade: true,
        academicYear: true
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
    await prisma.curriculum.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Curriculum deleted successfully' })
  } catch (error) {
    console.error('Error deleting curriculum:', error)
    return NextResponse.json({ error: 'Failed to delete curriculum' }, { status: 500 })
  }
}

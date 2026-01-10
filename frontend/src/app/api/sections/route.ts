import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sectionFormSchema } from '@/lib/validations'
import { success, error, handleApiError, created } from '@/lib/api/base/api-handler'

export async function GET(request: NextRequest) {
  try {
    // Fetch all grades with their sections
    const grades = await db.grade.findMany({
      include: {
        sections: {
          select: {
            id: true,
            name: true,
            roomNumber: true,
            capacity: true,
            currentStrength: true
          }
        },
        _count: {
          select: {
            sections: true
          }
        }
      },
      orderBy: {
        numericValue: 'asc'
      }
    })

    // Fetch current academic year
    const currentAcademicYear = await db.academicYear.findFirst({
      where: {
        isCurrent: true
      },
      select: {
        id: true,
        name: true,
        startDate: true,
        endDate: true
      }
    })

    // Transform data for frontend consumption
    const transformedGrades = grades.map(grade => ({
      id: grade.id,
      name: grade.name,
      numericValue: grade.numericValue,
      description: grade.description,
      sections: grade.sections.map(section => ({
        id: section.id,
        name: section.name,
        displayName: `${grade.name} - Section ${section.name}`,
        roomNumber: section.roomNumber,
        capacity: section.capacity,
        currentStrength: section.currentStrength
      }))
    }))

    return NextResponse.json({
      grades: transformedGrades,
      currentAcademicYear,
      defaultSelection: {
        grade: grades.find(g => g.name === 'Grade 10')?.id || grades[0]?.id,
        section: grades.find(g => g.name === 'Grade 10')?.sections.find(s => s.name === 'A')?.id || 
                 grades[0]?.sections[0]?.id
      }
    })
  } catch (error) {
    console.error('Error fetching grades and sections:', error)
    return NextResponse.json(
      { error: 'Failed to fetch grades and sections' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  return handleApiError(async () => {
    const body = await request.json()
    const validatedData = await sectionFormSchema.parseAsync(body)

    const section = await db.section.create({
      data: {
        name: validatedData.name,
        grade: { connect: { id: validatedData.grade } }
      },
      include: {
        grade: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    return created({
      id: section.id,
      name: section.name,
      grade: section.grade,
      roomNumber: section.roomNumber,
      capacity: section.capacity,
      currentStrength: section.currentStrength
    })
  }, 'POST /sections')
}
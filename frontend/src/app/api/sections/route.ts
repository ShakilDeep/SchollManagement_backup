import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'

export async function GET(request: NextRequest) {
  try {
    const gradesUrl = new URL('/api/grades/', BACKEND_URL)
    const gradesResponse = await fetch(gradesUrl.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    const gradesData = await gradesResponse.json()
    if (!gradesResponse.ok) {
      return NextResponse.json(gradesData, { status: gradesResponse.status })
    }

    const sectionsUrl = new URL('/api/sections/', BACKEND_URL)
    const sectionsResponse = await fetch(sectionsUrl.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    const sectionsData = await sectionsResponse.json()
    if (!sectionsResponse.ok) {
      return NextResponse.json(sectionsData, { status: sectionsResponse.status })
    }

    const transformedGrades = gradesData.results?.map((grade: any) => ({
      id: grade.id,
      name: grade.name,
      numericValue: grade.numeric_value,
      description: grade.description,
      sections: (sectionsData.results || [])
        .filter((section: any) => section.grade === grade.id)
        .map((section: any) => ({
          id: section.id,
          name: section.name,
          displayName: `${grade.name} - Section ${section.name}`,
          roomNumber: section.room_number,
          capacity: section.capacity,
          currentStrength: section.current_strength
        }))
    })) || []

    return NextResponse.json({
      grades: transformedGrades,
      currentAcademicYear: null,
      defaultSelection: {
        grade: transformedGrades.find((g: any) => g.name === 'Grade 10')?.id || transformedGrades[0]?.id,
        section: transformedGrades.find((g: any) => g.name === 'Grade 10')?.sections.find((s: any) => s.name === 'A')?.id ||
                 transformedGrades[0]?.sections[0]?.id
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
  try {
    const body = await request.json()
    const url = new URL('/api/sections/', BACKEND_URL)
    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
    const data = await response.json()
    if (!response.ok) {
      return NextResponse.json(data, { status: response.status })
    }
    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Error creating section:', error)
    return NextResponse.json(
      { error: 'Failed to create section' },
      { status: 500 }
    )
  }
}
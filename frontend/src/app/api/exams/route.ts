import { NextRequest, NextResponse } from 'next/server'
import { fetchAPI } from '@/lib/api/client'

export const revalidate = 60

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const gradeId = searchParams.get('gradeId')
    const status = searchParams.get('status')

    // Fetch current academic year from backend
    let currentYearName = '2024-2025' // default
    try {
      const yearResponse = await fetchAPI<{ results: any[] }>('/academic-years/')
      const currentYear = (yearResponse.results || []).find((y: any) => y.is_current)
      if (currentYear) {
        currentYearName = currentYear.name
      }
    } catch {
      console.warn('Could not fetch academic year from backend')
    }

    // Build query parameters for backend API
    const queryParams: Record<string, string> = {}
    if (type) queryParams.type = type
    if (status) queryParams.status = status

    const response = await fetchAPI<{ results: any[] }>('/exams/', { query: queryParams })
    const exams = response.results || []

    // Transform data to match frontend expectations
    const transformedExams = exams.map((exam: any) => ({
      id: exam.id,
      name: exam.name,
      type: exam.type,
      startDate: exam.start_date || exam.startDate,
      endDate: exam.end_date || exam.endDate,
      status: exam.status,
      academicYear: exam.academic_year_name || exam.academicYearName || currentYearName,
      papers: exam.papers || exam.exam_papers || []
    }))

    return NextResponse.json({
      exams: transformedExams,
      academicYear: currentYearName
    })

  } catch (error) {
    console.error('Error fetching exams from backend API:', error)
    return NextResponse.json(
      { error: 'Failed to fetch exams' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, type, startDate, endDate, papers } = body

    // Validate required fields
    if (!name || !type || !startDate || !endDate) {
      return NextResponse.json({
        error: 'Missing required fields',
        details: { name: !!name, type: !!type, startDate: !!startDate, endDate: !!endDate }
      }, { status: 400 })
    }

    // Validate date format
    const start = new Date(startDate)
    const end = new Date(endDate)

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json({
        error: 'Invalid date format',
        details: { startDate, endDate, startValid: !isNaN(start.getTime()), endValid: !isNaN(end.getTime()) }
      }, { status: 400 })
    }

    // Create exam via backend API
    const exam = await fetchAPI('/exams/', {
      method: 'POST',
      body: JSON.stringify({
        name,
        type,
        start_date: startDate,
        end_date: endDate,
        status: 'Upcoming'
      })
    })

    // Create exam papers if provided
    if (papers && papers.length > 0) {
      const examPapers = await Promise.all(
        papers.map((paper: any) =>
          fetchAPI('/exams/papers/', {
            method: 'POST',
            body: JSON.stringify({
              exam: exam.id,
              subject: paper.subjectId,
              grade: paper.gradeId,
              total_marks: paper.totalMarks || 100,
              passing_marks: paper.passingMarks || 40,
              duration: paper.duration || 120,
              exam_date: paper.examDate,
              start_time: paper.startTime,
              end_time: paper.endTime
            })
          })
        )
      )

      return NextResponse.json({
        exam: {
          ...exam,
          papers: examPapers
        }
      })
    }

    return NextResponse.json({ exam })

  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to create exam'
      },
      { status: 500 }
    )
  }
}

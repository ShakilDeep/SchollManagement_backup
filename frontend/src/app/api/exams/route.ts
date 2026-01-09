import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const gradeId = searchParams.get('gradeId')
    const status = searchParams.get('status')

    // Get current academic year
    const currentYear = await db.academicYear.findFirst({
      where: { isCurrent: true }
    })

    if (!currentYear) {
      return NextResponse.json({ error: 'No current academic year found' }, { status: 404 })
    }

    // Build filter conditions
    const whereConditions: any = {
      academicYearId: currentYear.id
    }

    if (type) {
      whereConditions.type = type
    }

    if (status) {
      whereConditions.status = status
    }

    // Fetch exams with their papers
    const exams = await db.exam.findMany({
      where: whereConditions,
      include: {
        papers: {
          include: {
            subject: {
              select: {
                id: true,
                name: true,
                code: true
              }
            },
            
            _count: {
              select: {
                results: true
              }
            }
          },
          where: gradeId ? { gradeId: gradeId } : undefined
        }
      },
      orderBy: {
        startDate: 'asc'
      }
    })

    // Transform data to match frontend expectations
    const transformedExams = exams.map(exam => ({
      id: exam.id,
      name: exam.name,
      type: exam.type,
      startDate: exam.startDate.toISOString().split('T')[0],
      endDate: exam.endDate.toISOString().split('T')[0],
      status: exam.status,
      papers: exam.papers?.map(paper => ({
        id: paper.id,
        subject: paper.subject.name,
        subjectCode: paper.subject.code,
        grade: 'All Grades',
        gradeId: paper.gradeId,
        totalMarks: paper.totalMarks,
        passingMarks: paper.passingMarks,
        duration: paper.duration,
        examDate: paper.examDate.toISOString().split('T')[0],
        startTime: paper.startTime?.toISOString().split('T')[1].substring(0, 5),
        endTime: paper.endTime?.toISOString().split('T')[1].substring(0, 5),
        totalStudents: paper._count.results
      }))
    }))

    return NextResponse.json({
      exams: transformedExams,
      academicYear: currentYear.name
    })

  } catch (error) {
    console.error('Error fetching exams:', error)
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

    // Get current academic year
    const currentYear = await db.academicYear.findFirst({
      where: { isCurrent: true }
    })

    if (!currentYear) {
      return NextResponse.json({ error: 'No current academic year found' }, { status: 404 })
    }

    console.log('Creating exam with dates:', { startDate, endDate, start, end })

    // Create exam
    const exam = await db.exam.create({
      data: {
        name,
        type,
        academicYearId: currentYear.id,
        startDate: start,
        endDate: end,
        status: 'Upcoming'
      }
    })

    // Create exam papers if provided
    if (papers && papers.length > 0) {
      const examPapers = await Promise.all(
        papers.map((paper: any) =>
          db.examPaper.create({
            data: {
              examId: exam.id,
              subjectId: paper.subjectId,
              gradeId: paper.gradeId,
              totalMarks: paper.totalMarks || 100,
              passingMarks: paper.passingMarks || 40,
              duration: paper.duration || 120,
              examDate: new Date(paper.examDate),
              startTime: paper.startTime ? new Date(paper.startTime) : null,
              endTime: paper.endTime ? new Date(paper.endTime) : null
            }
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
    console.error('Error creating exam:', error)
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      meta: error.meta
    })
    return NextResponse.json(
      { 
        error: 'Failed to create exam',
        details: error.message,
        meta: error.meta
      },
      { status: 500 }
    )
  }
}
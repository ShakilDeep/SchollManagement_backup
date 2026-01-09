import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const examPaperId = searchParams.get('examPaperId')
    const examId = searchParams.get('examId')
    const studentId = searchParams.get('studentId')
    const gradeId = searchParams.get('gradeId')
    const subjectId = searchParams.get('subjectId')

    // Build where conditions
    const whereConditions: any = {}

    if (examPaperId) {
      whereConditions.examPaperId = examPaperId
    } else if (examId) {
      whereConditions.examPaper = {
        examId: examId
      }
    }

    if (studentId) {
      whereConditions.studentId = studentId
    }

    if (gradeId) {
      whereConditions.student = {
        gradeId: gradeId
      }
    }

    if (subjectId) {
      whereConditions.examPaper = {
        ...whereConditions.examPaper,
        subjectId: subjectId
      }
    }

    // Fetch exam results
    const results = await db.examResult.findMany({
      where: whereConditions,
      include: {
        student: {
          include: {
            grade: {
              select: {
                id: true,
                name: true
              }
            },
            section: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        examPaper: {
          include: {
            subject: {
              select: {
                id: true,
                name: true,
                code: true
              }
            },
            exam: {
              select: {
                id: true,
                name: true,
                type: true,
                status: true
              }
            }
          }
        }
      },
      orderBy: {
        percentage: 'desc'
      }
    })

    // Transform data
    const transformedResults = results.map((result, index) => ({
      id: result.id,
      studentId: result.student.id,
      studentName: `${result.student.firstName} ${result.student.lastName}`,
      rollNumber: result.student.rollNumber,
      subject: result.examPaper.subject.name,
      subjectCode: result.examPaper.subject.code,
      examName: result.examPaper.exam.name,
      examType: result.examPaper.exam.type,
      examStatus: result.examPaper.exam.status,
      grade: result.student.grade.name,
        section: result.student.section.name,
        marksObtained: Math.round(result.marksObtained),
      totalMarks: result.examPaper.totalMarks,
      passingMarks: result.examPaper.passingMarks,
      percentage: Math.round(result.percentage * 100) / 100,
      rank: result.rank || index + 1,
      remarks: result.remarks,
      examDate: result.examPaper.examDate.toISOString().split('T')[0],
      examPaperId: result.examPaperId
    }))

    // Calculate statistics
    const stats = {
      average: transformedResults.length > 0 
        ? Math.round((transformedResults.reduce((sum, r) => sum + r.percentage, 0) / transformedResults.length) * 100) / 100
        : 0,
      highest: transformedResults.length > 0 
        ? Math.max(...transformedResults.map(r => r.percentage))
        : 0,
      lowest: transformedResults.length > 0 
        ? Math.min(...transformedResults.map(r => r.percentage))
        : 0,
      passed: transformedResults.filter(r => r.percentage >= r.passingMarks).length,
      failed: transformedResults.filter(r => r.percentage < r.passingMarks).length,
      total: transformedResults.length
    }

    return NextResponse.json({
      results: transformedResults,
      stats,
      examPaperId,
      examId
    })

  } catch (error) {
    console.error('Error fetching exam results:', error)
    return NextResponse.json(
      { error: 'Failed to fetch exam results' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { results, examPaperId } = body

    if (!examPaperId || !results || !Array.isArray(results)) {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      )
    }

    // Create exam results
    const createdResults = await Promise.all(
      results.map((result: any) =>
        db.examResult.create({
          data: {
            studentId: result.studentId,
            examPaperId,
            marksObtained: result.marksObtained,
            percentage: (result.marksObtained / result.totalMarks) * 100,
            grade: result.grade,
            remarks: result.remarks
          }
        })
      )
    )

    // Calculate and update ranks
    const allResults = await db.examResult.findMany({
      where: { examPaperId },
      orderBy: { percentage: 'desc' }
    })

    for (let i = 0; i < allResults.length; i++) {
      await db.examResult.update({
        where: { id: allResults[i].id },
        data: { rank: i + 1 }
      })
    }

    return NextResponse.json({
      message: 'Exam results created successfully',
      results: createdResults
    })

  } catch (error) {
    console.error('Error creating exam results:', error)
    return NextResponse.json(
      { error: 'Failed to create exam results' },
      { status: 500 }
    )
  }
}
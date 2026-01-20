import { NextRequest, NextResponse } from 'next/server'
import { fetchAPI } from '@/lib/api/client'

export const revalidate = 60

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const examPaperId = searchParams.get('examPaperId')
    const examId = searchParams.get('examId')
    const studentId = searchParams.get('studentId')
    const gradeId = searchParams.get('gradeId')
    const subjectId = searchParams.get('subjectId')

    // Build query parameters for backend API
    const queryParams: Record<string, string> = {}
    if (studentId) queryParams.student = studentId
    if (examId) queryParams.exam = examId

    const response = await fetchAPI<{ results: any[] }>(`/exam-results/`, { query: queryParams })
    const backendResults = response.results || []

    // Transform data
    const transformedResults = backendResults.map((result: any, index: number) => ({
      id: result.id,
      studentId: result.student || result.studentId,
      studentName: result.student_name || result.studentName || 'Unknown',
      rollNumber: result.roll_number || result.rollNumber || '',
      subject: result.subject_name || result.subject || 'Unknown',
      subjectCode: result.subject_code || result.subjectCode || '',
      examName: result.exam_name || result.examName || 'Unknown',
      examType: result.exam_type || result.examType || 'Unknown',
      examStatus: result.exam_status || result.examStatus || 'Unknown',
      grade: result.grade_name || result.grade || 'Unknown',
      section: result.section_name || result.section || 'Unknown',
      marksObtained: Math.round(result.marks_obtained || result.marksObtained || 0),
      totalMarks: result.total_marks || result.totalMarks || 100,
      passingMarks: result.passing_marks || result.passingMarks || 40,
      percentage: Math.round((result.percentage || 0) * 100) / 100,
      rank: result.rank || index + 1,
      remarks: result.remarks || '',
      examDate: result.exam_date || result.examDate || new Date().toISOString().split('T')[0],
      examPaperId: result.exam_paper || result.examPaperId || ''
    }))

    // Filter by examPaperId, gradeId, or subjectId if provided (frontend-side filtering)
    let filteredResults = transformedResults
    if (examPaperId) {
      filteredResults = filteredResults.filter(r => r.examPaperId === examPaperId)
    }
    if (gradeId) {
      filteredResults = filteredResults.filter(r => r.grade === gradeId)
    }
    if (subjectId) {
      filteredResults = filteredResults.filter(r => r.subject === subjectId)
    }

    // Calculate statistics
    const stats = {
      average: filteredResults.length > 0
        ? Math.round((filteredResults.reduce((sum, r) => sum + r.percentage, 0) / filteredResults.length) * 100) / 100
        : 0,
      highest: filteredResults.length > 0
        ? Math.max(...filteredResults.map(r => r.percentage))
        : 0,
      lowest: filteredResults.length > 0
        ? Math.min(...filteredResults.map(r => r.percentage))
        : 0,
      passed: filteredResults.filter(r => r.percentage >= (filteredResults[0]?.passingMarks || 40)).length,
      failed: filteredResults.filter(r => r.percentage < (filteredResults[0]?.passingMarks || 40)).length,
      total: filteredResults.length
    }

    return NextResponse.json({
      results: filteredResults,
      stats,
      examPaperId,
      examId
    })

  } catch (error) {
    console.error('Error fetching exam results from backend API:', error)
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

    // Create exam results via backend API
    const createdResults = await Promise.all(
      results.map((result: any) =>
        fetchAPI('/exam-results/', {
          method: 'POST',
          body: JSON.stringify({
            student: result.studentId,
            exam_paper: examPaperId,
            marks_obtained: result.marksObtained,
            total_marks: result.totalMarks,
            percentage: (result.marksObtained / result.totalMarks) * 100,
            grade: result.grade,
            remarks: result.remarks
          })
        })
      )
    )

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

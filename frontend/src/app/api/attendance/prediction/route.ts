import { NextRequest, NextResponse } from 'next/server'
import { attendancePredictionService } from '@/lib/ai/services/attendance-prediction-service'
import { fetchAPI } from '@/lib/api/client'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const studentId = searchParams.get('studentId')
    const dateParam = searchParams.get('date')
    const gradeId = searchParams.get('gradeId')
    const sectionId = searchParams.get('sectionId')
    const type = searchParams.get('type')

    const targetDate = dateParam ? new Date(dateParam) : new Date()

    if (type === 'batch') {
      return await handleBatchPrediction(gradeId, sectionId, targetDate)
    }

    if (type === 'weekly') {
      return await handleWeeklyPrediction(studentId, targetDate)
    }

    if (!studentId) {
      return NextResponse.json(
        { error: 'studentId parameter is required' },
        { status: 400 }
      )
    }

    const prediction = await attendancePredictionService.predictAttendanceForDate(studentId, targetDate)

    if (!prediction) {
      return NextResponse.json(
        { error: 'Unable to generate prediction' },
        { status: 404 }
      )
    }

    return NextResponse.json(prediction)
  } catch (error) {
    console.error('Attendance prediction error:', error)
    return NextResponse.json(
      { error: 'Failed to generate prediction' },
      { status: 500 }
    )
  }
}

async function handleBatchPrediction(gradeId: string | null, sectionId: string | null, targetDate: Date) {
  // Build query parameters for backend API
  const queryParams: Record<string, string> = {}
  if (gradeId) queryParams.grade = gradeId
  if (sectionId) queryParams.section = sectionId
  queryParams.status = 'Active'

  // Fetch students from Django backend API
  const studentsResponse = await fetchAPI<{ results: any[] }>('/students/', { query: queryParams })
  const students = studentsResponse.results || []

  // Limit to 50 students for performance
  const limitedStudents = students.slice(0, 50)

  const studentIds = limitedStudents.map(s => s.id)
  const predictions = await attendancePredictionService.predictBatchAttendance(studentIds, targetDate)

  return NextResponse.json({
    predictions,
    summary: {
      total: predictions.length,
      highConfidence: predictions.filter(p => p.confidence >= 0.85).length,
      predictedPresent: predictions.filter(p => p.predictedStatus === 'Present').length,
      predictedAbsent: predictions.filter(p => p.predictedStatus === 'Absent').length,
      averageConfidence: predictions.length > 0
        ? predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length
        : 0
    }
  })
}

async function handleWeeklyPrediction(studentId: string | null, startDate: Date) {
  if (!studentId) {
    return NextResponse.json(
      { error: 'studentId parameter is required for weekly prediction' },
      { status: 400 }
    )
  }

  const prediction = await attendancePredictionService.predictWeeklyAttendance(studentId, startDate)

  if (!prediction) {
    return NextResponse.json(
      { error: 'Unable to generate weekly prediction' },
      { status: 404 }
    )
  }

  return NextResponse.json(prediction)
}

import { NextRequest, NextResponse } from 'next/server'
import { attendanceAlertsService } from '@/lib/ai/services/attendance-alerts'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const studentId = searchParams.get('studentId')
    const gradeId = searchParams.get('gradeId')
    const sectionId = searchParams.get('sectionId')
    const days = parseInt(searchParams.get('days') || '30')
    const forceRefresh = searchParams.get('refresh') === 'true'

    if (!studentId && !gradeId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Either studentId or gradeId is required'
        },
        { status: 400 }
      )
    }

    let attendanceRecords
    if (studentId) {
      attendanceRecords = await attendanceAlertsService.loadStudentAttendanceRecords(studentId, days)
    } else {
      attendanceRecords = await attendanceAlertsService.loadGradeAttendanceRecords(gradeId!, sectionId || undefined, days)
    }

    const alerts = await attendanceAlertsService.generateAttendanceAlerts(
      attendanceRecords,
      gradeId || undefined,
      sectionId || undefined
    )

    return NextResponse.json({
      success: true,
      data: {
        alerts,
        totalRecords: attendanceRecords.length
      }
    })
  } catch (error) {
    console.error('Attendance alerts error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate attendance alerts'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { studentId, gradeId, sectionId, days = 30, customRecords } = body

    if (customRecords && Array.isArray(customRecords)) {
      const alerts = await attendanceAlertsService.generateAttendanceAlerts(
        customRecords,
        gradeId || undefined,
        sectionId || undefined
      )

      return NextResponse.json({
        success: true,
        data: {
          alerts,
          totalRecords: customRecords.length
        }
      })
    }

    if (!studentId && !gradeId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Either studentId, gradeId, or customRecords is required'
        },
        { status: 400 }
      )
    }

    let attendanceRecords
    if (studentId) {
      attendanceRecords = await attendanceAlertsService.loadStudentAttendanceRecords(studentId, days)
    } else {
      attendanceRecords = await attendanceAlertsService.loadGradeAttendanceRecords(gradeId, sectionId, days)
    }

    const alerts = await attendanceAlertsService.generateAttendanceAlerts(
      attendanceRecords,
      gradeId || undefined,
      sectionId || undefined
    )

    return NextResponse.json({
      success: true,
      data: {
        alerts,
        totalRecords: attendanceRecords.length
      }
    })
  } catch (error) {
    console.error('Attendance alerts error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate attendance alerts'
      },
      { status: 500 }
    )
  }
}

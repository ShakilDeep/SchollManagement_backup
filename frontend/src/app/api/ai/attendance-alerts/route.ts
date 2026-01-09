import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { attendanceAlertsService } from '@/lib/ai/services/attendance-alerts'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const studentId = searchParams.get('studentId')
    const days = searchParams.get('days')

    if (!studentId) {
      return NextResponse.json(
        { error: 'Student ID is required' },
        { status: 400 }
      )
    }

    const daysToAnalyze = days ? parseInt(days) : 30
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - daysToAnalyze)

    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        studentId,
        date: {
          gte: startDate
        }
      },
      include: {
        student: {
          select: {
            firstName: true,
            lastName: true,
            grade: {
              select: {
                name: true
              }
            },
            section: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    })

    if (attendanceRecords.length === 0) {
      return NextResponse.json({
        totalDays: 0,
        totalAbsences: 0,
        totalPresent: 0,
        totalLate: 0,
        totalExcused: 0,
        attendanceRate: 100,
        patterns: [],
        riskLevel: 'low'
      })
    }

    const formattedRecords = attendanceRecords.map(record => ({
      id: record.id,
      date: record.date,
      status: record.status,
      studentId: record.studentId,
      studentName: `${record.student.firstName} ${record.student.lastName}`,
      grade: record.student.grade.name,
      section: record.student.section.name
    }))

    const pattern = await attendanceAlertsService.analyzeAbsencePattern(formattedRecords)

    return NextResponse.json(pattern)
  } catch (error) {
    console.error('Attendance alerts error:', error)
    return NextResponse.json(
      { error: 'Failed to analyze attendance patterns' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { grade, section, days = 30 } = body

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const whereClause: any = {
      date: {
        gte: startDate
      }
    }

    if (grade && grade !== 'all') {
      whereClause.student = {
        grade
      }
    }

    if (section && section !== 'all') {
      if (!whereClause.student) {
        whereClause.student = {}
      }
      whereClause.student.section = section
    }

    const attendanceRecords = await prisma.attendance.findMany({
      where: whereClause,
      include: {
        student: {
          select: {
            firstName: true,
            lastName: true,
            grade: {
              select: {
                name: true
              }
            },
            section: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    })

    if (attendanceRecords.length === 0) {
      return NextResponse.json({
        alerts: [],
        summary: {
          totalStudents: 0,
          highRiskStudents: 0,
          mediumRiskStudents: 0,
          lowRiskStudents: 0
        }
      })
    }

    const formattedRecords = attendanceRecords.map(record => ({
      id: record.id,
      date: record.date,
      status: record.status,
      studentId: record.studentId,
      studentName: `${record.student.firstName} ${record.student.lastName}`,
      grade: record.student.grade.name,
      section: record.student.section.name
    }))

    const alerts = await attendanceAlertsService.generateAttendanceAlerts(
      formattedRecords,
      grade && grade !== 'all' ? grade : undefined,
      section && section !== 'all' ? section : undefined
    )

    const highRiskStudents = alerts.filter(a => a.riskLevel === 'high').length
    const mediumRiskStudents = alerts.filter(a => a.riskLevel === 'medium').length
    const lowRiskStudents = alerts.filter(a => a.riskLevel === 'low').length

    const summary = {
      totalStudents: new Set(alerts.map(a => a.studentId)).size,
      highRiskStudents,
      mediumRiskStudents,
      lowRiskStudents
    }

    return NextResponse.json({
      alerts,
      summary
    })
  } catch (error) {
    console.error('Generate attendance alerts error:', error)
    return NextResponse.json(
      { error: 'Failed to generate attendance alerts' },
      { status: 500 }
    )
  }
}

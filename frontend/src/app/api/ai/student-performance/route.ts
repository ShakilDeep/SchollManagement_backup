import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { studentPerformanceService } from '@/lib/ai/services/student-performance'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { studentIds, grade, section, atRiskOnly = false } = body

    if (!studentIds && !grade) {
      return NextResponse.json(
        {
          success: false,
          error: 'Either studentIds or grade is required'
        },
        { status: 400 }
      )
    }

    let students

    if (studentIds) {
      students = await db.student.findMany({
        where: {
          id: { in: studentIds }
        },
        include: {
          examResults: {
            include: {
              examPaper: {
                include: {
                  subject: true
                }
              }
            }
          },
          attendances: {
            take: 100,
            orderBy: { date: 'desc' }
          }
        }
      })
    } else {
      students = await db.student.findMany({
        where: {
          grade: { name: grade },
          ...(section && { section: { name: section } })
        },
        include: {
          examResults: {
            include: {
              examPaper: {
                include: {
                  subject: true
                }
              }
            }
          },
          attendances: {
            take: 100,
            orderBy: { date: 'desc' }
          }
        }
      })
    }

    const studentData = students.map(student => {
      const totalAttendance = student.attendances.length
      const presentAttendance = student.attendances.filter(a => a.status === 'Present').length
      const attendanceRate = totalAttendance > 0 ? presentAttendance / totalAttendance : 0

      return {
        id: student.id,
        name: `${student.firstName} ${student.lastName}`,
        grade: student.grade.name,
        section: student.section?.name || '',
        attendanceRate,
        examResults: student.examResults.map(result => ({
          subject: result.examPaper.subject.name,
          marksObtained: result.marksObtained,
          totalMarks: result.totalMarks,
          percentage: result.percentage,
          date: result.examPaper.examDate.toISOString()
        }))
      }
    })

    let predictions

    if (atRiskOnly) {
      predictions = await studentPerformanceService.getAtRiskStudents(studentData)
    } else {
      predictions = await studentPerformanceService.predictMultipleStudents(studentData)
    }

    return NextResponse.json({
      success: true,
      data: predictions
    })
  } catch (error) {
    console.error('Student performance prediction error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to predict student performance'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const studentId = searchParams.get('studentId')

    if (!studentId) {
      return NextResponse.json(
        {
          success: false,
          error: 'studentId is required'
        },
        { status: 400 }
      )
    }

    const student = await db.student.findUnique({
      where: { id: studentId },
      include: {
        grade: true,
        section: true,
        examResults: {
          include: {
            examPaper: {
              include: {
                subject: true
              }
            }
          }
        },
        attendances: {
          take: 100,
          orderBy: { date: 'desc' }
        }
      }
    })

    if (!student) {
      return NextResponse.json(
        {
          success: false,
          error: 'Student not found'
        },
        { status: 404 }
      )
    }

    const totalAttendance = student.attendances.length
    const presentAttendance = student.attendances.filter(a => a.status === 'Present').length
    const attendanceRate = totalAttendance > 0 ? presentAttendance / totalAttendance : 0

    const studentData = {
      id: student.id,
      name: `${student.firstName} ${student.lastName}`,
      grade: student.grade.name,
      section: student.section?.name || '',
      attendanceRate,
      examResults: student.examResults.map(result => ({
        subject: result.examPaper.subject.name,
        marksObtained: result.marksObtained,
        totalMarks: result.totalMarks,
        percentage: result.percentage,
        date: result.examPaper.examDate.toISOString()
      }))
    }

    const prediction = await studentPerformanceService.predictStudentPerformance(studentData)

    return NextResponse.json({
      success: true,
      data: prediction
    })
  } catch (error) {
    console.error('Student performance prediction error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to predict student performance'
      },
      { status: 500 }
    )
  }
}

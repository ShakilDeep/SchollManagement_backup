import { NextRequest, NextResponse } from 'next/server'
import { smartChatbotService } from '@/lib/ai/services/smart-chatbot'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, message, userRole, studentId, streaming = false } = body

    if (!userId || !message || !userRole) {
      return NextResponse.json(
        {
          success: false,
          error: 'userId, message, and userRole are required'
        },
        { status: 400 }
      )
    }

    let currentUser
    let studentData
    let schoolInfo

    if (userRole === 'admin' || userRole === 'teacher') {
      currentUser = {
        id: userId,
        name: 'User',
        role: userRole as 'admin' | 'teacher' | 'parent' | 'student'
      }

      if (studentId) {
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
              },
              take: 5,
              orderBy: { createdAt: 'desc' }
            },
            attendances: {
              take: 30,
              orderBy: { date: 'desc' }
            }
          }
        })

        if (student) {
          const totalAttendance = student.attendances.length
          const presentAttendance = student.attendances.filter(a => a.status === 'Present').length
          const attendanceRate = totalAttendance > 0 ? presentAttendance / totalAttendance : 0

          const upcomingExams = await db.examPaper.findMany({
            where: {
              gradeId: student.gradeId,
              examDate: {
                gte: new Date()
              }
            },
            include: {
              subject: true,
              exam: true
            },
            take: 5,
            orderBy: { examDate: 'asc' }
          })

          studentData = {
            id: student.id,
            name: `${student.firstName} ${student.lastName}`,
            attendanceRate,
            recentExamResults: student.examResults.map(result => ({
              subject: result.examPaper.subject.name,
              marks: result.marksObtained,
              total: result.totalMarks,
              percentage: result.percentage
            })),
            upcomingExams: upcomingExams.map(exam => ({
              subject: exam.subject.name,
              date: exam.examDate.toISOString().split('T')[0]
            }))
          }
        }
      }
    } else if (userRole === 'parent') {
      currentUser = {
        id: userId,
        name: 'Parent',
        role: userRole as 'admin' | 'teacher' | 'parent' | 'student'
      }

      const student = await db.student.findFirst({
        where: {
          parentId: userId
        },
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
            },
            take: 5,
            orderBy: { createdAt: 'desc' }
          },
          attendances: {
            take: 30,
            orderBy: { date: 'desc' }
          }
        }
      })

      if (student) {
        const totalAttendance = student.attendances.length
        const presentAttendance = student.attendances.filter(a => a.status === 'Present').length
        const attendanceRate = totalAttendance > 0 ? presentAttendance / totalAttendance : 0

        const upcomingExams = await db.examPaper.findMany({
          where: {
            gradeId: student.gradeId,
            examDate: {
              gte: new Date()
            }
          },
          include: {
            subject: true,
            exam: true
          },
          take: 5,
          orderBy: { examDate: 'asc' }
        })

        studentData = {
          id: student.id,
          name: `${student.firstName} ${student.lastName}`,
          attendanceRate,
          recentExamResults: student.examResults.map(result => ({
            subject: result.examPaper.subject.name,
            marks: result.marksObtained,
            total: result.totalMarks,
            percentage: result.percentage
          })),
          upcomingExams: upcomingExams.map(exam => ({
            subject: exam.subject.name,
            date: exam.examDate.toISOString().split('T')[0]
          }))
        }
      }
    } else {
      currentUser = {
        id: userId,
        name: 'Student',
        role: userRole as 'admin' | 'teacher' | 'parent' | 'student'
      }

      const student = await db.student.findUnique({
        where: { id: userId },
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
            },
            take: 5,
            orderBy: { createdAt: 'desc' }
          },
          attendances: {
            take: 30,
            orderBy: { date: 'desc' }
          }
        }
      })

      if (student) {
        const totalAttendance = student.attendances.length
        const presentAttendance = student.attendances.filter(a => a.status === 'Present').length
        const attendanceRate = totalAttendance > 0 ? presentAttendance / totalAttendance : 0

        const upcomingExams = await db.examPaper.findMany({
          where: {
            gradeId: student.gradeId,
            examDate: {
              gte: new Date()
            }
          },
          include: {
            subject: true,
            exam: true
          },
          take: 5,
          orderBy: { examDate: 'asc' }
        })

        studentData = {
          id: student.id,
          name: `${student.firstName} ${student.lastName}`,
          attendanceRate,
          recentExamResults: student.examResults.map(result => ({
            subject: result.examPaper.subject.name,
            marks: result.marksObtained,
            total: result.totalMarks,
            percentage: result.percentage
          })),
          upcomingExams: upcomingExams.map(exam => ({
            subject: exam.subject.name,
            date: exam.examDate.toISOString().split('T')[0]
          }))
        }
      }
    }

    schoolInfo = {
      name: 'ABC International School',
      contact: {
        phone: '+1 (555) 123-4567',
        email: 'contact@abcschool.edu',
        address: '123 Education Lane, Learning City, LC 12345'
      },
      workingHours: 'Monday - Friday: 8:00 AM - 4:00 PM',
      upcomingEvents: [
        {
          name: 'Annual Science Fair',
          date: '2025-03-15',
          description: 'Students showcase their science projects and experiments'
        },
        {
          name: 'Parent-Teacher Conference',
          date: '2025-03-20',
          description: 'Meet with teachers to discuss student progress'
        }
      ]
    }

    const context = {
      currentUser,
      studentData,
      schoolInfo
    }

    if (streaming) {
      const encoder = new TextEncoder()
      const stream = new ReadableStream({
        async start(controller) {
          try {
            await smartChatbotService.processMessageWithStreaming(
              userId,
              message,
              context,
              (chunk) => {
                controller.enqueue(encoder.encode(chunk))
              }
            )
            controller.close()
          } catch (error) {
            controller.error(error)
          }
        }
      })

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/plain',
          'Transfer-Encoding': 'chunked'
        }
      })
    } else {
      const response = await smartChatbotService.processMessage(userId, message, context)

      return NextResponse.json({
        success: true,
        data: response
      })
    }
  } catch (error) {
    console.error('Chatbot error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process message'
      },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'userId is required'
        },
        { status: 400 }
      )
    }

    smartChatbotService.clearConversationHistory(userId)

    return NextResponse.json({
      success: true,
      message: 'Conversation history cleared'
    })
  } catch (error) {
    console.error('Chatbot clear history error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to clear conversation history'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'userId is required'
        },
        { status: 400 }
      )
    }

    const history = smartChatbotService.getConversationHistory(userId)

    return NextResponse.json({
      success: true,
      data: history
    })
  } catch (error) {
    console.error('Chatbot get history error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get conversation history'
      },
      { status: 500 }
    )
  }
}

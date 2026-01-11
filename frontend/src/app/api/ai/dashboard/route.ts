import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { dashboardPredictionService } from '@/lib/ai/services/dashboard-prediction'

export async function POST(request: NextRequest) {
  try {
    let body = {}
    try {
      body = await request.json()
    } catch {
      body = {}
    }
    const { forceRefresh = false } = body as { forceRefresh?: boolean }

    const currentAcademicYear = await db.academicYear.findFirst({
      where: { isCurrent: true }
    })

    const academicYearId = currentAcademicYear?.id

    const [
      totalStudents,
      totalTeachers,
      totalGrades,
      activeStudents,
      presentToday,
      recentEnrollments,
      upcomingExams,
      libraryBooks,
      transportVehicles,
      historicalEnrollments,
      historicalAttendance,
      historicalPerformance,
      libraryTransactions,
      examResultsForPerformance,
      teacherPerformance,
      courses,
      subjects,
      examResultsBySubject,
      attendanceRecordsByStudent,
      grades
    ] = await Promise.all([
      db.student.count(),
      db.teacher.count({ where: { status: 'Active' } }),
      db.grade.count(),
      academicYearId 
        ? db.student.count({ where: { academicYearId, status: 'Active' } })
        : db.student.count({ where: { status: 'Active' } }),
      db.attendance.count({
        where: {
          date: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lt: new Date(new Date().setHours(23, 59, 59, 999))
          },
          status: 'Present'
        }
      }),
      db.student.count({
        where: {
          admissionDate: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      }),
      db.exam.count({
        where: {
          startDate: {
            gte: new Date(),
            lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          },
          status: 'Upcoming'
        }
      }),
      db.book.aggregate({ _sum: { totalCopies: true } }),
      db.vehicle.count({ where: { status: 'Active' } }),
      db.student.findMany({
        where: {
          admissionDate: {
            gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
          }
        },
        select: {
          admissionDate: true
        },
        orderBy: { admissionDate: 'asc' }
      }),
      db.attendance.findMany({
        where: {
          date: {
            gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
          }
        },
        select: {
          date: true,
          status: true
        },
        orderBy: { date: 'asc' }
      }),
      db.examResult.findMany({
        include: {
          examPaper: {
            include: {
              subject: true
            }
          }
        },
        orderBy: { examPaper: { examDate: 'asc' } }
      }),
      db.libraryBorrowal.findMany({
        where: {
          borrowDate: {
            gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
          }
        },
        include: {
          book: true,
          student: true
        },
        orderBy: { borrowDate: 'desc' }
      }),
      db.examResult.findMany({
        where: {
          examPaper: {
            examDate: {
              gte: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000)
            }
          }
        },
        include: {
          examPaper: {
            include: {
              subject: true
            }
          }
        },
        orderBy: { examPaper: { examDate: 'desc' } }
      }),
      db.teacher.findMany({
        where: { status: 'Active' }
      }),
      db.course.findMany({
        where: { isPublished: true }
      }),
      db.subject.findMany(),
      db.examResult.findMany({
        include: {
          examPaper: {
            include: {
              subject: true,
              grade: true
            }
          },
          student: true
        },
        orderBy: { examPaper: { examDate: 'desc' } },
        take: 500
      }),
      db.attendance.groupBy({
        by: ['studentId', 'status'],
        where: {
          date: {
            gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
          }
        },
        _count: true
      }),
      db.grade.findMany({
        include: {
          students: {
            where: { status: 'Active' }
          }
        }
      })
    ])

    const totalAttendanceToday = await db.attendance.count({
      where: {
        date: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
          lt: new Date(new Date().setHours(23, 59, 59, 999))
        }
      }
    })

    const attendanceRate = totalAttendanceToday > 0 
      ? presentToday / totalAttendanceToday 
      : 0

    const enrollmentsByMonth = historicalEnrollments.reduce((acc, student) => {
      const month = new Date(student.admissionDate).toLocaleString('default', { month: 'short', year: 'numeric' })
      acc[month] = (acc[month] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const enrollmentTrends = Object.entries(enrollmentsByMonth).map(([month, count]) => ({
      month,
      count
    }))

    const attendanceByDate = historicalAttendance.reduce((acc, record) => {
      const date = new Date(record.date).toISOString().split('T')[0]
      if (!acc[date]) {
        acc[date] = { total: 0, present: 0 }
      }
      acc[date].total++
      if (record.status === 'Present') {
        acc[date].present++
      }
      return acc
    }, {} as Record<string, { total: number; present: number }>)

    const attendanceTrends = Object.entries(attendanceByDate)
      .map(([date, data]) => ({
        date,
        rate: data.total > 0 ? data.present / data.total : 0
      }))
      .slice(-30)

    const recentExamResults = historicalPerformance.filter(result => {
      const examDate = result.examPaper.examDate
      const sixMonthsAgo = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000)
      return examDate >= sixMonthsAgo
    })

    const performanceByGrade = recentExamResults.reduce((acc, result) => {
      const grade = result.examPaper.grade
      if (!acc[grade]) {
        acc[grade] = { total: 0, obtained: 0 }
      }
      acc[grade].total += result.examPaper.totalMarks
      acc[grade].obtained += result.marksObtained
      return acc
    }, {} as Record<string, { total: number; obtained: number }>)

    const performanceTrends = Object.entries(performanceByGrade).map(([grade, data]) => ({
      grade,
      average: data.total > 0 ? (data.obtained / data.total) * 100 : 0
    }))

    const libraryData = {
      borrowedBooks: libraryTransactions.length,
      activeBorrowers: new Set(libraryTransactions.map(t => t.studentId)).size,
      overdueBooks: libraryTransactions.filter(t => t.returnDate === null && new Date(t.dueDate) < new Date()).length,
      popularCategories: libraryTransactions.reduce((acc, t) => {
        const category = t.book.category || 'General'
        acc[category] = (acc[category] || 0) + 1
        return acc
      }, {} as Record<string, number>)
    }

    const popularCategoriesArray = Object.entries(libraryData.popularCategories)
      .map(([category, count]) => ({ subject: category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    const studentPerformanceData = {
      lowPerformingStudents: new Set(examResultsForPerformance.filter(r => (r.marksObtained / r.examPaper.totalMarks) < 0.4).map(r => r.studentId)).size,
      highPerformingStudents: new Set(examResultsForPerformance.filter(r => (r.marksObtained / r.examPaper.totalMarks) > 0.8).map(r => r.studentId)).size,
      subjectsNeedingAttention: Object.entries(
        examResultsForPerformance.reduce((acc, r) => {
          const subject = r.examPaper.subject?.name || 'Unknown'
          const percentage = (r.marksObtained / r.examPaper.totalMarks) * 100
          if (!acc[subject]) {
            acc[subject] = { total: 0, sum: 0 }
          }
          acc[subject].total += 1
          acc[subject].sum += percentage
          return acc
        }, {} as Record<string, { total: number; sum: number }>)
      )
        .map(([subject, data]) => ({ subject, average: data.sum / data.total }))
        .filter(s => s.average < 70)
        .sort((a, b) => a.average - b.average)
        .slice(0, 3)
    }

    const dashboardData = {
      totalStudents,
      totalTeachers,
      totalGrades,
      activeStudents,
      presentToday,
      recentEnrollments,
      upcomingExams,
      libraryBooks: libraryBooks._sum.totalCopies || 0,
      transportVehicles,
      attendanceRate,
      historicalData: {
        enrollments: enrollmentTrends,
        attendance: attendanceTrends,
        performance: performanceTrends
      },
      libraryData: {
        borrowedBooks: libraryData.borrowedBooks,
        activeBorrowers: libraryData.activeBorrowers,
        overdueBooks: libraryData.overdueBooks,
        popularSubjects: popularCategoriesArray,
        readingLevels: {
          beginner: 0,
          intermediate: 0,
          advanced: 0
        }
      },
      studentPerformanceData,
      teacherData: {
        teachers: teacherPerformance.map(t => {
          const teacherCourses = courses.filter(c => c.teacherId === t.id)
          const subjectIds = teacherCourses.map(c => c.subjectId)
          const subjectNames = subjects.filter(s => subjectIds.includes(s.id)).map(s => s.name)
          return {
            id: t.id,
            name: `${t.firstName} ${t.lastName}`,
            subjects: subjectNames,
            experience: t.experience || 0
          }
        }),
        totalActiveTeachers: teacherPerformance.length
      },
      examDataBySubject: examResultsBySubject.reduce((acc, result) => {
        const subject = result.examPaper.subject?.name || 'Unknown'
        const grade = result.examPaper.grade
        const percentage = (result.marksObtained / result.examPaper.totalMarks) * 100
        if (!acc[subject]) {
          acc[subject] = { total: 0, sum: 0, grades: {} as Record<string, { total: number; sum: number }> }
        }
        acc[subject].total += 1
        acc[subject].sum += percentage
        if (grade) {
          if (!acc[subject].grades[grade]) {
            acc[subject].grades[grade] = { total: 0, sum: 0 }
          }
          acc[subject].grades[grade].total += 1
          acc[subject].grades[grade].sum += percentage
        }
        return acc
      }, {} as Record<string, { total: number; sum: number; grades: Record<string, { total: number; sum: number }> }>),
      attendanceByStudent: attendanceRecordsByStudent.reduce((acc, record) => {
        if (!acc[record.studentId]) {
          acc[record.studentId] = { total: 0, present: 0, absent: 0 }
        }
        acc[record.studentId].total += record._count
        if (record.status === 'Present') {
          acc[record.studentId].present += record._count
        } else {
          acc[record.studentId].absent += record._count
        }
        return acc
      }, {} as Record<string, { total: number; present: number; absent: number }>),
      gradesData: grades.map(g => ({
        id: g.id,
        name: g.name,
        studentCount: g.students.length
      }))
    }

    const predictions = await dashboardPredictionService.generateDashboardPredictions(dashboardData)

    return NextResponse.json({
      success: true,
      data: predictions
    })
  } catch (error) {
    console.error('Dashboard AI prediction error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate dashboard predictions'
      },
      { status: 500 }
    )
  }
}

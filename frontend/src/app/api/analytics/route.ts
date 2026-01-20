import { NextRequest, NextResponse } from 'next/server'
import { fetchAPI } from '@/lib/api/client'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type') || 'overview'
    const academicYearId = searchParams.get('academicYearId')
    const sectionId = searchParams.get('sectionId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    let data: any = {}

    switch (type) {
      case 'overview': {
        // Fetch overview statistics from backend
        const [studentsResponse, staffResponse, attendanceResponse, behaviorResponse] = await Promise.all([
          fetchAPI<{ results: any[] }>('/students/'),
          fetchAPI<{ results: any[] }>('/staff/'),
          fetchAPI<any>('/attendance/stats/'),
          fetchAPI<{ results: any[] }>('/behavior/')
        ])

        const students = studentsResponse.results || []
        const staff = staffResponse.results || []
        const attendanceStats = attendanceResponse
        const behaviorRecords = behaviorResponse.results || []

        const studentCount = academicYearId
          ? students.filter((s: any) => s.academic_year === academicYearId || s.academicYearId === academicYearId).length
          : students.length

        const teacherCount = staff.filter((s: any) => s.type === 'Teacher').length
        const staffCount = staff.filter((s: any) => s.type === 'Staff').length

        // Group behavior by type
        const behaviorByType = behaviorRecords
          .filter((b: any) => {
            if (startDate && endDate) {
              const date = new Date(b.date || b.created_at)
              return date >= new Date(startDate) && date <= new Date(endDate)
            }
            return true
          })
          .reduce((acc: any, b: any) => {
            acc[b.type] = (acc[b.type] || 0) + 1
            return acc
          }, {})

        data = {
          studentCount,
          teacherCount,
          staffCount,
          attendanceRate: attendanceStats.rate || 0,
          behaviorRecords: Object.entries(behaviorByType).map(([type, _count]) => ({
            type,
            _count: { _count: _count as number }
          }))
        }
        break
      }

      case 'students': {
        const [studentsResponse, attendanceResponse, gradesResponse, sectionsResponse] = await Promise.all([
          fetchAPI<{ results: any[] }>('/students/'),
          fetchAPI<any>('/attendance/stats/'),
          fetchAPI<{ results: any[] }>('/grades/'),
          fetchAPI<{ results: any[] }>('/sections/')
        ])

        const students = studentsResponse.results || []
        const grades = gradesResponse.results || []
        const sections = sectionsResponse.results || []

        // Group students by grade
        const studentsByGrade = students.reduce((acc: any, s: any) => {
          const gradeId = s.grade || s.gradeId
          acc[gradeId] = (acc[gradeId] || 0) + 1
          return acc
        }, {})

        const studentsByGradeWithNames = Object.entries(studentsByGrade).map(([gradeId, count]) => ({
          gradeId,
          _count: { _count: count as number },
          grade: grades.find((g: any) => g.id === gradeId)
        }))

        // Group students by section
        const studentsBySection = students.reduce((acc: any, s: any) => {
          const sectionId = s.section || s.sectionId
          acc[sectionId] = (acc[sectionId] || 0) + 1
          return acc
        }, {})

        const studentsBySectionWithNames = Object.entries(studentsBySection).map(([sectionId, count]) => ({
          sectionId,
          _count: { _count: count as number },
          section: sections.find((s: any) => s.id === sectionId)
        }))

        data = {
          studentsByGrade: studentsByGradeWithNames,
          studentsBySection: studentsBySectionWithNames,
          presentCount: Math.floor((attendanceStats.rate || 0.7) * students.length),
          absentCount: Math.floor((1 - (attendanceStats.rate || 0.7)) * students.length),
          attendanceRate: attendanceStats.rate || 0.7
        }
        break
      }

      case 'academics': {
        const [examResultsResponse, subjectsResponse] = await Promise.all([
          fetchAPI<{ results: any[] }>('/exam-results/'),
          fetchAPI<{ results: any[] }>('/curriculum/subjects/')
        ])

        const examResults = examResultsResponse.results || []
        const subjects = subjectsResponse.results || []

        // Group by exam
        const examResultsByExam = examResults.reduce((acc: any, r: any) => {
          const examId = r.exam || r.examId
          if (!acc[examId]) {
            acc[examId] = { totalMarks: 0, obtainedMarks: 0, count: 0 }
          }
          acc[examId].totalMarks += r.total_marks || r.totalMarks || 100
          acc[examId].obtainedMarks += r.marks_obtained || r.marksObtained || 0
          acc[examId].count += 1
          return acc
        }, {})

        // Group by subject
        const subjectPerformance = examResults.reduce((acc: any, r: any) => {
          const subject = r.subject || r.subjectName || 'Unknown'
          if (!acc[subject]) {
            acc[subject] = { totalMarks: 0, obtainedMarks: 0, count: 0 }
          }
          acc[subject].totalMarks += r.total_marks || r.totalMarks || 100
          acc[subject].obtainedMarks += r.marks_obtained || r.marksObtained || 0
          acc[subject].count += 1
          return acc
        }, {})

        const subjectPerformanceWithNames = Object.entries(subjectPerformance).map(([subject, stats]: [string, any]) => ({
          subjectId: subject,
          _avg: {
            obtainedMarks: stats.obtainedMarks / stats.count,
            totalMarks: stats.totalMarks / stats.count
          },
          subject: subjects.find((s: any) => s.name === subject)
        }))

        data = {
          examResults: Object.entries(examResultsByExam).map(([examId, stats]: [string, any]) => ({
            examId,
            _avg: {
              obtainedMarks: stats.obtainedMarks / stats.count,
              totalMarks: stats.totalMarks / stats.count
            }
          })),
          subjectPerformance: subjectPerformanceWithNames,
          averagePerformance: Object.values(examResultsByExam).reduce((acc: number, stats: any) => {
            return acc + (stats.obtainedMarks / stats.totalMarks) * 100
          }, 0) / Object.keys(examResultsByExam).length
        }
        break
      }

      case 'behavior': {
        const behaviorResponse = await fetchAPI<{ results: any[] }>('/behavior/')

        const behaviorRecords = behaviorResponse.results || []

        const behaviorByType = behaviorRecords.reduce((acc: any, b: any) => {
          const type = b.type
          if (!acc[type]) {
            acc[type] = { _count: 0, _sum: { points: 0 } }
          }
          acc[type]._count += 1
          acc[type]._sum.points += b.points || 0
          return acc
        }, {})

        const behaviorByCategory = behaviorRecords.reduce((acc: any, b: any) => {
          const category = b.category
          if (!acc[category]) {
            acc[category] = { _count: 0 }
          }
          acc[category]._count += 1
          return acc
        }, {})

        const recentIncidents = behaviorRecords
          .filter((b: any) => {
            if (startDate && endDate) {
              const date = new Date(b.date || b.created_at)
              return date >= new Date(startDate) && date <= new Date(endDate)
            }
            return true
          })
          .slice(0, 10)
          .map((b: any) => ({
            ...b,
            Student: {
              firstName: b.student_first_name || b.firstName || '',
              lastName: b.student_last_name || b.lastName || '',
              rollNumber: b.roll_number || b.rollNumber || ''
            }
          }))

        data = {
          behaviorByType: Object.entries(behaviorByType).map(([type, stats]) => ({
            type,
            _count: stats._count,
            _sum: stats._sum
          })),
          behaviorByCategory: Object.entries(behaviorByCategory).map(([category, stats]) => ({
            category,
            _count: stats._count
          })),
          recentIncidents
        }
        break
      }

      case 'library': {
        const [booksResponse, borrowalsResponse] = await Promise.all([
          fetchAPI<{ results: any[] }>('/library/books/'),
          fetchAPI<{ results: any[] }>('/library/borrowals/')
        ])

        const books = booksResponse.results || []
        const borrowals = borrowalsResponse.results || []

        const totalBooks = books.length
        const borrowedBooks = borrowals.filter((b: any) => !b.return_date).length
        const overdueBooks = borrowals.filter((b: any) => {
          return !b.return_date && new Date(b.due_date || b.dueDate) < new Date()
        }).length

        // Group by book to find popular
        const popularBooks = Object.entries(
          borrowals.reduce((acc: any, b: any) => {
            const bookId = b.book || b.bookId
            acc[bookId] = (acc[bookId] || 0) + 1
            return acc
          }, {})
        )
          .map(([bookId, count]) => ({ bookId, _count: { _count: count as number } }))
          .sort((a: any, b: any) => b._count._count - a._count._count)
          .slice(0, 10)

        data = {
          totalBooks,
          borrowedBooks,
          overdueBooks,
          popularBooks
        }
        break
      }

      case 'transport': {
        const [vehiclesResponse, allocationsResponse] = await Promise.all([
          fetchAPI<{ results: any[] }>('/transport/vehicles/'),
          fetchAPI<{ results: any[] }>('/transport/allocations/')
        ])

        const vehicles = vehiclesResponse.results || []
        const allocations = allocationsResponse.results || []

        const totalVehicles = vehicles.length
        const activeAllocations = allocations.filter((a: any) => a.status === 'Active').length

        // Group by route
        const routeStats = allocations.reduce((acc: any, a: any) => {
          const routeId = a.route || a.routeId
          acc[routeId] = (acc[routeId] || 0) + 1
          return acc
        }, {})

        data = {
          totalVehicles,
          activeAllocations,
          routeStats: Object.entries(routeStats).map(([routeId, count]) => ({
            routeId,
            _count: { _count: count as number }
          }))
        }
        break
      }

      case 'inventory': {
        const inventoryResponse = await fetchAPI<{ results: any[] }>('/inventory/')

        const assets = inventoryResponse.results || []

        const totalAssets = assets.length

        // Group by category
        const assetByCategory = assets.reduce((acc: any, a: any) => {
          const category = a.category
          acc[category] = (acc[category] || 0) + 1
          return acc
        }, {})

        // Group by status
        const assetByStatus = assets.reduce((acc: any, a: any) => {
          const status = a.status
          acc[status] = (acc[status] || 0) + 1
          return acc
        }, {})

        data = {
          totalAssets,
          assetByCategory: Object.entries(assetByCategory).map(([category, count]) => ({
            category,
            _count: { _count: count as number }
          })),
          assetByStatus: Object.entries(assetByStatus).map(([status, count]) => ({
            status,
            _count: { _count: count as number }
          }))
        }
        break
      }

      default:
        return NextResponse.json({ error: 'Invalid analytics type' }, { status: 400 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
  }
}

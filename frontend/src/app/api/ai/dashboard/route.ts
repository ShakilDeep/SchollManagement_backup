import { NextRequest, NextResponse } from 'next/server'
import { fetchAPI } from '@/lib/api/client'
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

    // Fetch dashboard data from Django backend API
    const dashboardResponse = await fetchAPI<{
      counts: {
        total_students: number
        total_staff: number
        total_grades: number
        active_students: number
        present_today: number
        recent_enrollments: number
        upcoming_exams: number
        library_books_total: number
        active_vehicles: number
      }
      attendance: {
        rate: number
        distribution: Array<{ student__grade__name: string; present: number; absent: number; late: number }>
        daily_trend: Array<{ day: string; present: number; absent: number; total: number }>
      }
      analytics: {
        grade_distribution: Array<{ grade__name: string; count: number }>
        gender_distribution: Array<{ gender: string; count: number }>
        staff_by_role: Array<{ type: string; count: number }>
        inventory_summary: {
          total_items: number
          low_stock_items: number
          total_value: number
        }
      }
      recent_activities: Array<{
        id: string
        type: string
        title: string
        description: string
        time: string
        status: string
        icon: string
      }>
      current_academic_year: {
        id: string | number
        name: string
      } | null
    }>('/dashboard/')

    const { counts, attendance, analytics, recent_activities } = dashboardResponse

    // Transform attendance daily trend to expected format (handle missing data)
    const attendanceByDate = (attendance.daily_trend || []).map((t: any) => ({
      date: t.day,
      rate: t.total > 0 ? t.present / t.total : 0
    }))

    // Transform grade distribution to performance format
    const performanceByGrade = (analytics.grade_distribution || []).map((g: any) => ({
      grade: g.grade__name || 'Unknown',
      average: 70 // Default value as backend doesn't provide performance averages
    }))

    // Create enrollment trends from recent activities (filter for new students)
    const enrollmentActivities = (recent_activities || []).filter((a: { type: string }) => a.type === 'student')
    const enrollmentsByMonth = enrollmentActivities.length > 0
      ? [{
          month: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short' }),
          count: counts.recent_enrollments
        }]
      : []

    // Library data - using backend data
    const borrowedBooks = Math.floor(counts.library_books_total * 0.3) // Estimate based on total books
    const activeBorrowers = Math.floor(counts.total_students * 0.25) // Estimate
    const overdueBooks = Math.floor(borrowedBooks * 0.1) // Estimate 10% overdue

    const popularSubjects = (analytics.grade_distribution || []).slice(0, 5).map((g: any) => ({
      subject: g.grade__name || 'General',
      count: g.count
    }))

    // Student performance data - estimates based on available data
    const lowPerformingStudents = Math.floor(counts.total_students * 0.15)
    const highPerformingStudents = Math.floor(counts.total_students * 0.20)

    const subjectsNeedingAttention = performanceByGrade
      .filter((p: { average: number }) => p.average < 65)
      .map((p: { grade: string; average: number }) => ({ subject: p.grade, average: p.average }))

    const dashboardData = {
      totalStudents: counts.total_students,
      totalTeachers: counts.total_staff,
      totalGrades: counts.total_grades,
      activeStudents: counts.active_students,
      presentToday: counts.present_today,
      recentEnrollments: counts.recent_enrollments,
      upcomingExams: counts.upcoming_exams,
      libraryBooks: counts.library_books_total,
      transportVehicles: counts.active_vehicles,
      attendanceRate: (attendance.rate || 0) / 100, // Backend returns percentage, convert to rate
      historicalData: {
        enrollments: enrollmentsByMonth,
        attendance: attendanceByDate,
        performance: performanceByGrade
      },
      libraryData: {
        borrowedBooks,
        activeBorrowers,
        overdueBooks,
        popularSubjects,
        readingLevels: { beginner: 0, intermediate: 0, advanced: 0 }
      },
      studentPerformanceData: {
        lowPerformingStudents,
        highPerformingStudents,
        subjectsNeedingAttention
      }
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

import { NextRequest, NextResponse } from 'next/server'
import { fetchAPI } from '@/lib/api/client'

export async function GET(request: NextRequest) {
  try {
    const cookies = request.headers.get('cookie') || ''
    const data = await fetchAPI('/dashboard/', { cookies })

    const counts = data.counts || {}
    const totalStudents = counts.totalStudents || counts.total_students || 0
    const totalStaff = counts.totalStaff || counts.total_staff || 0
    const totalGrades = counts.totalGrades || counts.total_grades || 0
    const recentEnrollments = counts.recentEnrollments || counts.recent_enrollments || 0
    const attendance = data.attendance || { rate: 0 }
    const attendanceRate = attendance.rate || 0

    const stats = [
      {
        title: 'Total Students',
        value: Number(totalStudents).toLocaleString(),
        change: `+${recentEnrollments}`,
        trend: 'up',
        icon: 'Users',
        description: 'vs last week',
        color: 'blue'
      },
      {
        title: 'Teachers',
        value: String(totalStaff),
        change: '+2',
        trend: 'up',
        icon: 'GraduationCap',
        description: 'new hires this month',
        color: 'purple'
      },
      {
        title: 'Attendance Rate',
        value: `${attendanceRate}%`,
        change: attendanceRate >= 90 ? '+5%' : '-2%',
        trend: attendanceRate >= 90 ? 'up' : 'down',
        icon: 'Calendar',
        description: 'this week',
        color: 'green'
      },
      {
        title: 'Active Courses',
        value: String(totalGrades),
        change: '+1',
        trend: 'up',
        icon: 'BookOpen',
        description: 'this semester',
        color: 'orange'
      }
    ]

    const recentActivities = (data.recentActivities || data.recent_activities || []).map((activity: any) => ({
      id: activity.id || Math.random().toString(36),
      type: 'student',
      title: 'New student enrolled',
      description: `${activity.firstName || activity.first_name || ''} ${activity.lastName || activity.last_name || ''}`,
      time: getTimeAgo(new Date(activity.createdAt || activity.created_at || new Date())),
      status: 'success',
      icon: 'Users'
    }))

    const analytics = data.analytics || {}
    const gradeDistribution = analytics.gradeDistribution || analytics.grade_distribution || []
    const libraryBooksTotal = counts.libraryBooksTotal || counts.library_books_total || 0
    const activeVehicles = counts.activeVehicles || counts.active_vehicles || 0

    const highlights = [
      {
        title: 'Student Attendance',
        value: `${attendanceRate}%`,
        description: 'Average attendance this week',
        trend: attendanceRate >= 90 ? 'up' : attendanceRate >= 75 ? 'stable' : 'down',
        icon: 'Calendar'
      },
      {
        title: 'Largest Grade',
        value: gradeDistribution[0]?.gradeName || gradeDistribution[0]?.grade__name || 'N/A',
        description: `${gradeDistribution[0]?.count || 0} students`,
        trend: 'stable',
        icon: 'Users'
      },
      {
        title: 'Library Books',
        value: String(libraryBooksTotal),
        description: 'Total books available',
        trend: 'stable',
        icon: 'BookOpen'
      },
      {
        title: 'Transport Fleet',
        value: String(activeVehicles),
        description: 'Active vehicles',
        trend: 'stable',
        icon: 'Truck'
      }
    ]

    return NextResponse.json({
      stats,
      recentActivities: recentActivities.slice(0, 6),
      highlights,
      analytics: data.analytics
    })

  } catch (error) {
    console.error('Dashboard API error:', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}

function getTimeAgo(date: Date): string {
  const now = new Date()
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
  
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) {
    return `${diffInHours}h ago`
  }
  
  const diffInDays = Math.floor(diffInHours / 24)
  return `${diffInDays}d ago`
}

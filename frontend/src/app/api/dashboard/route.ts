import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    // Get current academic year
    const currentAcademicYear = await db.academicYear.findFirst({
      where: { isCurrent: true },
    })

    const academicYearId = currentAcademicYear?.id

    // Get stats
    const [
      totalStudents,
      totalTeachers,
      totalParents,
      totalGrades,
      activeStudents,
      presentToday,
      recentEnrollments,
      upcomingExams,
      libraryBooks,
      transportVehicles,
    ] = await Promise.all([
      // Total students
      db.student.count(),
      
      // Total teachers
      db.teacher.count({
        where: { status: 'Active' }
      }),
      
      // Total parents
      db.parent.count(),
      
      // Total grades
      db.grade.count(),
      
      // Active students (current academic year)
      academicYearId 
        ? db.student.count({
            where: { 
              academicYearId,
              status: 'Active'
            }
          })
        : db.student.count({ where: { status: 'Active' } }),
      
      // Present today
      db.attendance.count({
        where: {
          date: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lt: new Date(new Date().setHours(23, 59, 59, 999))
          },
          status: 'Present'
        }
      }),
      
      // Recent enrollments (last 7 days)
      db.student.count({
        where: {
          admissionDate: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      }),
      
      // Upcoming exams (next 30 days)
      db.exam.count({
        where: {
          startDate: {
            gte: new Date(),
            lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          },
          status: 'Upcoming'
        }
      }),
      
      // Total library books
      db.book.aggregate({
        _sum: { totalCopies: true }
      }),
      
      // Active transport vehicles
      db.vehicle.count({
        where: { status: 'Active' }
      })
    ])

    // Calculate attendance rate
    const totalAttendanceToday = await db.attendance.count({
      where: {
        date: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
          lt: new Date(new Date().setHours(23, 59, 59, 999))
        }
      }
    })
    const attendanceRate = totalAttendanceToday > 0 
      ? Math.round((presentToday / totalAttendanceToday) * 100) 
      : 0

    // Get recent activities
    const recentStudents = await db.student.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        grade: true,
        section: true,
      },
    })

    const recentActivities = recentStudents.map(student => ({
      id: student.id,
      type: 'student',
      title: 'New student enrolled',
      description: `${student.firstName} ${student.lastName} enrolled in ${student.grade.name}-${student.section.name}`,
      time: getTimeAgo(student.createdAt),
      status: 'success',
      icon: 'Users'
    }))

    // Add recent attendance activities
    const recentAttendanceRecords = await db.attendance.findMany({
      take: 3,
      orderBy: { createdAt: 'desc' },
      include: {
        student: {
          include: {
            grade: true,
            section: true,
          }
        }
      },
    })

    recentAttendanceRecords.forEach(record => {
      recentActivities.push({
        id: record.id,
        type: 'attendance',
        title: `Attendance marked: ${record.status}`,
        description: `${record.student.firstName} ${record.student.lastName} (${record.student.grade.name}-${record.student.section.name})`,
        time: getTimeAgo(record.createdAt),
        status: record.status === 'Present' ? 'success' : record.status === 'Absent' ? 'error' : 'warning',
        icon: 'Calendar'
      })
    })

    // Sort activities by time
    recentActivities.sort((a, b) => b.time.localeCompare(a.time))

    // Get highlights
    const topGrade = await db.student.groupBy({
      by: ['gradeId'],
      where: academicYearId ? { academicYearId } : {},
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 1,
    })

    const gradeWithMostStudents = topGrade[0] 
      ? await db.grade.findUnique({
          where: { id: topGrade[0].gradeId },
          select: { name: true }
        })
      : null

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
        value: gradeWithMostStudents?.name || 'N/A',
        description: `${topGrade[0]?._count.id || 0} students`,
        trend: 'stable',
        icon: 'Users'
      },
      {
        title: 'Library Books',
        value: libraryBooks._sum.totalCopies?.toString() || '0',
        description: 'Total books available',
        trend: 'stable',
        icon: 'BookOpen'
      },
      {
        title: 'Transport Fleet',
        value: transportVehicles.toString(),
        description: 'Active vehicles',
        trend: 'stable',
        icon: 'Truck'
      }
    ]

    const stats = [
      {
        title: 'Total Students',
        value: totalStudents.toLocaleString(),
        change: `+${recentEnrollments}`,
        trend: 'up',
        icon: 'Users',
        description: 'vs last week',
        color: 'blue'
      },
      {
        title: 'Teachers',
        value: totalTeachers.toString(),
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
        value: totalGrades.toString(),
        change: '+1',
        trend: 'up',
        icon: 'BookOpen',
        description: 'this semester',
        color: 'orange'
      }
    ]

    return NextResponse.json({
      stats,
      recentActivities: recentActivities.slice(0, 6),
      highlights
    })

  } catch (error) {
    console.error('[DASHBOARD_GET]', error)
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
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { startOfDay, endOfDay, subDays, format } from 'date-fns'

export const dynamic = 'force-dynamic'
export const revalidate = 60

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const dateStr = searchParams.get('date')

  if (!dateStr) return new NextResponse('Date required', { status: 400 })

  const date = new Date(dateStr)
  const todayStart = startOfDay(date)

  try {
    const sevenDaysAgo = subDays(date, 6)
    const sevenDaysAgoStart = startOfDay(sevenDaysAgo)
    const todayEnd = endOfDay(date)

    const totalStudents = await db.student.count({
      where: { status: 'Active' }
    })

    const allAttendanceRecords = await db.attendance.findMany({
      select: {
        date: true,
        status: true
      },
      where: {
        date: {
          gte: sevenDaysAgoStart,
          lte: todayEnd
        }
      }
    })

    const attendanceByDate = new Map<string, Record<string, number>>()
    
    for (let i = 0; i < 7; i++) {
      const d = subDays(date, i)
      const dateKey = d.toISOString().split('T')[0]
      attendanceByDate.set(dateKey, {
        Present: 0,
        Absent: 0,
        Late: 0,
        HalfDay: 0
      })
    }

    allAttendanceRecords.forEach(record => {
      const dateKey = record.date.toISOString().split('T')[0]
      const dayStats = attendanceByDate.get(dateKey)
      if (dayStats && record.status in dayStats) {
        dayStats[record.status]++
      }
    })

    const trendData = []
    for (let i = 6; i >= 0; i--) {
      const d = subDays(date, i)
      const dateKey = d.toISOString().split('T')[0]
      const stats = attendanceByDate.get(dateKey) || {
        Present: 0,
        Absent: 0,
        Late: 0,
        HalfDay: 0
      }

      const effectivePresent = stats.Present + stats.Late + stats.HalfDay
      const rate = totalStudents > 0 ? (effectivePresent / totalStudents) * 100 : 0

      trendData.push({
        date: d,
        present: stats.Present,
        absent: stats.Absent,
        late: stats.Late,
        halfDay: stats.HalfDay,
        rate: Math.round(rate * 10) / 10
      })
    }

    return NextResponse.json({
      trends: trendData
    })
  } catch (error) {
    console.error('[ATTENDANCE_STATS_GET]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}

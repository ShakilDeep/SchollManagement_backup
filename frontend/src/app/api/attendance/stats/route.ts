import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { startOfDay, endOfDay, subDays, format } from 'date-fns'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const dateStr = searchParams.get('date')

  if (!dateStr) return new NextResponse('Date required', { status: 400 })

  const date = new Date(dateStr)
  const todayStart = startOfDay(date)
  const todayEnd = endOfDay(date)

  try {
    // 1. Get Weekly Trends (Last 7 days including today)
    const trendData = []
    for (let i = 6; i >= 0; i--) {
      const d = subDays(date, i)
      const s = startOfDay(d)
      const e = endOfDay(d)

      // Get total active students for that day (approximation: current active students)
      // Ideally we'd check snapshot, but for now current active students is close enough
      const totalStudents = await db.student.count({
        where: { status: 'Active' }
      })

      const attendanceRecords = await db.attendance.groupBy({
        by: ['status'],
        where: {
          date: {
            gte: s,
            lte: e
          }
        },
        _count: {
          status: true
        }
      })

      const stats = {
        Present: 0,
        Absent: 0,
        Late: 0,
        HalfDay: 0
      }

      attendanceRecords.forEach(record => {
        if (record.status in stats) {
          stats[record.status as keyof typeof stats] = record._count.status
        }
      })

      const presentCount = stats.Present + stats.Late + stats.HalfDay // Usually Late/HalfDay count as present-ish or we can separate
      // But for "Rate", usually it's (Present + Late + HalfDay) / Total
      
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

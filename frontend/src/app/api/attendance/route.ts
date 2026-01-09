import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { startOfDay, endOfDay } from 'date-fns'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const dateStr = searchParams.get('date')
  const gradeId = searchParams.get('gradeId')
  const sectionId = searchParams.get('sectionId')
  const search = searchParams.get('search')

  if (!dateStr) return new NextResponse('Date required', { status: 400 })
  
  const date = new Date(dateStr)
  const start = startOfDay(date)
  const end = endOfDay(date)

  try {
    const whereClause: any = {
       status: 'Active',
    }
    
    // If we have a grade ID (and it's not 'all' or empty), filter by it
    if (gradeId && gradeId !== 'all') {
        // Check if it's a UUID or a Name. The frontend might send "Grade 10" (name) or ID.
        // The previous mock used names. The select dropdowns will likely use IDs now.
        // Let's assume IDs for robustness, but if we switch frontend to IDs we must be consistent.
        whereClause.gradeId = gradeId
    }

    if (sectionId && sectionId !== 'all') {
        whereClause.sectionId = sectionId
    }

    if (search) {
      whereClause.OR = [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { rollNumber: { contains: search } }
      ]
    }

    const students = await db.student.findMany({
      where: whereClause,
      include: {
        grade: true,
        section: true,
        attendances: {
          where: {
            date: {
              gte: start,
              lte: end
            }
          }
        }
      },
      orderBy: { rollNumber: 'asc' }
    })

    const data = students.map(student => {
        const attendance = student.attendances[0]
        return {
            id: student.id,
            rollNumber: student.rollNumber,
            name: `${student.firstName} ${student.lastName}`,
            grade: student.grade.name,
            section: student.section.name,
            status: attendance ? attendance.status : 'Unmarked', 
            checkIn: attendance?.checkInTime ? new Date(attendance.checkInTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : undefined,
            checkOut: attendance?.checkOutTime ? new Date(attendance.checkOutTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : undefined,
            avatar: student.photo,
            email: student.email,
            phone: student.phone
        }
    })

    return NextResponse.json(data)
  } catch (error) {
    console.error('[ATTENDANCE_GET]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { date, attendanceData } = body
        
        if (!date || !attendanceData) {
            return new NextResponse('Missing data', { status: 400 })
        }

        // Normalize to start of day to ensure consistency
        const attendanceDate = startOfDay(new Date(date))

        // Get a valid admin user for marking attendance
        const adminUser = await db.user.findFirst({
            where: {
                role: 'SUPER_ADMIN'
            }
        })

        const markedBy = adminUser?.id || 'cmk5xc4xt0011vqu49ighb5a6'

        for (const item of attendanceData) {
            if (item.status === 'Unmarked') {
                // Delete existing record if setting to Unmarked
                // We use deleteMany to be safe with date ranges, though unique constraint exists
                // Ideally delete({ where: { studentId_date: ... } })
                try {
                    await db.attendance.delete({
                        where: {
                            studentId_date: {
                                studentId: item.id,
                                date: attendanceDate
                            }
                        }
                    })
                } catch (e) {
                    // Ignore if record doesn't exist
                }
            } else {
                await db.attendance.upsert({
                    where: {
                        studentId_date: {
                            studentId: item.id,
                            date: attendanceDate
                        }
                    },
                    update: {
                        status: item.status,
                    },
                    create: {
                        studentId: item.id,
                        date: attendanceDate,
                        status: item.status,
                        markedBy,
                    }
                })
            }
        }

        return NextResponse.json({ success: true })

    } catch (error) {
        console.error('[ATTENDANCE_POST]', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}

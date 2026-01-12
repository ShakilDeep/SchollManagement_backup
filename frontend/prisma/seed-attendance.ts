import { PrismaClient } from '@prisma/client'
import { startOfDay, endOfDay, subDays, format } from 'date-fns'

const prisma = new PrismaClient()

// Generate consistent attendance patterns for each student
function getStudentAttendancePattern(studentIndex: number, dayIndex: number): string {
  // Create varied patterns for different students
  const patterns = [
    // Pattern 0: Excellent attendance (95% present)
    ['Present', 'Present', 'Present', 'Present', 'Present', 'Present', 'Present', 'Present', 'Present', 'Present',
      'Present', 'Present', 'Present', 'Present', 'Present', 'Present', 'Present', 'Present', 'Present', 'Late'],
    // Pattern 1: Good attendance (85% present)
    ['Present', 'Present', 'Present', 'Present', 'Present', 'Present', 'Present', 'Absent', 'Present', 'Late',
      'Present', 'Present', 'Present', 'Present', 'Present', 'Present', 'HalfDay', 'Present', 'Present', 'Present'],
    // Pattern 2: Average attendance (75% present)
    ['Present', 'Present', 'Absent', 'Present', 'Present', 'Late', 'Present', 'Present', 'Absent', 'Present',
      'Present', 'Present', 'HalfDay', 'Present', 'Present', 'Absent', 'Present', 'Late', 'Present', 'Present'],
    // Pattern 3: Poor attendance (60% present) - at risk
    ['Present', 'Absent', 'Present', 'Absent', 'Present', 'Late', 'Absent', 'Present', 'Present', 'Absent',
      'HalfDay', 'Present', 'Absent', 'Present', 'Late', 'Present', 'Absent', 'Present', 'Absent', 'Present'],
    // Pattern 4: Irregular with Monday absences
    ['Absent', 'Present', 'Present', 'Present', 'Present', 'Absent', 'Present', 'Present', 'Present', 'Late',
      'Absent', 'Present', 'Present', 'Present', 'Present', 'Absent', 'Present', 'Present', 'Present', 'Present'],
  ]

  const patternIndex = studentIndex % patterns.length
  const pattern = patterns[patternIndex]
  return pattern[dayIndex % pattern.length]
}

async function main() {
  console.log('Start seeding extended attendance data (60 days)...')

  const students = await prisma.student.findMany({
    where: { status: 'Active' }
  })

  console.log(`Found ${students.length} active students`)

  const adminUser = await prisma.user.findFirst({
    where: { role: 'SUPER_ADMIN' }
  })

  const markedBy = adminUser?.id || 'cmk5xc4xt0011vqu49ighb5a6'

  let totalRecords = 0
  let skippedRecords = 0

  // Generate 60 days of historical data
  for (let i = 60; i >= 0; i--) {
    const date = subDays(new Date(), i)
    const dateStart = startOfDay(date)

    const dayName = format(date, 'EEEE')

    // Skip Sundays
    if (dayName === 'Sunday') {
      continue
    }

    console.log(`Seeding attendance for ${dayName}, ${format(date, 'yyyy-MM-dd')}`)

    for (let studentIdx = 0; studentIdx < students.length; studentIdx++) {
      const student = students[studentIdx]
      const status = getStudentAttendancePattern(studentIdx, 60 - i)

      const checkInTime = status === 'Absent' ? null : new Date(date)
      const checkOutTime = status === 'Absent' ? null : new Date(date)

      if (checkInTime) {
        // Present: 8:00-8:30, Late: 8:45-9:30, HalfDay: 11:00-12:00
        if (status === 'Present') {
          checkInTime.setHours(8, Math.floor(Math.random() * 30), 0)
        } else if (status === 'Late') {
          checkInTime.setHours(8, 45 + Math.floor(Math.random() * 45), 0)
        } else if (status === 'HalfDay') {
          checkInTime.setHours(11, Math.floor(Math.random() * 60), 0)
        }
      }

      if (checkOutTime && checkInTime) {
        if (status === 'HalfDay') {
          checkOutTime.setHours(13, Math.floor(Math.random() * 60))
        } else {
          checkOutTime.setHours(14 + Math.floor(Math.random() * 2), Math.floor(Math.random() * 60))
        }
      }

      try {
        await prisma.attendance.upsert({
          where: {
            studentId_date: {
              studentId: student.id,
              date: dateStart
            }
          },
          update: {
            status,
            checkInTime,
            checkOutTime,
            markedBy,
          },
          create: {
            studentId: student.id,
            date: dateStart,
            status,
            checkInTime,
            checkOutTime,
            markedBy,
          }
        })
        totalRecords++
      } catch (error) {
        skippedRecords++
      }
    }
  }

  console.log(`Seeding finished. Created/updated ${totalRecords} attendance records, skipped ${skippedRecords}.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })


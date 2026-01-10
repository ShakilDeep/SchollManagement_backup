import { PrismaClient } from '@prisma/client'
import { startOfDay, endOfDay, subDays, format } from 'date-fns'

const prisma = new PrismaClient()

async function main() {
  console.log('Start seeding attendance data...')

  const students = await prisma.student.findMany({
    where: { status: 'Active' }
  })

  console.log(`Found ${students.length} active students`)

  const adminUser = await prisma.user.findFirst({
    where: { role: 'SUPER_ADMIN' }
  })

  const markedBy = adminUser?.id || 'cmk5xc4xt0011vqu49ighb5a6'

  const statuses = ['Present', 'Present', 'Present', 'Present', 'Present', 'Absent', 'Late', 'HalfDay']

  let totalRecords = 0

  for (let i = 6; i >= 0; i--) {
    const date = subDays(new Date(), i)
    const dateStart = startOfDay(date)
    const dateEnd = endOfDay(date)

    const dayName = format(date, 'EEEE')
    
    if (dayName === 'Sunday') {
      console.log(`Skipping ${dayName}, ${format(date, 'yyyy-MM-dd')}`)
      continue
    }

    console.log(`Seeding attendance for ${dayName}, ${format(date, 'yyyy-MM-dd')}`)

    for (const student of students) {
      const randomStatus = statuses[Math.floor(Math.random() * statuses.length)]
      
      const checkInTime = randomStatus === 'Absent' ? null : new Date(date)
      const checkOutTime = randomStatus === 'Absent' ? null : new Date(date)

      if (checkInTime) {
        checkInTime.setHours(8 + Math.floor(Math.random() * 2), Math.floor(Math.random() * 60), 0)
      }
      
      if (checkOutTime && checkInTime) {
        checkOutTime.setHours(checkInTime.getHours() + 6 + Math.floor(Math.random() * 2))
      }

      try {
        await prisma.attendance.create({
          data: {
            studentId: student.id,
            date: dateStart,
            status: randomStatus,
            checkInTime,
            checkOutTime,
            markedBy,
          }
        })
        totalRecords++
      } catch (error) {
        console.log(`Record already exists for student ${student.rollNumber} on ${format(date, 'yyyy-MM-dd')}`)
      }
    }
  }

  console.log(`Seeding finished. Created ${totalRecords} attendance records.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

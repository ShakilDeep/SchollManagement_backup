import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedHostelData() {
  console.log('Start seeding hostel data...')

  try {
    const academicYear = await prisma.academicYear.findFirst({
      where: { isCurrent: true },
    })

    if (!academicYear) {
      console.log('No current academic year found. Please run the main seed script first.')
      return
    }

    console.log('Found academic year:', academicYear.name)

    const hostels = [
      {
        name: 'Boys Hostel A',
        type: 'Boys',
        capacity: 120,
        wardenName: 'Dr. Rajesh Kumar',
        wardenPhone: '+91-9876543210',
        address: 'North Campus, Building 1',
      },
      {
        name: 'Boys Hostel B',
        type: 'Boys',
        capacity: 100,
        wardenName: 'Mr. Amit Sharma',
        wardenPhone: '+91-9876543211',
        address: 'North Campus, Building 2',
      },
      {
        name: 'Girls Hostel A',
        type: 'Girls',
        capacity: 100,
        wardenName: 'Mrs. Priya Verma',
        wardenPhone: '+91-9876543212',
        address: 'South Campus, Building 3',
      },
      {
        name: 'Girls Hostel B',
        type: 'Girls',
        capacity: 80,
        wardenName: 'Ms. Anjali Singh',
        wardenPhone: '+91-9876543213',
        address: 'South Campus, Building 4',
      },
      {
        name: 'Staff Quarters',
        type: 'Staff',
        capacity: 40,
        wardenName: 'Mr. Suresh Gupta',
        wardenPhone: '+91-9876543214',
        address: 'East Campus, Building 5',
      },
    ]

    const allHostels = []
    for (const hostelData of hostels) {
      try {
        const hostel = await prisma.hostel.create({
          data: hostelData,
        })
        allHostels.push(hostel)
        console.log('Created hostel:', hostel.name)
      } catch (error) {
        console.log('Hostel already exists:', hostelData.name)
        const existing = await prisma.hostel.findUnique({
          where: { name: hostelData.name },
        })
        if (existing) {
          allHostels.push(existing)
        }
      }
    }

    const roomsData = []

    allHostels.forEach((hostel) => {
      const floorCount = hostel.type === 'Staff' ? 2 : 3
      const roomsPerFloor = hostel.type === 'Staff' ? 10 : 20

      for (let floor = 1; floor <= floorCount; floor++) {
        for (let roomNum = 1; roomNum <= roomsPerFloor; roomNum++) {
          const roomNumber = `${floor}${roomNum.toString().padStart(2, '0')}`
          const capacity = hostel.type === 'Staff' ? 2 : 4
          const roomType = capacity === 2 ? 'Double' : 'Dormitory'

          roomsData.push({
            hostelId: hostel.id,
            roomNumber,
            floor,
            capacity,
            currentOccupancy: 0,
            type: roomType,
            facilities: JSON.stringify(['AC', 'WiFi', 'Study Table', 'Wardrobe']),
          })
        }
      }
    })

    const createdRooms = []
    for (const roomData of roomsData) {
      try {
        const room = await prisma.room.create({
          data: roomData,
        })
        createdRooms.push(room)
      } catch (error) {
        const existing = await prisma.room.findUnique({
          where: {
            hostelId_roomNumber: {
              hostelId: roomData.hostelId,
              roomNumber: roomData.roomNumber,
            },
          },
        })
        if (existing) {
          createdRooms.push(existing)
        }
      }
    }
    console.log(`Created ${createdRooms.length} rooms`)

    const students = await prisma.student.findMany({
      where: {
        grade: {
          name: {
            in: ['Grade 11', 'Grade 12'],
          },
        },
      },
      include: {
        grade: true,
      },
    })

    console.log(`Found ${students.length} eligible students for hostel allocation`)

    let allocationCount = 0
    const boysHostels = allHostels.filter((h) => h.type === 'Boys')
    const girlsHostels = allHostels.filter((h) => h.type === 'Girls')

    for (const student of students) {
      if (allocationCount >= 50) break

      const isGrade11 = student.grade.name === 'Grade 11'
      const targetHostels = isGrade11 ? boysHostels : girlsHostels

      if (targetHostels.length === 0) continue

      const hostel = targetHostels[Math.floor(Math.random() * targetHostels.length)]

      const availableRooms = createdRooms.filter(
        (r) => r.hostelId === hostel.id && r.currentOccupancy < r.capacity
      )

      if (availableRooms.length === 0) continue

      const room = availableRooms[Math.floor(Math.random() * availableRooms.length)]

      const allocation = await prisma.hostelAllocation.create({
        data: {
          hostelId: hostel.id,
          roomId: room.id,
          studentId: student.id,
          academicYearId: academicYear.id,
          allocationDate: new Date('2024-06-01'),
          fees: 5000 + Math.floor(Math.random() * 2000),
          status: 'Active',
        },
      })

      await prisma.room.update({
        where: { id: room.id },
        data: { currentOccupancy: room.currentOccupancy + 1 },
      })

      allocationCount++
    }

    await prisma.hostel.updateMany({
      data: { currentOccupancy: 0 },
    })

    for (const hostel of allHostels) {
      const totalOccupancy = await prisma.room.aggregate({
        where: { hostelId: hostel.id },
        _sum: { currentOccupancy: true },
      })

      await prisma.hostel.update({
        where: { id: hostel.id },
        data: { currentOccupancy: totalOccupancy._sum.currentOccupancy || 0 },
      })
    }

    console.log('Hostel data seeding completed successfully!')
    console.log(`- Created ${allHostels.length} hostels`)
    console.log(`- Created ${createdRooms.length} rooms`)
    console.log(`- Created ${allocationCount} student allocations`)
  } catch (error) {
    console.error('Error seeding hostel data:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

seedHostelData()

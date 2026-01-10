import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedHostels() {
  console.log('Starting hostel seeding...')

  const students = await prisma.student.findMany({
    include: { grade: true }
  })

  if (students.length === 0) {
    console.error('No students found. Please seed students first.')
    return
  }

  const academicYear = await prisma.academicYear.findFirst({
    orderBy: { startDate: 'desc' }
  })

  if (!academicYear) {
    console.error('No academic year found. Please create an academic year first.')
    return
  }

  const hostels = [
    {
      name: 'Main Boys Hostel',
      type: 'BOYS',
      capacity: 100,
      currentOccupancy: 0,
      wardenName: 'Rajesh Kumar',
      wardenPhone: '+91-98765-43210',
      address: 'Campus North Block, Building A'
    },
    {
      name: 'Main Girls Hostel',
      type: 'GIRLS',
      capacity: 80,
      currentOccupancy: 0,
      wardenName: 'Sunita Sharma',
      wardenPhone: '+91-98765-43211',
      address: 'Campus South Block, Building B'
    },
    {
      name: 'Junior Boys Hostel',
      type: 'BOYS',
      capacity: 60,
      currentOccupancy: 0,
      wardenName: 'Amit Verma',
      wardenPhone: '+91-98765-43212',
      address: 'Campus East Wing, Floor 1-2'
    }
  ]

  const roomsData: { hostelId: string; roomNumber: string; floor: number; capacity: number; currentOccupancy: number; type: string; facilities: string[] }[] = []

  const createdHostels = []

  for (const hostel of hostels) {
    const existingHostel = await prisma.hostel.findFirst({
      where: { name: hostel.name }
    })
    
    const createdHostel = existingHostel || await prisma.hostel.create({
      data: hostel
    })
    
    if (!createdHostels.find(h => h.id === createdHostel.id)) {
      createdHostels.push(createdHostel)
    }

    const floors = hostel.type === 'GIRLS' ? 3 : 4
    const roomsPerFloor = hostel.type === 'GIRLS' ? 8 : 10

    for (let floor = 1; floor <= floors; floor++) {
      for (let roomNum = 1; roomNum <= roomsPerFloor; roomNum++) {
        const roomNumber = `${floor}${roomNum.toString().padStart(2, '0')}`
        const capacity = floor <= 2 ? 4 : 3
        const roomType = floor <= 2 ? 'Standard' : 'Deluxe'
        const facilities = roomType === 'Deluxe' ? ['Attached Bathroom', 'AC', 'Study Table', 'Wardrobe'] : ['Attached Bathroom', 'Fan', 'Study Table']
        
        roomsData.push({
          hostelId: createdHostel.id,
          roomNumber,
          floor,
          capacity,
          currentOccupancy: 0,
          type: roomType,
          facilities: facilities.join(', ')
        })
      }
    }
  }

  console.log(`Created ${createdHostels.length} hostels`)

  const createdRooms = []
  for (const room of roomsData) {
    const createdRoom = await prisma.room.upsert({
      where: { hostelId_roomNumber: { hostelId: room.hostelId, roomNumber: room.roomNumber } },
      update: {},
      create: room
    })
    createdRooms.push(createdRoom)
  }

  console.log(`Created ${createdRooms.length} rooms`)

  const hostelBoys = createdHostels.find(h => h.type === 'BOYS')
  const hostelGirls = createdHostels.find(h => h.type === 'GIRLS')

  const studentsWithGender = students.map((student, index) => ({
    ...student,
    gender: index % 2 === 0 ? 'MALE' : 'FEMALE'
  }))

  const boysStudents = studentsWithGender.filter(s => s.gender === 'MALE')
  const girlsStudents = studentsWithGender.filter(s => s.gender === 'FEMALE')

  const allocations = []

  for (const student of boysStudents) {
    if (!hostelBoys) continue

    const availableRooms = createdRooms.filter(r => 
      r.hostelId === hostelBoys.id && 
      r.currentOccupancy < r.capacity
    )

    if (availableRooms.length === 0) continue

    const room = availableRooms[Math.floor(Math.random() * availableRooms.length)]
    const fees = room.type === 'Deluxe' ? 15000 : 10000

    allocations.push({
      hostelId: hostelBoys.id,
      roomId: room.id,
      studentId: student.id,
      academicYearId: academicYear.id,
      allocationDate: new Date(academicYear.startDate.getTime() + Math.random() * 30 * 24 * 60 * 60 * 1000),
      fees,
      status: 'Active'
    })

    await prisma.room.update({
      where: { id: room.id },
      data: { currentOccupancy: room.currentOccupancy + 1 }
    })
  }

  for (const student of girlsStudents) {
    if (!hostelGirls) continue

    const availableRooms = createdRooms.filter(r => 
      r.hostelId === hostelGirls.id && 
      r.currentOccupancy < r.capacity
    )

    if (availableRooms.length === 0) continue

    const room = availableRooms[Math.floor(Math.random() * availableRooms.length)]
    const fees = room.type === 'Deluxe' ? 15000 : 10000

    allocations.push({
      hostelId: hostelGirls.id,
      roomId: room.id,
      studentId: student.id,
      academicYearId: academicYear.id,
      allocationDate: new Date(academicYear.startDate.getTime() + Math.random() * 30 * 24 * 60 * 60 * 1000),
      fees,
      status: 'Active'
    })

    await prisma.room.update({
      where: { id: room.id },
      data: { currentOccupancy: room.currentOccupancy + 1 }
    })
  }

  const createdAllocations = []
  for (const allocation of allocations) {
    const createdAllocation = await prisma.hostelAllocation.upsert({
      where: { studentId_academicYearId: { studentId: allocation.studentId, academicYearId: allocation.academicYearId } },
      update: {},
      create: allocation
    })
    createdAllocations.push(createdAllocation)
  }

  console.log(`Created ${createdAllocations.length} hostel allocations`)

  const totalOccupancy = createdAllocations.length
  const boysOccupancy = createdAllocations.filter(a => a.hostelId === hostelBoys?.id).length
  const girlsOccupancy = createdAllocations.filter(a => a.hostelId === hostelGirls?.id).length

  for (const hostel of createdHostels) {
    const hostelOccupancy = createdAllocations.filter(a => a.hostelId === hostel.id).length
    await prisma.hostel.update({
      where: { id: hostel.id },
      data: { currentOccupancy: hostelOccupancy }
    })
  }

  console.log(`Updated hostel occupancy: ${totalOccupancy} total (${boysOccupancy} boys, ${girlsOccupancy} girls)`)

  console.log('Hostel seeding completed successfully!')
}

seedHostels()
  .catch((error) => {
    console.error('Error seeding hostels:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedTransport() {
  console.log('Starting transport seeding...')

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

  const vehicles = [
    {
      vehicleNumber: 'KA-01-AB-1234',
      type: 'bus',
      capacity: 50,
      driverName: 'Ramesh Kumar',
      driverPhone: '9876543210',
      routeNumber: 'ROUTE_A',
      model: 'Tata Starbus',
      licensePlate: 'KA-01-AB-1234',
      insuranceExpiry: new Date('2026-06-15'),
      status: 'Active'
    },
    {
      vehicleNumber: 'KA-01-CD-5678',
      type: 'bus',
      capacity: 45,
      driverName: 'Suresh Patil',
      driverPhone: '9876543211',
      routeNumber: 'ROUTE_B',
      model: 'Eicher 2070',
      licensePlate: 'KA-01-CD-5678',
      insuranceExpiry: new Date('2026-07-20'),
      status: 'Active'
    },
    {
      vehicleNumber: 'KA-01-EF-9012',
      type: 'mini-bus',
      capacity: 25,
      driverName: 'Mohan Singh',
      driverPhone: '9876543212',
      routeNumber: 'ROUTE_C',
      model: 'Force Traveller',
      licensePlate: 'KA-01-EF-9012',
      insuranceExpiry: new Date('2026-05-28'),
      status: 'Maintenance'
    },
    {
      vehicleNumber: 'KA-01-GH-3456',
      type: 'van',
      capacity: 7,
      driverName: 'Rajesh Verma',
      driverPhone: '9876543213',
      routeNumber: 'ROUTE_D',
      model: 'Toyota Innova',
      licensePlate: 'KA-01-GH-3456',
      insuranceExpiry: new Date('2026-08-25'),
      status: 'Active'
    },
    {
      vehicleNumber: 'KA-01-IJ-7890',
      type: 'bus',
      capacity: 55,
      driverName: 'Anil Sharma',
      driverPhone: '9876543214',
      routeNumber: 'ROUTE_E',
      model: 'Ashok Leyland',
      licensePlate: 'KA-01-IJ-7890',
      insuranceExpiry: new Date('2026-06-10'),
      status: 'Active'
    },
    {
      vehicleNumber: 'KA-01-KL-1122',
      type: 'van',
      capacity: 9,
      driverName: 'Vikram Reddy',
      driverPhone: '9876543215',
      routeNumber: 'ROUTE_F',
      model: 'Mahindra Bolero',
      licensePlate: 'KA-01-KL-1122',
      insuranceExpiry: new Date('2026-09-15'),
      status: 'Inactive'
    }
  ]

  const routeConfigs = {
    ROUTE_A: {
      name: 'Route A - Central',
      pickupPoints: ['MG Road', 'Cubbon Park', 'Indiranagar', 'Koramangala'],
      dropPoints: ['School Gate', 'Main Entrance'],
      pickupTime: '07:00 AM',
      dropTime: '03:30 PM'
    },
    ROUTE_B: {
      name: 'Route B - East',
      pickupPoints: ['Whitefield', 'Marathahalli', 'HAL Airport', 'Domlur'],
      dropPoints: ['School Gate', 'Side Entrance'],
      pickupTime: '07:15 AM',
      dropTime: '03:45 PM'
    },
    ROUTE_C: {
      name: 'Route C - West',
      pickupPoints: ['Yeshwanthpur', 'Rajajinagar', 'Vijayanagar', 'Basaveshwarnagar'],
      dropPoints: ['School Gate'],
      pickupTime: '07:20 AM',
      dropTime: '03:50 PM'
    },
    ROUTE_D: {
      name: 'Route D - North',
      pickupPoints: ['Yelahanka', 'Hebbal', 'Manyata'],
      dropPoints: ['School Gate'],
      pickupTime: '07:30 AM',
      dropTime: '04:00 PM'
    },
    ROUTE_E: {
      name: 'Route E - South',
      pickupPoints: ['JP Nagar', 'BTM Layout', 'HSR Layout', 'Silk Board'],
      dropPoints: ['School Gate', 'Back Gate'],
      pickupTime: '07:10 AM',
      dropTime: '03:40 PM'
    },
    ROUTE_F: {
      name: 'Route F - Suburban',
      pickupPoints: ['Electronic City', 'Hosur Road', 'Bommanahalli'],
      dropPoints: ['School Gate'],
      pickupTime: '06:50 AM',
      dropTime: '04:10 PM'
    }
  }

  const createdVehicles = []
  for (const vehicle of vehicles) {
    const existingVehicle = await prisma.vehicle.findFirst({
      where: { vehicleNumber: vehicle.vehicleNumber }
    })

    const createdVehicle = existingVehicle || await prisma.vehicle.create({
      data: vehicle
    })

    if (!createdVehicles.find(v => v.id === createdVehicle.id)) {
      createdVehicles.push(createdVehicle)
    }
  }

  console.log(`Created ${createdVehicles.length} vehicles`)

  const activeVehicles = createdVehicles.filter(v => v.status === 'Active')
  const studentsPerVehicle = Math.floor(students.length / activeVehicles.length)

  const allocations = []
  let studentIndex = 0

  for (const vehicle of activeVehicles) {
    const routeConfig = routeConfigs[vehicle.routeNumber as keyof typeof routeConfigs]
    if (!routeConfig) continue

    for (let i = 0; i < studentsPerVehicle && studentIndex < students.length; i++) {
      const student = students[studentIndex]
      const pickupPoint = routeConfig.pickupPoints[Math.floor(Math.random() * routeConfig.pickupPoints.length)]
      const dropPoint = routeConfig.dropPoints[Math.floor(Math.random() * routeConfig.dropPoints.length)]

      const fees = vehicle.type === 'bus' ? 5000 : vehicle.type === 'mini-bus' ? 4000 : 3000

      allocations.push({
        vehicleId: vehicle.id,
        studentId: student.id,
        pickupPoint,
        pickupTime: routeConfig.pickupTime,
        dropPoint,
        dropTime: routeConfig.dropTime,
        academicYearId: academicYear.id,
        fees
      })

      studentIndex++
    }
  }

  const createdAllocations = []
  for (const allocation of allocations) {
    const createdAllocation = await prisma.transportAllocation.upsert({
      where: { studentId_academicYearId: { studentId: allocation.studentId, academicYearId: allocation.academicYearId } },
      update: {},
      create: allocation
    })
    createdAllocations.push(createdAllocation)
  }

  console.log(`Created ${createdAllocations.length} transport allocations`)

  const allocationCounts = createdVehicles.map(vehicle => ({
    vehicleNumber: vehicle.vehicleNumber,
    route: routeConfigs[vehicle.routeNumber as keyof typeof routeConfigs]?.name || vehicle.routeNumber || 'Unknown',
    studentCount: createdAllocations.filter(a => a.vehicleId === vehicle.id).length,
    status: vehicle.status
  }))

  console.log('Transport allocation summary:')
  allocationCounts.forEach(count => {
    console.log(`  ${count.vehicleNumber} (${count.route}): ${count.studentCount} students [${count.status}]`)
  })

  console.log('Transport seeding completed successfully!')
}

seedTransport()
  .catch((error) => {
    console.error('Error seeding transport:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

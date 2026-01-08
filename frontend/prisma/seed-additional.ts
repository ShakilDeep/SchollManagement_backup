import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedAdditionalData() {
  console.log('Start seeding additional data...')

  try {
    // 1. Create Library Books
    const books = [
      { isbn: '978-0-321-76571-3', title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', category: 'Fiction', totalCopies: 5, availableCopies: 3 },
      { isbn: '978-0-7432-7356-5', title: 'To Kill a Mockingbird', author: 'Harper Lee', category: 'Fiction', totalCopies: 4, availableCopies: 2 },
      { isbn: '978-0-452-28423-4', title: '1984', author: 'George Orwell', category: 'Fiction', totalCopies: 6, availableCopies: 4 },
      { isbn: '978-0-06-112008-4', title: 'The Catcher in the Rye', author: 'J.D. Salinger', category: 'Fiction', totalCopies: 3, availableCopies: 1 },
      { isbn: '978-0-544-00341-5', title: 'Pride and Prejudice', author: 'Jane Austen', category: 'Fiction', totalCopies: 4, availableCopies: 2 },
      { isbn: '978-0-7167-0343-3', title: 'Calculus', author: 'James Stewart', category: 'Mathematics', totalCopies: 8, availableCopies: 5 },
      { isbn: '978-0-13-608825-4', title: 'Physics', author: 'James S. Walker', category: 'Science', totalCopies: 6, availableCopies: 4 },
      { isbn: '978-0-13-506507-4', title: 'Chemistry', author: 'Nivaldo J. Tro', category: 'Science', totalCopies: 7, availableCopies: 3 },
      { isbn: '978-0-13-139212-7', title: 'Biology', author: 'Neil A. Campbell', category: 'Science', totalCopies: 5, availableCopies: 2 },
      { isbn: '978-0-13-274710-9', title: 'Computer Science', author: 'J. Glenn Brookshear', category: 'Technology', totalCopies: 4, availableCopies: 1 },
    ]

    for (const book of books) {
      await prisma.book.upsert({
        where: { isbn: book.isbn },
        update: book,
        create: {
          ...book,
          publicationYear: Math.floor(Math.random() * 20) + 2000,
          language: 'English',
        },
      })
    }
    console.log('Library books seeded')

    // 2. Create Transport Vehicles
    const vehicles = [
      { vehicleNumber: 'BUS001', type: 'Bus', capacity: 40, driverName: 'John Smith', driverPhone: '+1-234-567-8901', routeNumber: 'R1', licensePlate: 'ABC-123' },
      { vehicleNumber: 'BUS002', type: 'Bus', capacity: 35, driverName: 'Mike Johnson', driverPhone: '+1-234-567-8902', routeNumber: 'R2', licensePlate: 'DEF-456' },
      { vehicleNumber: 'VAN001', type: 'Van', capacity: 12, driverName: 'Sarah Williams', driverPhone: '+1-234-567-8903', routeNumber: 'R3', licensePlate: 'GHI-789' },
      { vehicleNumber: 'VAN002', type: 'Van', capacity: 10, driverName: 'David Brown', driverPhone: '+1-234-567-8904', routeNumber: 'R4', licensePlate: 'JKL-012' },
    ]

    for (const vehicle of vehicles) {
      await prisma.vehicle.upsert({
        where: { vehicleNumber: vehicle.vehicleNumber },
        update: vehicle,
        create: {
          ...vehicle,
          model: '2023 Model',
          insuranceExpiry: new Date('2025-12-31'),
        },
      })
    }
    console.log('Transport vehicles seeded')

    // 3. Get current academic year
    const currentAcademicYear = await prisma.academicYear.findFirst({
      where: { isCurrent: true },
    })

    if (!currentAcademicYear) {
      console.log('No current academic year found, skipping attendance seeding')
      return
    }

    // 4. Get all students
    const students = await prisma.student.findMany({
      include: { grade: true, section: true },
    })

    if (students.length === 0) {
      console.log('No students found, skipping attendance seeding')
      return
    }

    // 5. Create Attendance Records for today
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    for (const student of students) {
      // Randomly determine attendance status (80% present, 15% absent, 5% late)
      const random = Math.random()
      let status: string
      if (random < 0.8) {
        status = 'Present'
      } else if (random < 0.95) {
        status = 'Absent'
      } else {
        status = 'Late'
      }

      await prisma.attendance.upsert({
        where: {
          studentId_date: {
            studentId: student.id,
            date: today,
          },
        },
        update: {
          status,
          checkInTime: status === 'Present' ? new Date(today.getTime() + 8 * 60 * 60 * 1000) : null,
          checkOutTime: status === 'Present' ? new Date(today.getTime() + 15 * 60 * 60 * 1000) : null,
        },
        create: {
          studentId: student.id,
          date: today,
          status,
          checkInTime: status === 'Present' ? new Date(today.getTime() + 8 * 60 * 60 * 1000) : null,
          checkOutTime: status === 'Present' ? new Date(today.getTime() + 15 * 60 * 60 * 1000) : null,
          markedBy: 'system',
        },
      })
    }
    console.log('Attendance records seeded for today')

    // 6. Create some teachers
    const teachers = [
      {
        firstName: 'Robert',
        lastName: 'Anderson',
        email: 'robert.anderson@school.edu',
        employeeId: 'T001',
        designation: 'Mathematics Teacher',
        department: 'Mathematics',
        qualification: 'M.Sc. Mathematics',
        specialization: 'Calculus',
        experience: 10,
        phone: '+1-234-567-8905',
        address: '123 School St, Springfield, IL',
      },
      {
        firstName: 'Emily',
        lastName: 'Thompson',
        email: 'emily.thompson@school.edu',
        employeeId: 'T002',
        designation: 'English Teacher',
        department: 'English',
        qualification: 'M.A. English',
        specialization: 'Literature',
        experience: 8,
        phone: '+1-234-567-8906',
        address: '124 School St, Springfield, IL',
      },
      {
        firstName: 'Michael',
        lastName: 'Davis',
        email: 'michael.davis@school.edu',
        employeeId: 'T003',
        designation: 'Science Teacher',
        department: 'Science',
        qualification: 'M.Sc. Physics',
        specialization: 'Physics',
        experience: 12,
        phone: '+1-234-567-8907',
        address: '125 School St, Springfield, IL',
      },
      {
        firstName: 'Jennifer',
        lastName: 'Wilson',
        email: 'jennifer.wilson@school.edu',
        employeeId: 'T004',
        designation: 'Computer Science Teacher',
        department: 'Technology',
        qualification: 'B.Sc. Computer Science',
        specialization: 'Programming',
        experience: 6,
        phone: '+1-234-567-8908',
        address: '126 School St, Springfield, IL',
      },
      {
        firstName: 'David',
        lastName: 'Martinez',
        email: 'david.martinez@school.edu',
        employeeId: 'T005',
        designation: 'History Teacher',
        department: 'Social Studies',
        qualification: 'M.A. History',
        specialization: 'World History',
        experience: 15,
        phone: '+1-234-567-8909',
        address: '127 School St, Springfield, IL',
      },
    ]

    for (const teacher of teachers) {
      // Create User for Teacher
      const user = await prisma.user.upsert({
        where: { email: teacher.email },
        update: {
          name: `${teacher.firstName} ${teacher.lastName}`,
          role: 'TEACHER',
        },
        create: {
          email: teacher.email,
          name: `${teacher.firstName} ${teacher.lastName}`,
          role: 'TEACHER',
          password: 'password123',
        },
      })

      await prisma.teacher.upsert({
        where: { userId: user.id },
        update: {
          firstName: teacher.firstName,
          lastName: teacher.lastName,
          phone: teacher.phone,
          email: teacher.email,
          address: teacher.address,
          designation: teacher.designation,
          department: teacher.department,
          qualification: teacher.qualification,
          specialization: teacher.specialization,
          experience: teacher.experience,
          joinDate: new Date('2023-08-15'),
          salary: 50000,
        },
        create: {
          userId: user.id,
          employeeId: teacher.employeeId,
          firstName: teacher.firstName,
          lastName: teacher.lastName,
          gender: 'Not Specified',
          dateOfBirth: new Date('1980-01-01'),
          phone: teacher.phone,
          email: teacher.email,
          address: teacher.address,
          designation: teacher.designation,
          department: teacher.department,
          qualification: teacher.qualification,
          specialization: teacher.specialization,
          experience: teacher.experience,
          joinDate: new Date('2023-08-15'),
          salary: 50000,
        },
      })
    }
    console.log('Teachers seeded')

    console.log('Additional data seeding completed successfully!')

  } catch (error) {
    console.error('Error seeding additional data:', error)
    throw error
  }
}

seedAdditionalData()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
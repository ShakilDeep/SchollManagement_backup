import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedTimetable() {
  try {
    console.log('Seeding timetable data...')

    // Get existing data
    const grade10 = await prisma.grade.findFirst({ where: { name: 'Grade 10' } })
    const sectionA = await prisma.section.findFirst({ 
      where: { name: 'A', gradeId: grade10?.id } 
    })
    const academicYear = await prisma.academicYear.findFirst({ 
      where: { isCurrent: true } 
    })

    // Create users first
    const teacherUsers = [
      { email: 'john.smith@school.edu', name: 'John Smith', role: 'TEACHER' as const },
      { email: 'jane.johnson@school.edu', name: 'Jane Johnson', role: 'TEACHER' as const },
      { email: 'robert.williams@school.edu', name: 'Robert Williams', role: 'TEACHER' as const },
      { email: 'emily.brown@school.edu', name: 'Emily Brown', role: 'TEACHER' as const },
      { email: 'michael.davis@school.edu', name: 'Michael Davis', role: 'TEACHER' as const }
    ]

    const teacherUserIds = []
    for (const user of teacherUsers) {
      const createdUser = await prisma.user.upsert({
        where: { email: user.email },
        update: {},
        create: {
          ...user,
          password: 'temp123',
          isActive: true
        }
      })
      teacherUserIds.push(createdUser.id)
    }

    // Create teachers with user references
    const teachers = [
      { firstName: 'John', lastName: 'Smith', userId: teacherUserIds[0], employeeId: 'EMP001', email: 'john.smith@school.edu' },
      { firstName: 'Jane', lastName: 'Johnson', userId: teacherUserIds[1], employeeId: 'EMP002', email: 'jane.johnson@school.edu' },
      { firstName: 'Robert', lastName: 'Williams', userId: teacherUserIds[2], employeeId: 'EMP003', email: 'robert.williams@school.edu' },
      { firstName: 'Emily', lastName: 'Brown', userId: teacherUserIds[3], employeeId: 'EMP004', email: 'emily.brown@school.edu' },
      { firstName: 'Michael', lastName: 'Davis', userId: teacherUserIds[4], employeeId: 'EMP005', email: 'michael.davis@school.edu' }
    ]

    for (const teacher of teachers) {
      await prisma.teacher.upsert({
        where: { employeeId: teacher.employeeId },
        update: {},
        create: {
          ...teacher,
          gender: 'Other',
          dateOfBirth: new Date('1980-01-01'),
          phone: '1234567890',
          address: '123 School St',
          designation: 'Teacher',
          joinDate: new Date('2020-01-01'),
          salary: 50000,
          status: 'Active'
        }
      })
    }

    const dbTeachers = await prisma.teacher.findMany()
    
    // Get or create subjects
    const subjects = [
      { name: 'Mathematics', code: 'MATH' },
      { name: 'Physics', code: 'PHY' },
      { name: 'Chemistry', code: 'CHEM' },
      { name: 'Biology', code: 'BIO' },
      { name: 'English', code: 'ENG' },
      { name: 'History', code: 'HIST' },
      { name: 'Computer Science', code: 'CS' },
      { name: 'Physical Education', code: 'PE' }
    ]

    for (const subject of subjects) {
      await prisma.subject.upsert({
        where: { code: subject.code },
        update: {},
        create: subject
      })
    }

    const dbSubjects = await prisma.subject.findMany()

    // Create timetable entries
    const timetableEntries = [
      // Monday
      { dayOfWeek: 'Monday', period: 1, subjectName: 'Mathematics', teacherIndex: 0, roomNumber: '101' },
      { dayOfWeek: 'Monday', period: 2, subjectName: 'Physics', teacherIndex: 1, roomNumber: 'Lab 201' },
      { dayOfWeek: 'Monday', period: 3, subjectName: 'English', teacherIndex: 2, roomNumber: '102' },
      { dayOfWeek: 'Monday', period: 4, subjectName: 'Chemistry', teacherIndex: 3, roomNumber: 'Lab 202' },
      { dayOfWeek: 'Monday', period: 5, subjectName: 'History', teacherIndex: 4, roomNumber: '103' },
      
      // Tuesday
      { dayOfWeek: 'Tuesday', period: 1, subjectName: 'Computer Science', teacherIndex: 0, roomNumber: 'Lab 301' },
      { dayOfWeek: 'Tuesday', period: 2, subjectName: 'Mathematics', teacherIndex: 1, roomNumber: '101' },
      { dayOfWeek: 'Tuesday', period: 3, subjectName: 'Biology', teacherIndex: 2, roomNumber: 'Lab 203' },
      { dayOfWeek: 'Tuesday', period: 4, subjectName: 'English', teacherIndex: 3, roomNumber: '102' },
      { dayOfWeek: 'Tuesday', period: 5, subjectName: 'Physical Education', teacherIndex: 4, roomNumber: 'Gym' },
      
      // Wednesday
      { dayOfWeek: 'Wednesday', period: 1, subjectName: 'Physics', teacherIndex: 0, roomNumber: 'Lab 201' },
      { dayOfWeek: 'Wednesday', period: 2, subjectName: 'Chemistry', teacherIndex: 1, roomNumber: 'Lab 202' },
      { dayOfWeek: 'Wednesday', period: 3, subjectName: 'Mathematics', teacherIndex: 2, roomNumber: '101' },
      { dayOfWeek: 'Wednesday', period: 4, subjectName: 'History', teacherIndex: 3, roomNumber: '103' },
      { dayOfWeek: 'Wednesday', period: 5, subjectName: 'Computer Science', teacherIndex: 4, roomNumber: 'Lab 301' },
      
      // Thursday
      { dayOfWeek: 'Thursday', period: 1, subjectName: 'English', teacherIndex: 0, roomNumber: '102' },
      { dayOfWeek: 'Thursday', period: 2, subjectName: 'Biology', teacherIndex: 1, roomNumber: 'Lab 203' },
      { dayOfWeek: 'Thursday', period: 3, subjectName: 'Physical Education', teacherIndex: 2, roomNumber: 'Gym' },
      { dayOfWeek: 'Thursday', period: 4, subjectName: 'Mathematics', teacherIndex: 3, roomNumber: '101' },
      { dayOfWeek: 'Thursday', period: 5, subjectName: 'Physics', teacherIndex: 4, roomNumber: 'Lab 201' },
      
      // Friday
      { dayOfWeek: 'Friday', period: 1, subjectName: 'Chemistry', teacherIndex: 0, roomNumber: 'Lab 202' },
      { dayOfWeek: 'Friday', period: 2, subjectName: 'History', teacherIndex: 1, roomNumber: '103' },
      { dayOfWeek: 'Friday', period: 3, subjectName: 'Computer Science', teacherIndex: 2, roomNumber: 'Lab 301' },
      { dayOfWeek: 'Friday', period: 4, subjectName: 'English', teacherIndex: 3, roomNumber: '102' },
      { dayOfWeek: 'Friday', period: 5, subjectName: 'Biology', teacherIndex: 4, roomNumber: 'Lab 203' }
    ]

    // Clear existing timetable entries for this section
    await prisma.timetable.deleteMany({
      where: {
        sectionId: sectionA?.id,
        academicYearId: academicYear?.id
      }
    })

    // Add new timetable entries
    for (const entry of timetableEntries) {
      const subject = dbSubjects.find(s => s.name === entry.subjectName)
      const teacher = dbTeachers[entry.teacherIndex]
      
      if (subject && teacher && sectionA && academicYear) {
        await prisma.timetable.create({
          data: {
            dayOfWeek: entry.dayOfWeek,
            period: entry.period,
            subjectId: subject.id,
            teacherId: teacher.id,
            sectionId: sectionA.id,
            academicYearId: academicYear.id,
            roomNumber: entry.roomNumber
          }
        })
      }
    }

    console.log('Timetable data seeded successfully!')
  } catch (error) {
    console.error('Error seeding timetable:', error)
  } finally {
    await prisma.$disconnect()
  }
}

seedTimetable()
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedBaseData() {
  console.log('🌱 Seeding base data...')

  try {
    // 1. Create Academic Year
    let academicYear = await prisma.academicYear.findFirst({
      where: { name: '2024-2025' }
    })

    if (!academicYear) {
      academicYear = await prisma.academicYear.create({
        data: {
          name: '2024-2025',
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-12-31'),
          isCurrent: true,
        },
      })
      console.log('✅ Created Academic Year:', academicYear.name)
    } else {
      await prisma.academicYear.update({
        where: { id: academicYear.id },
        data: { isCurrent: true }
      })
      console.log('✅ Updated Academic Year:', academicYear.name)
    }

    // 2. Create Grades and Sections
    const gradesData = [
      { name: 'Grade 9', value: 9 },
      { name: 'Grade 10', value: 10 },
      { name: 'Grade 11', value: 11 },
      { name: 'Grade 12', value: 12 },
    ]

    const gradesMap = new Map()
    const sectionsMap = new Map()

    for (const g of gradesData) {
      let grade = await prisma.grade.findFirst({
        where: { name: g.name, sectionId: null }
      })

      if (!grade) {
        grade = await prisma.grade.create({
          data: {
            name: g.name,
            numericValue: g.value,
            order: g.value,
          },
        })
      }
      gradesMap.set(g.name, grade.id)

      // Create Sections A, B, C for each grade
      for (const s of ['A', 'B', 'C']) {
        let section = await prisma.section.findFirst({
          where: { gradeId: grade.id, name: s }
        })

        if (!section) {
          section = await prisma.section.create({
            data: {
              name: s,
              gradeId: grade.id,
            },
          })
        }
        sectionsMap.set(`${g.name}-${s}`, section.id)
      }
    }
    console.log('✅ Created Grades and Sections')

    // 3. Create Subjects
    const subjectsData = [
      { name: 'Mathematics', code: 'MATH', description: 'Mathematics' },
      { name: 'Physics', code: 'PHY', description: 'Physics' },
      { name: 'Chemistry', code: 'CHEM', description: 'Chemistry' },
      { name: 'Biology', code: 'BIO', description: 'Biology' },
      { name: 'English', code: 'ENG', description: 'English' },
      { name: 'Computer Science', code: 'CS', description: 'Computer Science' },
      { name: 'History', code: 'HIST', description: 'History' },
      { name: 'Geography', code: 'GEO', description: 'Geography' },
    ]

    for (const subject of subjectsData) {
      let existingSubject = await prisma.subject.findUnique({
        where: { code: subject.code }
      })

      if (!existingSubject) {
        await prisma.subject.create({
          data: {
            name: subject.name,
            code: subject.code,
            description: subject.description,
          },
        })
      }
    }
    console.log('✅ Created Subjects')

    // 4. Create Admin User
    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@school.edu' },
      update: {},
      create: {
        email: 'admin@school.edu',
        name: 'Admin User',
        role: 'ADMIN',
        password: 'password123',
      },
    })
    console.log('✅ Created Admin User')

    // 5. Create Teachers
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
    console.log('✅ Created Teachers')

    // 6. Create Students with Parents
    const studentsData = [
      { name: 'John Smith', email: 'john.smith@school.edu', rollNumber: 'STU001', grade: 'Grade 9', section: 'A', guardian: 'Robert Smith', phone: '+1-555-0101', address: '123 Main St, Springfield', admissionDate: '2024-08-15', status: 'Active' },
      { name: 'Emma Johnson', email: 'emma.johnson@school.edu', rollNumber: 'STU002', grade: 'Grade 9', section: 'B', guardian: 'Mary Johnson', phone: '+1-555-0102', address: '456 Oak Ave, Springfield', admissionDate: '2024-08-15', status: 'Active' },
      { name: 'Michael Brown', email: 'michael.brown@school.edu', rollNumber: 'STU003', grade: 'Grade 10', section: 'A', guardian: 'James Brown', phone: '+1-555-0103', address: '789 Pine Rd, Springfield', admissionDate: '2024-08-15', status: 'Active' },
      { name: 'Sophia Davis', email: 'sophia.davis@school.edu', rollNumber: 'STU004', grade: 'Grade 10', section: 'B', guardian: 'William Davis', phone: '+1-555-0104', address: '321 Elm St, Springfield', admissionDate: '2024-08-15', status: 'Active' },
      { name: 'William Wilson', email: 'william.wilson@school.edu', rollNumber: 'STU005', grade: 'Grade 11', section: 'A', guardian: 'Charles Wilson', phone: '+1-555-0105', address: '654 Maple Dr, Springfield', admissionDate: '2024-08-15', status: 'Active' },
      { name: 'Olivia Martinez', email: 'olivia.martinez@school.edu', rollNumber: 'STU006', grade: 'Grade 11', section: 'B', guardian: 'Carlos Martinez', phone: '+1-555-0106', address: '987 Cedar Ln, Springfield', admissionDate: '2024-08-15', status: 'Active' },
      { name: 'James Taylor', email: 'james.taylor@school.edu', rollNumber: 'STU007', grade: 'Grade 12', section: 'A', guardian: 'Richard Taylor', phone: '+1-555-0107', address: '147 Birch Blvd, Springfield', admissionDate: '2024-08-15', status: 'Active' },
      { name: 'Isabella Anderson', email: 'isabella.anderson@school.edu', rollNumber: 'STU008', grade: 'Grade 12', section: 'B', guardian: 'Thomas Anderson', phone: '+1-555-0108', address: '258 Spruce Way, Springfield', admissionDate: '2024-08-15', status: 'Active' },
    ]

    for (const s of studentsData) {
      const user = await prisma.user.upsert({
        where: { email: s.email },
        update: {},
        create: {
          email: s.email,
          name: s.name,
          role: 'STUDENT',
          password: 'password123',
        },
      })

      const parentEmail = `parent.${s.email}`
      let parentUser = await prisma.user.findUnique({ where: { email: parentEmail } })
      if (!parentUser) {
        parentUser = await prisma.user.create({
          data: {
            email: parentEmail,
            name: s.guardian,
            role: 'PARENT',
            password: 'password123',
          },
        })
      }

      let parent = await prisma.parent.findUnique({ where: { userId: parentUser.id } })
      if (!parent) {
        parent = await prisma.parent.create({
          data: {
            userId: parentUser.id,
            firstName: s.guardian.split(' ')[0],
            lastName: s.guardian.split(' ').slice(1).join(' '),
            phone: s.phone,
          },
        })
      }

      const gradeId = gradesMap.get(s.grade)
      const sectionId = sectionsMap.get(`${s.grade}-${s.section}`)

      if (gradeId && sectionId) {
        await prisma.student.upsert({
          where: { rollNumber: s.rollNumber },
          update: {},
          create: {
            userId: user.id,
            rollNumber: s.rollNumber,
            admissionNumber: `ADM-${s.rollNumber}`,
            firstName: s.name.split(' ')[0],
            lastName: s.name.split(' ').slice(1).join(' '),
            gender: 'Not Specified',
            dateOfBirth: new Date('2008-01-01'),
            phone: s.phone,
            email: s.email,
            address: s.address,
            city: 'Springfield',
            state: 'IL',
            zipCode: '62704',
            emergencyContact: s.guardian,
            emergencyPhone: s.phone,
            gradeId: gradeId,
            sectionId: sectionId,
            academicYearId: academicYear.id,
            guardianId: parent.id,
            relationship: 'Parent',
            admissionDate: new Date(s.admissionDate),
            status: s.status,
          },
        })
      }
    }
    console.log('✅ Created Students')

    console.log('🎉 Base data seeding completed successfully!')

  } catch (error) {
    console.error('❌ Error seeding base data:', error)
    throw error
  }
}

seedBaseData()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

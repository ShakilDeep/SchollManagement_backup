
import { PrismaClient } from '@prisma/client'
import { students as mockStudents } from '../src/lib/mock-data'

const prisma = new PrismaClient()

async function main() {
  console.log('Start seeding...')

  // 1. Create Academic Year
  const academicYear = await prisma.academicYear.create({
    data: {
      name: '2024-2025',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
      isCurrent: true,
    },
  })
  console.log('Created Academic Year:', academicYear.id)

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
    const grade = await prisma.grade.create({
      data: {
        name: g.name,
        numericValue: g.value,
        order: g.value,
      },
    })
    gradesMap.set(g.name, grade.id)

    // Create Sections A, B, C for each grade
    for (const s of ['A', 'B', 'C']) {
      const section = await prisma.section.create({
        data: {
          name: s,
          gradeId: grade.id,
        },
      })
      sectionsMap.set(`${g.name}-${s}`, section.id)
    }
  }
  console.log('Created Grades and Sections')

  // 3. Create mock students
  for (const s of mockStudents) {
    // Create User for Student
    const user = await prisma.user.create({
      data: {
        email: s.email,
        name: s.name,
        role: 'STUDENT',
        password: 'password123', // Dummy password
      },
    })

    // Create Parent User and Parent Profile
    // Using a dummy email for parent based on student email
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
          phone: s.phone, // Reusing student phone for simplicity in mock
        },
      })
    }

    // Resolve Grade and Section IDs
    const gradeId = gradesMap.get(s.grade)
    const sectionId = sectionsMap.get(`${s.grade}-${s.section}`)

    if (gradeId && sectionId) {
      await prisma.student.create({
        data: {
          userId: user.id,
          rollNumber: s.rollNumber,
          admissionNumber: `ADM-${s.rollNumber}`,
          firstName: s.name.split(' ')[0],
          lastName: s.name.split(' ').slice(1).join(' '),
          gender: 'Not Specified', // Mock data doesn't have gender
          dateOfBirth: new Date('2008-01-01'), // Dummy DOB
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
          photo: s.avatar, // Storing avatar initials or URL
        },
      })
    }
  }

  console.log('Seeding finished.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

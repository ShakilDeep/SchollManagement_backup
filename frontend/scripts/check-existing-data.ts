import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkExistingData() {
  console.log('=== Checking Existing Data ===\n')

  const teachers = await prisma.teacher.findMany({
    include: {
      user: true
    }
  })
  console.log(`Teachers found: ${teachers.length}`)
  teachers.forEach(t => console.log(`  - ${t.user?.name || t.firstName} ${t.lastName} (${t.designation})`))

  const subjects = await prisma.subject.findMany()
  console.log(`\nSubjects found: ${subjects.length}`)
  subjects.forEach(s => console.log(`  - ${s.name} (${s.code})`))

  const grades = await prisma.grade.findMany()
  console.log(`\nGrades found: ${grades.length}`)
  grades.forEach(g => console.log(`  - ${g.name}`))

  const academicYears = await prisma.academicYear.findMany()
  console.log(`\nAcademic Years found: ${academicYears.length}`)
  academicYears.forEach(ay => console.log(`  - ${ay.name} (Current: ${ay.isCurrent})`))

  await prisma.$disconnect()
}

checkExistingData().catch(console.error)

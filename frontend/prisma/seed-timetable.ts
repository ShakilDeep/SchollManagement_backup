import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface SubjectData {
  name: string
  code: string
  description: string
  color: string
}

const subjects: SubjectData[] = [
  { name: 'Mathematics', code: 'MATH', description: 'Advanced mathematics including algebra, geometry, and calculus', color: '#3B82F6' },
  { name: 'English', code: 'ENG', description: 'English language and literature', color: '#10B981' },
  { name: 'Physics', code: 'PHY', description: 'Classical and modern physics', color: '#EF4444' },
  { name: 'Chemistry', code: 'CHEM', description: 'Organic and inorganic chemistry', color: '#F59E0B' },
  { name: 'Biology', code: 'BIO', description: 'Life sciences and human biology', color: '#8B5CF6' },
  { name: 'Computer Science', code: 'CS', description: 'Programming, algorithms, and computer systems', color: '#06B6D4' },
  { name: 'History', code: 'HIST', description: 'World and national history', color: '#EC4899' },
  { name: 'Geography', code: 'GEOG', description: 'Physical and human geography', color: '#14B8A6' },
  { name: 'Economics', code: 'ECON', description: 'Micro and macro economics', color: '#F97316' },
  { name: 'Physical Education', code: 'PE', description: 'Sports and physical fitness', color: '#84CC16' },
  { name: 'Art', code: 'ART', description: 'Visual arts and creative expression', color: '#A855F7' },
  { name: 'Music', code: 'MUSIC', description: 'Music theory and performance', color: '#6366F1' }
]

const daysOfWeek = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY']
const periods = [1, 2, 3, 4, 5, 6, 7, 8]
const roomNumbers = Array.from({ length: 30 }, (_, i) => (i + 1).toString())

interface TeacherAssignment {
  subjectId: string
  teacherId: string
}

async function seedTimetables() {
  console.log('Starting timetable seeding...')

  const academicYear = await prisma.academicYear.findFirst({
    orderBy: { startDate: 'desc' }
  })

  if (!academicYear) {
    console.error('No academic year found')
    return
  }

  const existingSubjects = await prisma.subject.findMany()
  const createdSubjects: any[] = []

  for (const subject of subjects) {
    const existingSubject = existingSubjects.find(s => s.code === subject.code)
    if (existingSubject) {
      createdSubjects.push(existingSubject)
    } else {
      const createdSubject = await prisma.subject.create({
        data: subject
      })
      createdSubjects.push(createdSubject)
    }
  }

  console.log(`Created ${createdSubjects.length} subjects`)

  const teachers = await prisma.teacher.findMany({
    include: {
      user: true
    }
  })

  if (teachers.length === 0) {
    console.error('No teachers found. Please seed teachers first.')
    return
  }

  const teacherAssignments: TeacherAssignment[] = []
  const subjectsPerTeacher = Math.ceil(createdSubjects.length / teachers.length)

  createdSubjects.forEach((subject, index) => {
    const teacherIndex = Math.floor(index / subjectsPerTeacher)
    const teacher = teachers[teacherIndex % teachers.length]
    teacherAssignments.push({
      subjectId: subject.id,
      teacherId: teacher.id
    })
  })

  const sections = await prisma.section.findMany({
    include: {
      grade: true
    }
  })

  if (sections.length === 0) {
    console.error('No sections found. Please seed grades and sections first.')
    return
  }

  let timetablesCreated = 0
  let conflictsDetected = 0

  for (const section of sections) {
    const sectionAssignments = new Map<string, string>()

    for (const day of daysOfWeek) {
      const shuffledSubjects = [...createdSubjects].sort(() => Math.random() - 0.5)

      for (const period of periods) {
        const subjectIndex = (period - 1) % shuffledSubjects.length
        const subject = shuffledSubjects[subjectIndex]

        const assignment = teacherAssignments.find(a => a.subjectId === subject.id)
        if (!assignment) continue

        const existingTimetable = await prisma.timetable.findFirst({
          where: {
            sectionId: section.id,
            dayOfWeek: day,
            period: period
          }
        })

        if (existingTimetable) {
          conflictsDetected++
          continue
        }

        try {
          const roomNumber = roomNumbers[Math.floor(Math.random() * roomNumbers.length)]

          await prisma.timetable.create({
            data: {
              sectionId: section.id,
              dayOfWeek: day,
              period: period,
              subjectId: subject.id,
              teacherId: assignment.teacherId,
              roomNumber: roomNumber,
              academicYearId: academicYear.id
            }
          })

          timetablesCreated++

          const currentSubjectCount = sectionAssignments.get(subject.name) || '0'
          sectionAssignments.set(subject.name, (parseInt(currentSubjectCount) + 1).toString())
        } catch (error) {
          console.error(`Error creating timetable for section ${section.name} grade ${section.grade.name}:`, error)
        }
      }
    }
  }

  console.log(`Created ${timetablesCreated} timetable entries`)
  console.log(`Detected and skipped ${conflictsDetected} conflicts`)
  console.log('Timetable seeding completed successfully!')
}

seedTimetables()
  .catch((error) => {
    console.error('Error seeding timetables:', error)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

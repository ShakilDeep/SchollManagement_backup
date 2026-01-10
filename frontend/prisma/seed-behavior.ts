import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting behavior records seeding...')

  const academicYear = await prisma.academicYear.findFirst({
    where: { isCurrent: true },
  })

  if (!academicYear) {
    console.error('No active academic year found')
    process.exit(1)
  }

  const students = await prisma.student.findMany({
    include: { grade: true, section: true },
    take: 20,
  })

  const staff = await prisma.user.findMany({
    where: { role: { in: ['ADMIN', 'TEACHER', 'STAFF'] } },
    take: 5,
  })

  if (students.length === 0 || staff.length === 0) {
    console.error('No students or staff found')
    process.exit(1)
  }

  const behaviorTypes = ['POSITIVE', 'NEGATIVE']
  const categories = {
    POSITIVE: ['Academic Excellence', 'Leadership', 'Community Service', 'Sportsmanship', 'Creativity'],
    NEGATIVE: ['Discipline', 'Attendance', 'Academic', 'Behavior', 'Homework'],
  }

  const descriptions = {
    'Academic Excellence': [
      'Achieved highest score in mathematics test',
      'Completed all assignments ahead of schedule',
      'Demonstrated exceptional understanding of complex concepts',
    ],
    Leadership: [
      'Led group project successfully',
      'Helped organize school event',
      'Mentored younger students',
    ],
    'Community Service': [
      'Participated in community cleanup',
      'Volunteered at local charity',
      'Organized donation drive',
    ],
    Sportsmanship: [
      'Showed exceptional teamwork',
      'Demonstrated fair play in competition',
      'Encouraged teammates during difficult match',
    ],
    Creativity: [
      'Created outstanding art project',
      'Innovative solution to class problem',
      'Original presentation ideas',
    ],
    Discipline: [
      'Repeated late arrival to class',
      'Disruptive behavior during lesson',
      'Failed to follow school rules',
    ],
    Attendance: [
      'Unexcused absence from class',
      'Multiple tardies this week',
      'Left class without permission',
    ],
    Academic: [
      'Failed to submit homework',
      'Poor performance on recent test',
      'Lack of participation in class activities',
    ],
    Behavior: [
      'Inappropriate language',
      'Conflict with another student',
      'Failure to follow instructions',
    ],
    Homework: [
      'Missing multiple assignments',
      'Incomplete homework submissions',
      'Poor quality of completed work',
    ],
  }

  const actions = {
    POSITIVE: [
      'Certificate awarded',
      'Points added to student record',
      'Recognition in school assembly',
    ],
    NEGATIVE: [
      'Warning issued',
      'Parents notified',
      'Detention assigned',
      'Counseling session scheduled',
    ],
  }

  let recordsCreated = 0

  for (const student of students) {
    const numRecords = Math.floor(Math.random() * 3) + 1

    for (let i = 0; i < numRecords; i++) {
      const type = behaviorTypes[Math.floor(Math.random() * behaviorTypes.length)]
      const category = categories[type as keyof typeof categories][
        Math.floor(Math.random() * categories[type as keyof typeof categories].length)
      ]
      const possibleDescriptions = descriptions[category as keyof typeof descriptions]
      const description =
        possibleDescriptions[Math.floor(Math.random() * possibleDescriptions.length)]
      const points = type === 'POSITIVE' ? Math.floor(Math.random() * 10) + 1 : -(Math.floor(Math.random() * 10) + 1)
      const reportedBy = staff[Math.floor(Math.random() * staff.length)].id
      const possibleActions = actions[type as keyof typeof actions]
      const actionTaken = possibleActions[Math.floor(Math.random() * possibleActions.length)]
      const parentNotified = type === 'NEGATIVE' ? Math.random() > 0.5 : false
      const date = new Date(
        academicYear.startDate.getTime() +
          Math.random() * (new Date().getTime() - academicYear.startDate.getTime()),
      )

      try {
        await prisma.behaviorRecord.create({
          data: {
            studentId: student.id,
            date,
            type,
            category,
            description,
            points,
            reportedBy,
            actionTaken,
            parentNotified,
          },
        })
        recordsCreated++
      } catch (error) {
        console.error(`Error creating behavior record for student ${student.id}:`, error)
      }
    }
  }

  console.log(`Successfully created ${recordsCreated} behavior records`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

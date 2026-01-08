import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedCurriculum() {
  console.log('=== Seeding Curriculum Data ===\n')

  const teachers = await prisma.teacher.findMany({ include: { user: true } })
  const subjects = await prisma.subject.findMany()
  const grades = await prisma.grade.findMany()
  const academicYears = await prisma.academicYear.findMany({ where: { isCurrent: true } })

  const currentYear = academicYears[0]

  if (!currentYear) {
    console.error('No current academic year found!')
    return
  }

  const curriculums = [
    {
      name: 'Algebra Fundamentals',
      subjectId: subjects.find(s => s.code === 'MATH')!.id,
      gradeId: grades.filter(g => g.name === 'Grade 9')[0].id,
      academicYearId: currentYear.id,
      description: 'Comprehensive algebra curriculum covering linear equations, quadratic functions, and inequalities',
      objectives: JSON.stringify([
        'Master solving linear equations and inequalities',
        'Understand graphing linear functions',
        'Apply quadratic formulas to real-world problems',
        'Develop problem-solving and critical thinking skills'
      ]),
      topics: JSON.stringify([
        'Linear Equations',
        'Quadratic Functions',
        'Inequalities',
        'Polynomials',
        'Factoring'
      ])
    },
    {
      name: 'Advanced Physics',
      subjectId: subjects.find(s => s.code === 'PHY')!.id,
      gradeId: grades.filter(g => g.name === 'Grade 11')[0].id,
      academicYearId: currentYear.id,
      description: 'In-depth study of mechanics, thermodynamics, and electromagnetism',
      objectives: JSON.stringify([
        'Apply Newton\'s laws of motion',
        'Understand energy conservation principles',
        'Analyze electric and magnetic fields',
        'Conduct laboratory experiments safely'
      ]),
      topics: JSON.stringify([
        'Kinematics',
        'Dynamics',
        'Energy and Work',
        'Electromagnetism',
        'Thermodynamics'
      ])
    },
    {
      name: 'English Literature',
      subjectId: subjects.find(s => s.code === 'ENG')!.id,
      gradeId: grades.filter(g => g.name === 'Grade 10')[0].id,
      academicYearId: currentYear.id,
      description: 'Exploration of classical and contemporary literary works with emphasis on critical analysis',
      objectives: JSON.stringify([
        'Analyze themes in literary works',
        'Develop essay writing skills',
        'Understand literary devices and techniques',
        'Enhance vocabulary and comprehension'
      ]),
      topics: JSON.stringify([
        'Poetry Analysis',
        'Shakespearean Drama',
        'Modern Novel',
        'Essay Writing',
        'Creative Writing'
      ])
    },
    {
      name: 'Chemistry Essentials',
      subjectId: subjects.find(s => s.code === 'CHEM')!.id,
      gradeId: grades.filter(g => g.name === 'Grade 12')[0].id,
      academicYearId: currentYear.id,
      description: 'Organic and inorganic chemistry with laboratory components',
      objectives: JSON.stringify([
        'Understand atomic structure and bonding',
        'Master stoichiometry calculations',
        'Conduct safe laboratory procedures',
        'Apply chemistry principles to everyday life'
      ]),
      topics: JSON.stringify([
        'Atomic Structure',
        'Chemical Bonding',
        'Organic Chemistry',
        'Acids and Bases',
        'Redox Reactions'
      ])
    },
    {
      name: 'Computer Science Fundamentals',
      subjectId: subjects.find(s => s.code === 'CS')!.id,
      gradeId: grades.filter(g => g.name === 'Grade 9')[0].id,
      academicYearId: currentYear.id,
      description: 'Introduction to programming concepts, algorithms, and data structures',
      objectives: JSON.stringify([
        'Understand programming fundamentals',
        'Write basic algorithms',
        'Learn data structure concepts',
        'Develop problem-solving skills through coding'
      ]),
      topics: JSON.stringify([
        'Variables and Data Types',
        'Control Structures',
        'Functions',
        'Arrays and Lists',
        'Basic Algorithms'
      ])
    },
    {
      name: 'World History',
      subjectId: subjects.find(s => s.code === 'HIST')!.id,
      gradeId: grades.filter(g => g.name === 'Grade 11')[0].id,
      academicYearId: currentYear.id,
      description: 'Survey of major world civilizations and historical events from ancient to modern times',
      objectives: JSON.stringify([
        'Analyze historical cause and effect',
        'Understand cultural and political developments',
        'Compare different civilizations',
        'Develop historical research skills'
      ]),
      topics: JSON.stringify([
        'Ancient Civilizations',
        'Medieval Period',
        'Renaissance',
        'Industrial Revolution',
        'Modern Era'
      ])
    }
  ]

  for (const curriculumData of curriculums) {
    const curriculum = await prisma.curriculum.create({
      data: curriculumData
    })
    console.log(`Created curriculum: ${curriculum.name}`)

    const teacher = teachers[Math.floor(Math.random() * teachers.length)]
    const grade = grades.find(g => g.id === curriculumData.gradeId)
    const subject = subjects.find(s => s.id === curriculumData.subjectId)

    const lessonTitles = [
      'Introduction to Course',
      'Key Concepts Overview',
      'Practical Applications',
      'Problem-Solving Workshop',
      'Assessment Preparation',
      'Review and Reflection'
    ]

    const statuses = ['Planned', 'Completed', 'Completed', 'Planned', 'Planned', 'Completed']
    const durations = [45, 60, 90, 45, 60, 75]

    for (let i = 0; i < lessonTitles.length; i++) {
      const lessonDate = new Date()
      lessonDate.setDate(lessonDate.getDate() + (i * 7))

      await prisma.lesson.create({
        data: {
          curriculumId: curriculum.id,
          subjectId: subject!.id,
          gradeId: grade!.id,
          teacherId: teacher.id,
          title: lessonTitles[i],
          content: `Comprehensive lesson covering ${lessonTitles[i].toLowerCase()} with interactive activities, group discussions, and individual practice exercises.`,
          resources: JSON.stringify([
            'Textbook Chapter ' + (i + 1),
            'Presentation Slides',
            'Practice Worksheets',
            'Video Tutorials'
          ]),
          date: lessonDate,
          duration: durations[i],
          status: statuses[i]
        }
      })
      console.log(`  - Created lesson: ${lessonTitles[i]}`)
    }
  }

  console.log('\n=== Curriculum Seeding Complete ===')
  await prisma.$disconnect()
}

seedCurriculum().catch(console.error)

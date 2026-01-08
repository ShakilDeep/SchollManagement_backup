import { PrismaClient } from '@prisma/client'
import { faker } from '@faker-js/faker'

const prisma = new PrismaClient()

function calculateGrade(percentage: number): string {
  if (percentage >= 90) return 'A+'
  if (percentage >= 80) return 'A'
  if (percentage >= 70) return 'B+'
  if (percentage >= 60) return 'B'
  if (percentage >= 50) return 'C+'
  if (percentage >= 40) return 'C'
  return 'F'
}

function calculateGradePoints(grade: string): number {
  const gradePoints: Record<string, number> = {
    'A+': 4.0,
    'A': 4.0,
    'B+': 3.5,
    'B': 3.0,
    'C+': 2.5,
    'C': 2.0,
    'F': 0.0
  }
  return gradePoints[grade] || 0.0
}

async function seedExams() {
  try {
    console.log('🎓 Seeding exams data...')

    // Get existing data
    const students = await prisma.student.findMany({
      include: {
        grade: true,
        section: true
      }
    })

    const subjects = await prisma.subject.findMany()
    const academicYear = await prisma.academicYear.findFirst({
      where: { isCurrent: true }
    })

    if (!academicYear) {
      throw new Error('No current academic year found. Please seed academic year first.')
    }

    if (students.length === 0) {
      throw new Error('No students found. Please seed students first.')
    }

    if (subjects.length === 0) {
      throw new Error('No subjects found. Please seed subjects first.')
    }

    console.log(`Found ${students.length} students, ${subjects.length} subjects`)

    // Create exams for different types
    const examTypes = [
      { name: 'Midterm Examination', type: 'Midterm', month: 3 },
      { name: 'Final Examination', type: 'Final', month: 6 },
      { name: 'Unit Test 1', type: 'Unit Test', month: 2 },
      { name: 'Unit Test 2', type: 'Unit Test', month: 4 },
      { name: 'Unit Test 3', type: 'Unit Test', month: 8 }
    ]

    const currentYear = new Date().getFullYear()
    const createdExams = []

    for (const examType of examTypes) {
      // Create exam for current academic year
      const exam = await prisma.exam.create({
        data: {
          name: examType.name,
          type: examType.type,
          academicYearId: academicYear.id,
          startDate: new Date(currentYear, examType.month - 1, 1),
          endDate: new Date(currentYear, examType.month - 1, 15),
          status: examType.month < new Date().getMonth() ? 'Completed' : 
                  examType.month === new Date().getMonth() ? 'Ongoing' : 'Upcoming'
        }
      })
      createdExams.push(exam)

      // Create exam papers for each subject and grade
      for (const subject of subjects) {
        // Get unique grades from students
        const grades = [...new Set(students.map(s => s.grade))]
        
        for (const grade of grades) {
          const examPaper = await prisma.examPaper.create({
            data: {
              examId: exam.id,
              subjectId: subject.id,
              gradeId: grade.id,
              totalMarks: 100,
              passingMarks: 40,
              duration: 120, // 2 hours
              examDate: new Date(currentYear, examType.month - 1, 
                                Math.floor(Math.random() * 10) + 5), // Random day 5-15
              startTime: new Date(currentYear, examType.month - 1, 
                                 Math.floor(Math.random() * 10) + 5, 9, 0), // 9 AM
              endTime: new Date(currentYear, examType.month - 1, 
                               Math.floor(Math.random() * 10) + 5, 11, 0) // 11 AM
            }
          })

          // Create exam results for students in this grade
          const gradeStudents = students.filter(s => s.gradeId === grade.id)
          
          for (const student of gradeStudents) {
            // Generate realistic marks with some variation
            const baseMarks = Math.random() * 40 + 50 // 50-90 base range
            const variation = (Math.random() - 0.5) * 20 // ±10 variation
            const marksObtained = Math.max(0, Math.min(100, baseMarks + variation))
            const percentage = (marksObtained / 100) * 100
            const grade = calculateGrade(percentage)

            await prisma.examResult.create({
              data: {
                studentId: student.id,
                examPaperId: examPaper.id,
                marksObtained,
                percentage,
                grade,
                remarks: marksObtained >= 90 ? 'Excellent performance' :
                        marksObtained >= 70 ? 'Good performance' :
                        marksObtained >= 50 ? 'Satisfactory performance' :
                        marksObtained >= 40 ? 'Needs improvement' : 'Poor performance'
              }
            })
          }
        }
      }

      console.log(`✅ Created ${examType.name} with exam papers and results`)
    }

    // Calculate ranks for each exam paper
    console.log('📊 Calculating student ranks...')

    for (const exam of createdExams) {
      const examPapers = await prisma.examPaper.findMany({
        where: { examId: exam.id },
        include: {
          results: {
            include: {
              student: true
            }
          }
        }
      })

      for (const examPaper of examPapers) {
        // Sort results by percentage descending
        const sortedResults = examPaper.results.sort((a, b) => b.percentage - a.percentage)
        
        // Update ranks
        for (let i = 0; i < sortedResults.length; i++) {
          await prisma.examResult.update({
            where: { id: sortedResults[i].id },
            data: { rank: i + 1 }
          })
        }
      }
    }

    console.log('🎯 Exam seeding completed successfully!')
    console.log(`📈 Created ${createdExams.length} exams with papers and results`)

  } catch (error) {
    console.error('❌ Error seeding exams:', error)
    throw error
  }
}

async function main() {
  try {
    await seedExams()
  } catch (error) {
    console.error(error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
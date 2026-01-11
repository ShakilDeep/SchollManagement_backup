import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export async function generateAIResponse(messages: ChatMessage[]): Promise<string> {
  const lastMessage = messages[messages.length - 1]
  const query = lastMessage.content.toLowerCase()

  try {
    const [
      students,
      teachers,
      attendanceToday,
      attendanceWeek,
      examResults,
      grades,
      courses
    ] = await Promise.all([
      prisma.student.findMany({
        where: { status: 'Active' },
        include: { grade: true }
      }),
      prisma.teacher.findMany({
        where: { status: 'Active' },
        include: {
          courses: true
        }
      }),
      prisma.attendance.findMany({
        where: {
          date: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lt: new Date(new Date().setHours(23, 59, 59, 999))
          }
        },
        include: { student: true }
      }),
      prisma.attendance.findMany({
        where: {
          date: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      }),
      prisma.examResult.findMany({
        include: {
          examPaper: { include: { subject: true } },
          student: { include: { grade: true } }
        }
      }),
      prisma.grade.findMany({
        include: {
          _count: {
            select: { students: { where: { status: 'Active' } } }
          }
        }
      }),
      prisma.course.findMany({
        where: { isPublished: true }
      })
    ])

    const studentAttendance = new Map<string, { present: number; total: number }>()
    attendanceWeek.forEach(a => {
      const studentId = a.studentId
      if (!studentAttendance.has(studentId)) {
        studentAttendance.set(studentId, { present: 0, total: 0 })
      }
      studentAttendance.get(studentId)!.total++
      if (a.status === 'Present') {
        studentAttendance.get(studentId)!.present++
      }
    })

    const atRiskStudents = Array.from(studentAttendance.entries())
      .filter(([_, stats]) => stats.total > 0 && (stats.present / stats.total) < 0.5)
      .map(([studentId, _]) => students.find(s => s.id === studentId))
      .filter(Boolean)

    if (query.includes('dropout') || query.includes('risk') || query.includes('at-risk')) {
      if (atRiskStudents.length === 0) {
        return `Based on current attendance data, all students are maintaining good attendance levels (50% or higher). No immediate dropout risks identified.`
      }

      const riskList = atRiskStudents.slice(0, 5).map(s => {
        const stats = studentAttendance.get(s?.id || '')
        const attendanceRate = stats ? ((stats.present / stats.total) * 100).toFixed(0) : '0'
        return `- ${s?.firstName} ${s?.lastName} (${s?.grade?.name}): ${attendanceRate}% attendance`
      }).join('\n')

      return `I found ${atRiskStudents.length} students at risk of dropping out based on attendance below 50%:\n\n${riskList}\n\nRecommendation: Schedule counseling sessions and engage parents to improve attendance.`
    }

    if (query.includes('attendance') && (query.includes('trend') || query.includes('week'))) {
      const weekAttendance = attendanceWeek.reduce((acc, a) => {
        if (a.status === 'Present') acc.present++
        acc.total++
        return acc
      }, { present: 0, total: 0 })

      const rate = weekAttendance.total > 0 ? (weekAttendance.present / weekAttendance.total) * 100 : 0

      return `This week's attendance trend:\n\n` +
        `- Overall attendance rate: ${rate.toFixed(1)}%\n` +
        `- Students present: ${weekAttendance.present} out of ${weekAttendance.total} records\n` +
        `- Active students: ${students.length}\n` +
        `- Present today: ${attendanceToday.filter(a => a.status === 'Present').length}\n\n` +
        (rate < 70 ? `⚠️ Attendance is below the 70% target. Consider sending reminders to parents.` : `✓ Attendance is within acceptable range.`)
    }

    if (query.includes('teacher') && (query.includes('support') || query.includes('need'))) {
      const teachersNeedingSupport = teachers
        .filter(t => t.experience && t.experience < 3)
        .slice(0, 3)

      if (teachersNeedingSupport.length === 0) {
        return `All teachers have sufficient experience. No immediate support needs identified.`
      }

      const supportList = teachersNeedingSupport.map(t => 
        `- ${t.firstName} ${t.lastName}: ${t.experience} years experience, ${t.courses.length} courses`
      ).join('\n')

      return `I identified ${teachersNeedingSupport.length} teachers who may benefit from additional support (less than 3 years experience):\n\n${supportList}\n\nRecommendation: Assign mentors and provide professional development resources.`
    }

    if (query.includes('subject') && (query.includes('performance') || query.includes('analysis'))) {
      const subjectPerformance = new Map<string, { scores: number[]; count: number }>()
      
      examResults.forEach(er => {
        const subjectName = er.examPaper.subject.name
        if (!subjectPerformance.has(subjectName)) {
          subjectPerformance.set(subjectName, { scores: [], count: 0 })
        }
        subjectPerformance.get(subjectName)!.scores.push(er.percentage || 0)
        subjectPerformance.get(subjectName)!.count++
      })

      const subjectStats = Array.from(subjectPerformance.entries()).map(([subject, data]) => ({
        subject,
        average: data.scores.reduce((sum, s) => sum + s, 0) / data.scores.length,
        count: data.count
      })).sort((a, b) => a.average - b.average)

      if (subjectStats.length === 0) {
        return `No exam results available for subject performance analysis.`
      }

      const analysis = subjectStats.map(s => 
        `- ${s.subject}: ${s.average.toFixed(1)}% average (${s.count} exams)`
      ).join('\n')

      const worstSubject = subjectStats[0]
      const bestSubject = subjectStats[subjectStats.length - 1]

      return `Subject Performance Analysis:\n\n${analysis}\n\n` +
        `🏆 Best performing: ${bestSubject.subject} (${bestSubject.average.toFixed(1)}%)\n` +
        `⚠️ Needs attention: ${worstSubject.subject} (${worstSubject.average.toFixed(1)}%)\n\n` +
        `Recommendation: Review teaching methods and provide additional resources for ${worstSubject.subject}.`
    }

    if (query.includes('student') || query.includes('total') || query.includes('count')) {
      const gradeBreakdown = grades.map(g => 
        `- ${g.name}: ${g._count.students} students`
      ).join('\n')

      return `Current student statistics:\n\n` +
        `- Total students: ${students.length}\n` +
        `- Active students: ${students.filter(s => s.status === 'Active').length}\n` +
        `- Total teachers: ${teachers.length}\n` +
        `- Active courses: ${courses.length}\n\n` +
        `Grade breakdown:\n${gradeBreakdown}`
    }

    const suggestions = [
      'Which students are at risk of dropping out?',
      'What are the attendance trends this week?',
      'Which teachers need additional support?',
      'Show me subject performance analysis',
      'What is the total student count?',
      'How are students performing in exams?'
    ]

    return `I can help you with various questions about your school data. Here are some things I can answer:\n\n${suggestions.map(s => `- ${s}`).join('\n')}\n\nTry asking one of these questions!`

  } catch (error) {
    console.error('Error generating AI response:', error)
    return 'I apologize, but I encountered an error while accessing the data. Please try again.'
  }
}

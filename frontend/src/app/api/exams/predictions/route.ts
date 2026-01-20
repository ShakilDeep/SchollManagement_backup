import { NextRequest, NextResponse } from 'next/server'
import { fetchAPI } from '@/lib/api/client'

export const revalidate = 60

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const gradeId = searchParams.get('gradeId')
    const sectionId = searchParams.get('sectionId')
    const subjectId = searchParams.get('subjectId')

    // Fetch exam results from Django backend API
    const queryParams: Record<string, string> = {}
    if (gradeId) queryParams.grade = gradeId
    if (sectionId) queryParams.section = sectionId
    if (subjectId) queryParams.subject = subjectId

    const examResultsResponse = await fetchAPI<{ results: any[] }>('/exam-results/', { query: queryParams })
    const examResults = examResultsResponse.results || []

    // Fetch students data to get grade/section details
    const studentsResponse = await fetchAPI<{ results: any[] }>('/students/')
    const students = studentsResponse.results || []

    // Fetch exam papers for subject details
    const examPapersResponse = await fetchAPI<{ results: any[] }>('/exams/papers/')
    const examPapers = examPapersResponse.results || []

    // Fetch subjects for subject details
    const subjectsResponse = await fetchAPI<{ results: any[] }>('/curriculum/subjects/')
    const subjects = subjectsResponse.results || []

    // Fetch grades for grade details
    const gradesResponse = await fetchAPI<{ results: any[] }>('/grades/')
    const grades = gradesResponse.results || []

    // Fetch sections for section details
    const sectionsResponse = await fetchAPI<{ results: any[] }>('/sections/')
    const sections = sectionsResponse.results || []

    // Transform exam results to include nested data
    const transformedExamResults = examResults.map(result => {
      const student = students.find(s => s.id === (result.student || result.studentId || result.student_id))
      const examPaper = examPapers.find(p => p.id === (result.examPaper || result.exam_paper_id || result.examPaperId))
      const subject = examPaper ? subjects.find(s => s.id === (examPaper.subject || examPaper.subjectId || examPaper.subject_id)) : null
      const grade = student ? grades.find(g => g.id === (student.grade || student.gradeId || student.grade_id)) : null
      const section = student ? sections.find(s => s.id === (student.section || student.sectionId || student.section_id)) : null

      return {
        id: result.id,
        marksObtained: result.marksObtained || result.marks_obtained || 0,
        percentage: result.percentage || 0,
        rank: result.rank,
        examPaperId: result.examPaper || result.exam_paper_id || result.examPaperId,
        student: {
          id: student?.id || result.student || result.studentId || result.student_id || '',
          firstName: student?.firstName || student?.first_name || 'Unknown',
          lastName: student?.lastName || student?.last_name || 'Unknown',
          rollNumber: student?.rollNumber || student?.roll_number || '',
          grade: grade ? { id: grade.id, name: grade.name } : { id: '', name: 'Unknown' },
          section: section ? { id: section.id, name: section.name } : { id: '', name: 'Unknown' }
        },
        examPaper: examPaper ? {
          id: examPaper.id,
          totalMarks: examPaper.totalMarks || examPaper.total_marks || 100,
          passingMarks: examPaper.passingMarks || examPaper.passing_marks || 40,
          examDate: examPaper.examDate || examPaper.exam_date || new Date().toISOString(),
          subject: subject ? {
            id: subject.id,
            name: subject.name,
            code: subject.code
          } : { id: '', name: 'Unknown', code: '' }
        } : {
          id: result.examPaper || '',
          totalMarks: 100,
          passingMarks: 40,
          examDate: new Date().toISOString(),
          subject: { id: '', name: 'Unknown', code: '' }
        }
      }
    })

    const studentPerformance = new Map<string, any[]>()

    transformedExamResults.forEach(result => {
      const studentId = result.student.id
      if (!studentPerformance.has(studentId)) {
        studentPerformance.set(studentId, [])
      }
      studentPerformance.get(studentId)!.push(result)
    })

    const studentRiskFactors: any[] = []

    studentPerformance.forEach((results, studentId) => {
      const student = results[0].student
      const totalExams = results.length
      const averageScore = results.reduce((sum, r) => sum + r.percentage, 0) / totalExams

      const sortedResults = results.sort((a, b) =>
        new Date(b.examPaper.examDate).getTime() - new Date(a.examPaper.examDate).getTime()
      )

      const recentExams = sortedResults.slice(0, Math.min(3, totalExams))
      const recentAverage = recentExams.reduce((sum, r) => sum + r.percentage, 0) / recentExams.length

      const olderExams = sortedResults.slice(recentExams.length)
      let olderAverage = averageScore
      if (olderExams.length > 0) {
        olderAverage = olderExams.reduce((sum, r) => sum + r.percentage, 0) / olderExams.length
      }

      let trend: 'improving' | 'stable' | 'declining' = 'stable'
      const trendDifference = recentAverage - olderAverage
      if (trendDifference > 5) {
        trend = 'improving'
      } else if (trendDifference < -5) {
        trend = 'declining'
      }

      const failingExams = results.filter(r => r.percentage < r.examPaper.passingMarks).length
      const passRate = ((totalExams - failingExams) / totalExams) * 100

      let riskLevel: 'high' | 'medium' | 'low' = 'low'
      if (averageScore < 40 || passRate < 50 || (trend === 'declining' && trendDifference < -15)) {
        riskLevel = 'high'
      } else if (averageScore < 60 || passRate < 75 || trend === 'declining') {
        riskLevel = 'medium'
      }

      const confidence = Math.min(100, (totalExams / 5) * 100)

      const recommendedActions: string[] = []
      if (riskLevel === 'high') {
        recommendedActions.push('Immediate intervention required')
        recommendedActions.push('Schedule one-on-one tutoring sessions')
        if (failingExams > 0) {
          recommendedActions.push(`Focus on ${failingExams} failed subjects`)
        }
      } else if (riskLevel === 'medium') {
        recommendedActions.push('Provide additional study materials')
        if (trend === 'declining') {
          recommendedActions.push('Address performance decline')
        }
      }

      if (trend === 'improving') {
        recommendedActions.push('Continue current support strategy')
      }

      if (totalExams > 0) {
        studentRiskFactors.push({
          studentId,
          studentName: `${student.firstName} ${student.lastName}`,
          rollNumber: student.rollNumber,
          grade: student.grade.name,
          section: student.section.name,
          riskLevel,
          currentAverage: Math.round(averageScore * 100) / 100,
          trend,
          confidence: Math.round(confidence),
          totalExams,
          passRate: Math.round(passRate),
          recommendedActions: recommendedActions.slice(0, 3)
        })
      }
    })

    studentRiskFactors.sort((a, b) => {
      const riskOrder = { high: 0, medium: 1, low: 2 }
      return riskOrder[a.riskLevel] - riskOrder[b.riskLevel]
    })

    const subjectPerformance = new Map<string, any[]>()

    transformedExamResults.forEach(result => {
      const subjectName = result.examPaper.subject.name
      if (!subjectPerformance.has(subjectName)) {
        subjectPerformance.set(subjectName, [])
      }
      subjectPerformance.get(subjectName)!.push(result)
    })

    const subjectAnalysis: any[] = []

    subjectPerformance.forEach((results, subjectName) => {
      const averageScore = results.reduce((sum, r) => sum + r.percentage, 0) / results.length
      const totalExams = results.length

      const passingStudents = results.filter(r => r.percentage >= r.examPaper.passingMarks).length
      const passRate = (passingStudents / totalExams) * 100

      let difficulty: 'easy' | 'medium' | 'hard' = 'medium'
      if (averageScore >= 75 && passRate >= 80) {
        difficulty = 'easy'
      } else if (averageScore < 50 || passRate < 60) {
        difficulty = 'hard'
      }

      const gradePerformance = new Map<string, number[]>()
      results.forEach(result => {
        const gradeName = result.student.grade.name
        if (!gradePerformance.has(gradeName)) {
          gradePerformance.set(gradeName, [])
        }
        gradePerformance.get(gradeName)!.push(result.percentage)
      })

      const strugglingGrades: string[] = []
      const topPerformers: string[] = []

      gradePerformance.forEach((scores, gradeName) => {
        const avg = scores.reduce((sum, s) => sum + s, 0) / scores.length
        if (avg < 50) {
          strugglingGrades.push(gradeName)
        } else if (avg >= 75) {
          topPerformers.push(gradeName)
        }
      })

      subjectAnalysis.push({
        subject: subjectName,
        averageScore: Math.round(averageScore * 100) / 100,
        passRate: Math.round(passRate),
        difficulty,
        totalExams,
        strugglingGrades,
        topPerformers
      })
    })

    subjectAnalysis.sort((a, b) => a.averageScore - b.averageScore)

    const gradePerformance = new Map<string, any[]>()

    transformedExamResults.forEach(result => {
      const gradeName = result.student.grade.name
      const sectionName = result.student.section.name
      const key = `${gradeName}-${sectionName}`

      if (!gradePerformance.has(key)) {
        gradePerformance.set(key, [])
      }
      gradePerformance.get(key)!.push(result)
    })

    const gradeComparison: any[] = []

    gradePerformance.forEach((results, key) => {
      const [gradeName, sectionName] = key.split('-')
      const averageScore = results.reduce((sum, r) => sum + r.percentage, 0) / results.length

      const subjectScores = new Map<string, number[]>()
      results.forEach(result => {
        const subjectName = result.examPaper.subject.name
        if (!subjectScores.has(subjectName)) {
          subjectScores.set(subjectName, [])
        }
        subjectScores.get(subjectName)!.push(result.percentage)
      })

      const weakestSubject = Array.from(subjectScores.entries())
        .sort((a, b) => {
          const avgA = a[1].reduce((sum, s) => sum + s, 0) / a[1].length
          const avgB = b[1].reduce((sum, s) => sum + s, 0) / b[1].length
          return avgA - avgB
        })[0]

      const strongestSubject = Array.from(subjectScores.entries())
        .sort((a, b) => {
          const avgA = a[1].reduce((sum, s) => sum + s, 0) / a[1].length
          const avgB = b[1].reduce((sum, s) => sum + s, 0) / b[1].length
          return avgB - avgA
        })[0]

      gradeComparison.push({
        grade: gradeName,
        section: sectionName,
        averageScore: Math.round(averageScore * 100) / 100,
        totalStudents: new Set(results.map(r => r.student.id)).size,
        weakestSubject: weakestSubject ? weakestSubject[0] : 'N/A',
        strongestSubject: strongestSubject ? strongestSubject[0] : 'N/A'
      })
    })

    gradeComparison.sort((a, b) => b.averageScore - a.averageScore)

    const alerts: any[] = []

    const highRiskCount = studentRiskFactors.filter(s => s.riskLevel === 'high').length
    if (highRiskCount > 0) {
      alerts.push({
        type: 'warning',
        priority: 'high',
        message: `${highRiskCount} students identified as high-risk and need immediate attention`,
        actionable: true
      })
    }

    const hardSubjects = subjectAnalysis.filter(s => s.difficulty === 'hard')
    if (hardSubjects.length > 0) {
      alerts.push({
        type: 'info',
        priority: 'medium',
        message: `${hardSubjects.length} subjects (${hardSubjects.map(s => s.subject).join(', ')}) are showing low pass rates`,
        actionable: true
      })
    }

    const decliningStudents = studentRiskFactors.filter(s => s.trend === 'declining').length
    if (decliningStudents > 0) {
      alerts.push({
        type: 'warning',
        priority: 'medium',
        message: `${decliningStudents} students show declining performance trends`,
        actionable: true
      })
    }

    const overallAverage = transformedExamResults.length > 0
      ? transformedExamResults.reduce((sum, r) => sum + r.percentage, 0) / transformedExamResults.length
      : 0

    if (overallAverage >= 70) {
      alerts.push({
        type: 'success',
        priority: 'low',
        message: `Overall student performance is strong at ${Math.round(overallAverage)}% average`,
        actionable: false
      })
    }

    const improvingStudents = studentRiskFactors.filter(s => s.trend === 'improving').length
    if (improvingStudents > 0) {
      alerts.push({
        type: 'success',
        priority: 'low',
        message: `${improvingStudents} students are showing positive performance trends`,
        actionable: false
      })
    }

    const predictions = {
      studentRiskFactors: studentRiskFactors.slice(0, 10),
      subjectAnalysis: subjectAnalysis.slice(0, 8),
      gradeComparison: gradeComparison.slice(0, 10),
      overallStats: {
        totalStudents: studentPerformance.size,
        totalExamResults: transformedExamResults.length,
        overallAverage: Math.round(overallAverage * 100) / 100,
        highRiskStudents: highRiskCount,
        mediumRiskStudents: studentRiskFactors.filter(s => s.riskLevel === 'medium').length,
        lowRiskStudents: studentRiskFactors.filter(s => s.riskLevel === 'low').length,
        improvingStudents,
        decliningStudents,
        stableStudents: studentRiskFactors.filter(s => s.trend === 'stable').length
      },
      alerts: alerts.sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 }
        return priorityOrder[a.priority] - priorityOrder[b.priority]
      }),
      generatedAt: new Date()
    }

    return NextResponse.json(predictions)
  } catch (error) {
    console.error('Error generating exam predictions:', error)
    return NextResponse.json(
      { error: 'Failed to generate exam predictions' },
      { status: 500 }
    )
  }
}

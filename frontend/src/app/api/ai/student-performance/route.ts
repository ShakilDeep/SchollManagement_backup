import { NextRequest, NextResponse } from 'next/server'
import { studentPerformanceService } from '@/lib/ai/services/student-performance'
import { fetchAPI } from '@/lib/api/client'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { studentIds, grade, section, atRiskOnly = false } = body

    if (!studentIds && !grade) {
      return NextResponse.json(
        {
          success: false,
          error: 'Either studentIds or grade is required'
        },
        { status: 400 }
      )
    }

    let studentsData: any[] = []

    if (studentIds) {
      // Fetch multiple students by IDs
      const studentPromises = studentIds.map((id: string) =>
        fetchAPI<any>(`/students/${id}/`).catch(() => null)
      )
      const students = await Promise.all(studentPromises)
      const validStudents = students.filter(s => s !== null)

      // Fetch attendance and exam results for each student
      const enrichedStudents = await Promise.all(validStudents.map(async (student) => {
        const [attendanceResponse, examResultsResponse] = await Promise.all([
          fetchAPI<{ results: any[] }>(`/attendance/?student=${student.id}`),
          fetchAPI<{ results: any[] }>(`/exam-results/?student=${student.id}`)
        ])

        const attendances = attendanceResponse.results || []
        const examResults = examResultsResponse.results || []

        return {
          id: student.id,
          firstName: student.firstName || student.first_name,
          lastName: student.lastName || student.last_name,
          grade: student.grade || student.gradeId || student.grade_id,
          section: student.section || student.sectionId || student.section_id,
          attendances: attendances.map((a: any) => ({
            status: a.status || a.status,
            date: a.date || a.attendance_date
          })),
          examResults: examResults.map((r: any) => ({
            subject: r.subjectName || r.subject_name || 'Unknown',
            marksObtained: r.marksObtained || r.marks_obtained || 0,
            totalMarks: r.totalMarks || r.total_marks || 100,
            percentage: r.percentage || 0,
            date: r.examDate || r.exam_date || r.created_at
          }))
        }
      }))

      studentsData = enrichedStudents
    } else {
      // Fetch students by grade and section
      const queryParams: Record<string, string> = {}
      if (grade) queryParams.grade = grade
      if (section) queryParams.section = section

      const studentsResponse = await fetchAPI<{ results: any[] }>('/students/', { query: queryParams })
      const students = studentsResponse.results || []

      // Fetch attendance and exam results for each student
      const enrichedStudents = await Promise.all(students.slice(0, 50).map(async (student) => {
        const [attendanceResponse, examResultsResponse] = await Promise.all([
          fetchAPI<{ results: any[] }>(`/attendance/?student=${student.id}`),
          fetchAPI<{ results: any[] }>(`/exam-results/?student=${student.id}`)
        ])

        const attendances = attendanceResponse.results || []
        const examResults = examResultsResponse.results || []

        return {
          id: student.id,
          firstName: student.firstName || student.first_name,
          lastName: student.lastName || student.last_name,
          grade: student.grade || student.gradeId || student.grade_id,
          section: student.section || student.sectionId || student.section_id,
          attendances: attendances.map((a: any) => ({
            status: a.status || a.status,
            date: a.date || a.attendance_date
          })),
          examResults: examResults.map((r: any) => ({
            subject: r.subjectName || r.subject_name || 'Unknown',
            marksObtained: r.marksObtained || r.marks_obtained || 0,
            totalMarks: r.totalMarks || r.total_marks || 100,
            percentage: r.percentage || 0,
            date: r.examDate || r.exam_date || r.created_at
          }))
        }
      }))

      studentsData = enrichedStudents
    }

    // Fetch grades and sections for name lookup
    const [gradesResponse, sectionsResponse] = await Promise.all([
      fetchAPI<{ results: any[] }>('/grades/'),
      fetchAPI<{ results: any[] }>('/sections/')
    ])

    const grades = gradesResponse.results || []
    const sections = sectionsResponse.results || []

    const studentData = studentsData.map(student => {
      const totalAttendance = student.attendances.length
      const presentAttendance = student.attendances.filter((a: any) => a.status === 'Present').length
      const attendanceRate = totalAttendance > 0 ? presentAttendance / totalAttendance : 0

      const gradeObj = grades.find(g => g.id === student.grade)
      const sectionObj = sections.find(s => s.id === student.section)

      return {
        id: student.id,
        name: `${student.firstName} ${student.lastName}`,
        grade: gradeObj?.name || 'Unknown',
        section: sectionObj?.name || '',
        attendanceRate,
        examResults: student.examResults
      }
    })

    let predictions

    if (atRiskOnly) {
      predictions = await studentPerformanceService.getAtRiskStudents(studentData)
    } else {
      predictions = await studentPerformanceService.predictMultipleStudents(studentData)
    }

    return NextResponse.json({
      success: true,
      data: predictions
    })
  } catch (error) {
    console.error('Student performance prediction error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to predict student performance'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const studentId = searchParams.get('studentId')

    if (!studentId) {
      return NextResponse.json(
        {
          success: false,
          error: 'studentId is required'
        },
        { status: 400 }
      )
    }

    // Fetch student from Django backend API
    const studentResponse = await fetchAPI<any>(`/students/${studentId}/`)
    const student = studentResponse

    if (!student) {
      return NextResponse.json(
        {
          success: false,
          error: 'Student not found'
        },
        { status: 404 }
      )
    }

    // Fetch attendance and exam results
    const [attendanceResponse, examResultsResponse, gradesResponse, sectionsResponse] = await Promise.all([
      fetchAPI<{ results: any[] }>(`/attendance/?student=${studentId}`),
      fetchAPI<{ results: any[] }>(`/exam-results/?student=${studentId}`),
      fetchAPI<{ results: any[] }>('/grades/'),
      fetchAPI<{ results: any[] }>('/sections/')
    ])

    const attendances = attendanceResponse.results || []
    const examResults = examResultsResponse.results || []
    const grades = gradesResponse.results || []
    const sections = sectionsResponse.results || []

    const totalAttendance = attendances.length
    const presentAttendance = attendances.filter((a: any) => a.status === 'Present').length
    const attendanceRate = totalAttendance > 0 ? presentAttendance / totalAttendance : 0

    const gradeObj = grades.find(g => g.id === (student.grade || student.gradeId || student.grade_id))
    const sectionObj = sections.find(s => s.id === (student.section || student.sectionId || student.section_id))

    const studentData = {
      id: student.id,
      name: `${student.firstName || student.first_name || ''} ${student.lastName || student.last_name || ''}`.trim(),
      grade: gradeObj?.name || 'Unknown',
      section: sectionObj?.name || '',
      attendanceRate,
      examResults: examResults.map((r: any) => ({
        subject: r.subjectName || r.subject_name || 'Unknown',
        marksObtained: r.marksObtained || r.marks_obtained || 0,
        totalMarks: r.totalMarks || r.total_marks || 100,
        percentage: r.percentage || 0,
        date: r.examDate || r.exam_date || r.created_at
      }))
    }

    const prediction = await studentPerformanceService.predictStudentPerformance(studentData)

    return NextResponse.json({
      success: true,
      data: prediction
    })
  } catch (error) {
    console.error('Student performance prediction error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to predict student performance'
      },
      { status: 500 }
    )
  }
}

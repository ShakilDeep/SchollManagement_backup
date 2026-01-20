import { NextRequest, NextResponse } from 'next/server'
import { fetchAPI } from '@/lib/api/client'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sectionId = searchParams.get('sectionId')
    const gradeId = searchParams.get('gradeId')
    const section = searchParams.get('section')
    const academicYearId = searchParams.get('academicYearId')

    let targetSectionId = sectionId
    if (!targetSectionId && gradeId && section) {
      targetSectionId = await getSectionIdByGradeAndSection(gradeId, section)
    }
    if (!targetSectionId) {
      targetSectionId = await getDefaultSectionId()
    }
    const targetAcademicYearId = academicYearId || (await getCurrentAcademicYearId())

    if (!targetSectionId || !targetAcademicYearId) {
      return NextResponse.json([])
    }

    // Build query parameters for backend API
    const queryParams: Record<string, string> = {
      section: targetSectionId,
      academic_year: targetAcademicYearId
    }

    const response = await fetchAPI<{ results: any[] }>('/timetable/', { query: queryParams })
    const timetables = response.results || []

    // Transform the data to match the frontend interface
    const transformedTimetables = timetables.map((tt: any) => ({
      id: tt.id,
      day: formatDayOfWeek(tt.day_of_week || tt.dayOfWeek),
      period: tt.period,
      subject: tt.subject_name || tt.subjectName || 'Unknown',
      type: getSubjectType(tt.subject_name || tt.subjectName || ''),
      teacher: tt.teacher_name || tt.teacherName || 'Not Assigned',
      room: tt.room_number || tt.roomNumber || `Room ${Math.floor(Math.random() * 200) + 100}`,
      time: getPeriodTime(tt.period),
      difficulty: getSubjectDifficulty(tt.subject_name || tt.subjectName || ''),
      conflict: false // You can add conflict detection logic here
    }))

    return NextResponse.json(transformedTimetables)
  } catch (error) {
    console.error('Error fetching timetable:', error)
    return NextResponse.json(
      { error: 'Failed to fetch timetable data' },
      { status: 500 }
    )
  }
}

async function getDefaultSectionId(): Promise<string> {
  try {
    const response = await fetchAPI<{ results: any[] }>('/sections/')
    const sections = response.results || []
    const defaultSection = sections.find((s: any) =>
      (s.name === 'A' || s.section_name === 'A') &&
      (s.grade_name === 'Grade 10' || s.grade?.name === 'Grade 10')
    )
    return defaultSection?.id || sections[0]?.id || ''
  } catch {
    return ''
  }
}

async function getCurrentAcademicYearId(): Promise<string> {
  try {
    const response = await fetchAPI<{ results: any[] }>('/academic-years/')
    const years = response.results || []
    const currentYear = years.find((y: any) => y.is_current)
    return currentYear?.id || years[0]?.id || ''
  } catch {
    return ''
  }
}

async function getSectionIdByGradeAndSection(gradeId: string, sectionName: string): Promise<string> {
  try {
    const response = await fetchAPI<{ results: any[] }>('/sections/')
    const sections = response.results || []
    const section = sections.find((s: any) =>
      (s.grade === gradeId || s.grade_id === gradeId || s.grade?.id === gradeId) &&
      (s.name === sectionName || s.section_name === sectionName)
    )
    return section?.id || ''
  } catch {
    return ''
  }
}

function formatDayOfWeek(dayOfWeek: string): string {
  const dayMap: Record<string, string> = {
    'MONDAY': 'Monday',
    'TUESDAY': 'Tuesday',
    'WEDNESDAY': 'Wednesday',
    'THURSDAY': 'Thursday',
    'FRIDAY': 'Friday'
  }
  return dayMap[dayOfWeek] || dayOfWeek
}

function getSubjectType(subject: string): string {
  const types: Record<string, string> = {
    'Mathematics': 'Practical',
    'English': 'Lecture',
    'Physics': 'Lab',
    'Chemistry': 'Lab',
    'Biology': 'Lab',
    'Computer Science': 'Practical',
    'History': 'Lecture',
    'Geography': 'Lecture',
    'Economics': 'Lecture',
    'Physical Education': 'Practical',
    'Art': 'Practical',
    'Music': 'Practical'
  }
  return types[subject] || 'Lecture'
}

function getSubjectDifficulty(subject: string): string {
  const advancedSubjects = ['Physics', 'Chemistry', 'Biology', 'Computer Science', 'Mathematics', 'Economics']
  return advancedSubjects.includes(subject) ? 'advanced' : 'regular'
}

function getPeriodTime(period: number): string {
  const times = [
    '08:00 - 08:45',
    '08:50 - 09:35',
    '09:40 - 10:25',
    '10:40 - 11:25',
    '11:30 - 12:15',
    '12:40 - 01:25',
    '01:30 - 02:15',
    '02:20 - 03:05'
  ]
  return times[period - 1] || '00:00 - 00:00'
}

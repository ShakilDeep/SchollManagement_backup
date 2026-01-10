import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

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

    const timetables = await db.timetable.findMany({
      where: {
        sectionId: targetSectionId,
        academicYearId: targetAcademicYearId
      },
      include: {
        subject: true,
        teacher: true,
        section: {
          include: {
            grade: true
          }
        }
      },
      orderBy: [
        { dayOfWeek: 'asc' },
        { period: 'asc' }
      ]
    })

    // Transform the data to match the frontend interface
    const transformedTimetables = timetables.map(tt => ({
      id: tt.id,
      day: formatDayOfWeek(tt.dayOfWeek),
      period: tt.period,
      subject: tt.subject.name,
      type: getSubjectType(tt.subject.name),
      teacher: `${tt.teacher.firstName} ${tt.teacher.lastName}`,
      room: tt.roomNumber || `Room ${Math.floor(Math.random() * 200) + 100}`,
      time: getPeriodTime(tt.period),
      difficulty: getSubjectDifficulty(tt.subject.name),
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
  const section = await db.section.findFirst({
    where: {
      name: 'A',
      grade: {
        name: 'Grade 10'
      }
    }
  })
  return section?.id || ''
}

async function getCurrentAcademicYearId(): Promise<string> {
  const academicYear = await db.academicYear.findFirst({
    where: {
      isCurrent: true
    }
  })
  return academicYear?.id || ''
}

async function getSectionIdByGradeAndSection(gradeId: string, sectionName: string): Promise<string> {
  const section = await db.section.findFirst({
    where: {
      gradeId: gradeId,
      name: sectionName
    }
  })
  return section?.id || ''
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
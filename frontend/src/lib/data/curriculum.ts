import { cache } from 'react'
import { fetchAPI } from '@/lib/api/client'

export const getCurriculums = cache(async (filters?: {
  subjectId?: string
  gradeId?: string
  academicYearId?: string
}) => {
  // Build query parameters for backend API
  const queryParams: Record<string, string> = {}
  if (filters?.subjectId) queryParams.subject = filters.subjectId
  if (filters?.gradeId) queryParams.grade = filters.gradeId
  if (filters?.academicYearId) queryParams.academic_year = filters.academicYearId

  const response = await fetchAPI<{ results: any[] }>('/curriculum/', { query: queryParams })
  const curriculums = response.results || []

  return curriculums.map((c: any) => ({
    id: c.id,
    name: c.name || 'Unknown',
    description: c.description,
    objectives: c.objectives || [],
    topics: c.topics || [],
    createdAt: c.created_at || c.createdAt,
    updatedAt: c.updated_at || c.updatedAt,
    subject: c.subject_details || c.subject,
    grade: c.grade_details || c.grade,
    academicYear: c.academic_year_details || c.academicYear,
    lessons: c.lessons || [],
  }))
})

export const getCurriculumById = cache(async (id: string) => {
  const curriculum = await fetchAPI<any>(`/curriculum/${id}/`)

  return {
    id: curriculum.id,
    name: curriculum.name || 'Unknown',
    description: curriculum.description,
    objectives: curriculum.objectives || [],
    topics: curriculum.topics || [],
    createdAt: curriculum.created_at || curriculum.createdAt,
    updatedAt: curriculum.updated_at || curriculum.updatedAt,
    subject: curriculum.subject_details || curriculum.subject,
    grade: curriculum.grade_details || curriculum.grade,
    academicYear: curriculum.academic_year_details || curriculum.academicYear,
    lessons: curriculum.lessons || [],
  }
})

export const getSubjects = cache(async () => {
  const response = await fetchAPI<{ results: any[] }>('/curriculum/subjects/')
  const subjects = response.results || []

  return subjects.map((s: any) => ({
    id: s.id,
    name: s.name || 'Unknown',
    code: s.code,
    color: s.color,
  }))
})

export const getGrades = cache(async () => {
  const response = await fetchAPI<{ results: any[] }>('/grades/')
  const grades = response.results || []

  return grades.map((g: any) => ({
    id: g.id,
    name: g.name || 'Unknown',
  }))
})

export const getAcademicYears = cache(async () => {
  const response = await fetchAPI<{ results: any[] }>('/academic-years/')
  const academicYears = response.results || []

  return academicYears.map((y: any) => ({
    id: y.id,
    name: y.name,
    startDate: y.start_date || y.startDate,
    endDate: y.end_date || y.endDate,
    isCurrent: y.is_current || y.isCurrent || false,
  }))
})

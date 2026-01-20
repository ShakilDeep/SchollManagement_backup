import { fetchAPI } from './client'

export interface Student {
  id: string
  user?: string | number
  fullName: string
  firstName: string
  lastName: string
  rollNumber: string
  admissionNumber: string
  admissionDate: string
  gender: string
  dateOfBirth?: string
  bloodGroup?: string
  phone: string
  email?: string
  emergencyContact?: string
  emergencyPhone?: string
  address?: string
  city?: string
  state?: string
  zipCode?: string
  grade: string
  gradeName?: string
  section: string
  sectionName?: string
  academicYear?: string
  academicYearName?: string
  guardian?: string
  relationship?: string
  status: string
  photo?: string
  // For display purposes - derived fields
  name: string // derived from fullName
  guardianName?: string // derived if needed
}

export interface CreateStudentInput {
  firstName: string
  lastName: string
  email?: string
  phone?: string
  address?: string
  grade: string
  section: string
  guardianName: string
  guardianPhone: string
  rollNumber: string
  status?: string
}

export interface UpdateStudentInput {
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  address?: string
  grade?: string
  section?: string
  guardianName?: string
  guardianPhone?: string
  status?: string
  rollNumber?: string
}

export async function getStudents(rollNumber?: string): Promise<Student[]> {
  const response = await fetchAPI<{ results: Student[] } | { data: Student[] }>('/students', {
    query: rollNumber ? { rollNumber } : undefined,
  })
  // Handle both paginated response (results) and direct data response
  return ('results' in response ? response.results : response.data) || []
}

export async function getStudent(id: string): Promise<Student> {
  return fetchAPI<Student>(`/students/${id}`)
}

export async function createStudent(
  data: CreateStudentInput
): Promise<Student> {
  return fetchAPI<Student>('/students', {
    method: 'POST',
    body: data,
  })
}

export async function updateStudent(
  id: string,
  data: UpdateStudentInput
): Promise<Student> {
  return fetchAPI<Student>(`/students/${id}`, {
    method: 'PUT',
    body: data,
  })
}

export async function deleteStudent(id: string): Promise<void> {
  return fetchAPI<void>(`/students/${id}`, {
    method: 'DELETE',
  })
}

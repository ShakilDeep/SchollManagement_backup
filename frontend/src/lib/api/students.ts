import { fetchAPI } from './client'

export interface Student {
  id: string
  rollNumber: string
  name: string
  grade: string
  section: string
  status: string
  guardian: string
  phone: string
  admissionDate: string
  avatar?: string
  email?: string
  address?: string
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
  return fetchAPI<Student[]>('/students', {
    query: rollNumber ? { rollNumber } : undefined,
  })
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

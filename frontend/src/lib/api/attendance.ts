import { fetchAPI } from './client'

export interface AttendanceRecord {
  id: string
  rollNumber: string
  name: string
  grade: string
  section: string
  status: 'Present' | 'Absent' | 'Late' | 'Unmarked'
  checkIn?: string
  checkOut?: string
  avatar?: string
  email?: string
  phone?: string
}

export interface AttendanceInput {
  id: string
  status: 'Present' | 'Absent' | 'Late' | 'Unmarked'
}

export interface SaveAttendanceInput {
  date: string
  attendanceData: AttendanceInput[]
}

export async function getAttendance(
  date: string,
  options?: {
    gradeId?: string
    sectionId?: string
    search?: string
  }
): Promise<AttendanceRecord[]> {
  return fetchAPI<AttendanceRecord[]>('/attendance', {
    query: {
      date,
      gradeId: options?.gradeId,
      sectionId: options?.sectionId,
      search: options?.search,
    },
  })
}

export async function saveAttendance(
  data: SaveAttendanceInput
): Promise<{ success: boolean }> {
  return fetchAPI<{ success: boolean }>('/attendance', {
    method: 'POST',
    body: data,
  })
}

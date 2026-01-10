import { createResourceHooks } from './hook-factory'
import type { StudentFormData, StaffFormData } from '@/lib/validations'
import type { Student } from '@/lib/api/students'
import type { AttendanceRecord } from '@/lib/api/attendance'

export const studentHooks = createResourceHooks<Student, StudentFormData, Partial<StudentFormData>>('student', 'students')
export const staffHooks = createResourceHooks<any, StaffFormData, Partial<StaffFormData>>('staff', 'staff')
export const gradeHooks = createResourceHooks('grade', 'grades')
export const sectionHooks = createResourceHooks('section', 'sections')
export const subjectHooks = createResourceHooks('subject', 'subjects')
export const academicYearHooks = createResourceHooks('academicYear', 'academic-years')
export const curriculumHooks = createResourceHooks('curriculum', 'curriculum')
export const lessonHooks = createResourceHooks('lesson', 'lessons')
export const bookHooks = createResourceHooks('book', 'books')
export const behaviorRecordHooks = createResourceHooks('behaviorRecord', 'behavior')
export const examHooks = createResourceHooks('exam', 'exams')
export const hostelHooks = createResourceHooks('hostel', 'hostels')
export const roomHooks = createResourceHooks('room', 'rooms')
export const vehicleHooks = createResourceHooks('vehicle', 'vehicles')
export const allocationHooks = createResourceHooks('allocation', 'allocations')
export const itemHooks = createResourceHooks('item', 'inventory')
export const messageHooks = createResourceHooks('message', 'messages')

import { z } from 'zod'

const personFields = {
  firstName: z.string().min(2, 'First name must be at least 2 characters').max(50, 'First name cannot exceed 50 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters').max(50, 'Last name cannot exceed 50 characters'),
  gender: z.enum(['Male', 'Female', 'Other'], { required_error: 'Gender is required' }),
  phone: z.string().min(10, 'Phone number must be at least 10 digits').max(15, 'Phone number cannot exceed 15 digits').regex(/^\+?[\d-]+$/, 'Phone number can only contain numbers, hyphens, and optional +'),
  email: z.string().email('Invalid email address').max(100, 'Email cannot exceed 100 characters').optional().or(z.literal('')),
  address: z.string().max(500, 'Address cannot exceed 500 characters').optional().or(z.literal('')),
}

const academicFields = {
  grade: z.string({ required_error: 'Grade is required' }).min(1, 'Grade is required'),
  section: z.string({ required_error: 'Section is required' }).min(1, 'Section is required'),
  subject: z.string({ required_error: 'Subject is required' }).min(1, 'Subject is required'),
  academicYear: z.string({ required_error: 'Academic year is required' }).min(1, 'Academic year is required'),
}

const dateFields = {
  date: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid date format'),
  startDate: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid start date format'),
  endDate: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid end date format'),
  examDate: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid exam date format'),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  publicationYear: z.number({ required_error: 'Publication year is required' }).min(1800, 'Publication year must be after 1800').max(new Date().getFullYear() + 1, 'Publication year cannot be in the future'),
}

export const studentFormSchema = z.object({
  ...personFields,
  gender: z.enum(['male', 'female', 'other'], { required_error: 'Gender is required' }),
  rollNumber: z.string().min(1, 'Roll number is required').max(20, 'Roll number cannot exceed 20 characters').regex(/^[A-Za-z0-9-]+$/, 'Roll number can only contain letters, numbers, and hyphens'),
  grade: academicFields.grade,
  section: academicFields.section,
  guardianName: z.string().min(2, 'Guardian name must be at least 2 characters').max(100, 'Guardian name cannot exceed 100 characters'),
  relationship: z.string().min(2, 'Relationship must be at least 2 characters').max(50, 'Relationship cannot exceed 50 characters'),
  guardianPhone: z.string().min(10, 'Guardian phone must be at least 10 digits').max(15, 'Guardian phone cannot exceed 15 digits').regex(/^\+?[\d-]+$/, 'Guardian phone can only contain numbers, hyphens, and optional +'),
  medicalInfo: z.string().max(1000, 'Medical information cannot exceed 1000 characters').optional().or(z.literal('')),
  address: z.string().min(5, 'Address must be at least 5 characters').max(500, 'Address cannot exceed 500 characters'),
  city: z.string().min(2, 'City must be at least 2 characters').max(100, 'City cannot exceed 100 characters'),
  state: z.string().min(2, 'State must be at least 2 characters').max(100, 'State cannot exceed 100 characters'),
  zipCode: z.string().min(5, 'Zip code must be at least 5 characters').max(10, 'Zip code cannot exceed 10 characters'),
  dateOfBirth: dateFields.date,
})

export const staffFormSchema = z.object({
  ...personFields,
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  phone: z.string().min(1, 'Phone number is required').min(10, 'Phone number must be at least 10 digits'),
  type: z.enum(['Teacher', 'Staff'], { required_error: 'Role type is required' }),
  department: z.string().min(1, 'Department is required').min(2, 'Department must be at least 2 characters'),
  designation: z.string().min(1, 'Designation is required').min(2, 'Designation must be at least 2 characters'),
  dateOfBirth: z.string().optional(),
  qualification: z.string().optional(),
  experience: z.string().optional(),
  salary: z.string().optional(),
}).refine((data) => data.type === 'Teacher' ? !!data.experience : true, { path: ['experience'], message: 'Experience is required for teachers' })

export const attendanceStatusSchema = z.enum(['Present', 'Absent', 'Late', 'HalfDay'], { required_error: 'Attendance status is required' })

export const attendanceFormSchema = z.object({
  date: dateFields.date,
  gradeId: z.string().optional(),
  sectionId: z.string().optional(),
  attendanceData: z.array(z.object({
    id: z.string({ required_error: 'Student ID is required' }),
    status: attendanceStatusSchema,
  })),
})

export const attendanceFilterSchema = z.object({
  date: dateFields.date,
  gradeId: z.string().optional(),
  sectionId: z.string().optional(),
  search: z.string().optional(),
})

export const examPaperSchema = z.object({
  subjectId: z.string({ required_error: 'Subject is required' }).min(1, 'Subject is required'),
  gradeId: z.string({ required_error: 'Grade is required' }).min(1, 'Grade is required'),
  totalMarks: z.number({ required_error: 'Total marks is required' }).min(1, 'Total marks must be at least 1').max(1000, 'Total marks cannot exceed 1000'),
  passingMarks: z.number({ required_error: 'Passing marks is required' }).min(0, 'Passing marks cannot be negative').max(1000, 'Passing marks cannot exceed 1000').refine((val, ctx) => {
    const totalMarks = ctx.parent.totalMarks as number
    return val <= totalMarks
  }, 'Passing marks cannot exceed total marks'),
  duration: z.number({ required_error: 'Duration is required' }).min(15, 'Duration must be at least 15 minutes').max(300, 'Duration cannot exceed 300 minutes'),
  examDate: dateFields.examDate,
  startTime: dateFields.startTime,
  endTime: dateFields.endTime.refine((val, ctx) => {
    const startTime = ctx.parent.startTime as string
    return val > startTime
  }, 'End time must be after start time'),
})

export const examSchema = z.object({
  name: z.string().min(1, 'Exam name is required').min(3, 'Exam name must be at least 3 characters').max(100, 'Exam name cannot exceed 100 characters'),
  type: z.enum(['Mid-term', 'Final', 'Quiz', 'Assignment', 'Practical'], { required_error: 'Exam type is required' }),
  startDate: dateFields.startDate,
  endDate: dateFields.endDate.refine((val, ctx) => {
    const startDate = ctx.parent.startDate as string
    return val >= startDate
  }, 'End date must be on or after start date'),
  description: z.string().max(500, 'Description cannot exceed 500 characters').optional(),
  papers: z.array(examPaperSchema).optional(),
})

export const bookSchema = z.object({
  title: z.string().min(1, 'Title is required').min(3, 'Title must be at least 3 characters'),
  author: z.string().min(1, 'Author is required').min(2, 'Author name must be at least 2 characters'),
  isbn: z.string().min(1, 'ISBN is required').regex(/^(?:\d{9}[\dXx]|\d{13})$/, 'Invalid ISBN format (10 or 13 digits)'),
  category: z.enum(['Fiction', 'Non-Fiction', 'Science', 'Technology', 'History', 'Biography', 'Children', 'Reference', 'Other'], { required_error: 'Category is required' }),
  totalCopies: z.number({ required_error: 'Total copies is required' }).min(1, 'Must have at least 1 copy').max(1000, 'Cannot exceed 1000 copies'),
  availableCopies: z.number({ invalid_type_error: 'Available copies must be a number' }).min(0, 'Available copies cannot be negative').optional(),
  location: z.string().min(1, 'Location is required').min(2, 'Location must be at least 2 characters'),
  publisher: z.string().min(1, 'Publisher is required').min(2, 'Publisher name must be at least 2 characters'),
  publicationYear: dateFields.publicationYear,
  description: z.string().optional(),
})

export const behaviorRecordSchema = z.object({
  studentId: z.string().min(1, 'Student is required'),
  type: z.enum(['POSITIVE', 'NEGATIVE'], { required_error: 'Type is required' }),
  category: z.enum(['Academic', 'Behavioral', 'Discipline', 'Attendance', 'Social', 'Leadership', 'Other'], { required_error: 'Category is required' }),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  points: z.number({ required_error: 'Points are required' }).refine((val) => val !== 0, { message: 'Points cannot be zero' }),
  actionTaken: z.string().optional(),
  parentNotified: z.boolean().default(false),
})

export const curriculumFormSchema = z.object({
  name: z.string().min(1, 'Name is required').min(3, 'Name must be at least 3 characters'),
  subjectId: academicFields.subject,
  gradeId: academicFields.grade,
  academicYearId: academicFields.academicYear,
  description: z.string().optional(),
  objectives: z.string().optional(),
  topics: z.string().optional(),
})

export const lessonFormSchema = z.object({
  title: z.string().min(1, 'Title is required').min(3, 'Title must be at least 3 characters'),
  content: z.string().optional(),
  resources: z.string().optional(),
  date: dateFields.date,
  duration: z.number().min(1, 'Duration must be at least 1 minute').max(180, 'Duration cannot exceed 180 minutes'),
  status: z.enum(['Planned', 'Scheduled', 'Completed', 'Cancelled']),
})

export const sectionFormSchema = z.object({
  name: z.string().min(1, 'Section name is required').min(1, 'Section name must be at least 1 character').max(10, 'Section name cannot exceed 10 characters'),
  grade: z.string({ required_error: 'Grade is required' }).min(1, 'Grade is required'),
})

export type StudentFormData = z.infer<typeof studentFormSchema>
export type StudentUpdateData = Partial<StudentFormData>
export type StaffFormData = z.infer<typeof staffFormSchema>
export type AttendanceFormData = z.infer<typeof attendanceFormSchema>
export type AttendanceFilterData = z.infer<typeof attendanceFilterSchema>
export type AttendanceStatus = z.infer<typeof attendanceStatusSchema>
export type ExamInput = z.infer<typeof examSchema>
export type ExamPaperInput = z.infer<typeof examPaperSchema>
export type BookInput = z.infer<typeof bookSchema>
export type BehaviorRecordInput = z.infer<typeof behaviorRecordSchema>
export type CreateCurriculumFormData = z.infer<typeof curriculumFormSchema>
export type EditCurriculumFormData = z.infer<typeof curriculumFormSchema>
export type LessonFormData = z.infer<typeof lessonFormSchema>
export type SectionFormData = z.infer<typeof sectionFormSchema>

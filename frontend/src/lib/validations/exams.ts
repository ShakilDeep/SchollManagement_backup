import { z } from 'zod'

export const examPaperSchema = z.object({
  subjectId: z.string({
    required_error: 'Subject is required',
    invalid_type_error: 'Subject must be a string'
  }).min(1, 'Subject is required'),
  gradeId: z.string({
    required_error: 'Grade is required',
    invalid_type_error: 'Grade must be a string'
  }).min(1, 'Grade is required'),
  totalMarks: z.number({
    required_error: 'Total marks is required',
    invalid_type_error: 'Total marks must be a number'
  }).min(1, 'Total marks must be at least 1').max(1000, 'Total marks cannot exceed 1000'),
  passingMarks: z.number({
    required_error: 'Passing marks is required',
    invalid_type_error: 'Passing marks must be a number'
  }).min(0, 'Passing marks cannot be negative')
    .max(1000, 'Passing marks cannot exceed 1000')
    .refine((val, ctx) => {
      const totalMarks = ctx.parent.totalMarks as number
      return val <= totalMarks
    }, 'Passing marks cannot exceed total marks'),
  duration: z.number({
    required_error: 'Duration is required',
    invalid_type_error: 'Duration must be a number'
  }).min(15, 'Duration must be at least 15 minutes').max(300, 'Duration cannot exceed 300 minutes'),
  examDate: z.string({
    required_error: 'Exam date is required',
    invalid_type_error: 'Exam date must be a string'
  }).min(1, 'Exam date is required'),
  startTime: z.string({
    required_error: 'Start time is required',
    invalid_type_error: 'Start time must be a string'
  }).min(1, 'Start time is required'),
  endTime: z.string({
    required_error: 'End time is required',
    invalid_type_error: 'End time must be a string'
  }).min(1, 'End time is required')
    .refine((val, ctx) => {
      const startTime = ctx.parent.startTime as string
      return val > startTime
    }, 'End time must be after start time')
})

export const examSchema = z.object({
  name: z.string({
    required_error: 'Exam name is required',
    invalid_type_error: 'Exam name must be a string'
  }).min(1, 'Exam name is required')
   .min(3, 'Exam name must be at least 3 characters')
   .max(100, 'Exam name cannot exceed 100 characters'),
  type: z.enum(['Mid-term', 'Final', 'Quiz', 'Assignment', 'Practical'], {
    required_error: 'Exam type is required',
    invalid_type_error: 'Please select a valid exam type'
  }),
  startDate: z.string({
    required_error: 'Start date is required',
    invalid_type_error: 'Start date must be a string'
  }).min(1, 'Start date is required'),
  endDate: z.string({
    required_error: 'End date is required',
    invalid_type_error: 'End date must be a string'
  }).min(1, 'End date is required')
    .refine((val, ctx) => {
      const startDate = ctx.parent.startDate as string
      return val >= startDate
    }, 'End date must be on or after start date'),
  description: z.string().max(500, 'Description cannot exceed 500 characters').optional(),
  papers: z.array(examPaperSchema).optional()
})

export type ExamInput = z.infer<typeof examSchema>
export type ExamPaperInput = z.infer<typeof examPaperSchema>

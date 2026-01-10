import { z } from 'zod'

export const createCurriculumFormSchema = z.object({
  name: z.string().min(1, 'Name is required').min(3, 'Name must be at least 3 characters'),
  subjectId: z.string().min(1, 'Subject is required'),
  gradeId: z.string().min(1, 'Grade is required'),
  academicYearId: z.string().min(1, 'Academic year is required'),
  description: z.string().optional(),
  objectives: z.string().optional(),
  topics: z.string().optional()
})

export const editCurriculumFormSchema = createCurriculumFormSchema

export const lessonFormSchema = z.object({
  title: z.string().min(1, 'Title is required').min(3, 'Title must be at least 3 characters'),
  content: z.string().optional(),
  resources: z.string().optional(),
  date: z.string().min(1, 'Date is required'),
  duration: z.number().min(1, 'Duration must be at least 1 minute').max(180, 'Duration cannot exceed 180 minutes'),
  status: z.enum(['Planned', 'Scheduled', 'Completed', 'Cancelled'])
})

export type CreateCurriculumFormData = z.infer<typeof createCurriculumFormSchema>
export type EditCurriculumFormData = z.infer<typeof editCurriculumFormSchema>
export type LessonFormData = z.infer<typeof lessonFormSchema>

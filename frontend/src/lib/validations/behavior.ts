import { z } from 'zod'

export const behaviorRecordSchema = z.object({
  studentId: z.string().min(1, 'Student is required'),
  type: z.enum(['POSITIVE', 'NEGATIVE'], {
    required_error: 'Type is required',
    invalid_type_error: 'Type must be either POSITIVE or NEGATIVE'
  }),
  category: z.enum(['Academic', 'Behavioral', 'Discipline', 'Attendance', 'Social', 'Leadership', 'Other'], {
    required_error: 'Category is required',
    invalid_type_error: 'Please select a valid category'
  }),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  points: z.number({
    required_error: 'Points are required',
    invalid_type_error: 'Points must be a number'
  }).refine(val => val !== 0, {
    message: 'Points cannot be zero'
  }),
  actionTaken: z.string().optional(),
  parentNotified: z.boolean().default(false)
})

export type BehaviorRecordInput = z.infer<typeof behaviorRecordSchema>

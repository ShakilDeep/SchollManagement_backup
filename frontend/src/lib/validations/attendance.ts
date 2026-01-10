import { z } from 'zod'

export const attendanceStatusSchema = z.enum(['Present', 'Absent', 'Late', 'HalfDay'], {
  required_error: 'Attendance status is required',
})

export const attendanceFormSchema = z.object({
  date: z
    .string({
      required_error: 'Date is required',
    })
    .refine((val) => !isNaN(Date.parse(val)), 'Invalid date format'),
  gradeId: z.string().optional(),
  sectionId: z.string().optional(),
  attendanceData: z.array(
    z.object({
      id: z.string({
        required_error: 'Student ID is required',
      }),
      status: attendanceStatusSchema,
    })
  ),
})

export type AttendanceFormData = z.infer<typeof attendanceFormSchema>
export type AttendanceStatus = z.infer<typeof attendanceStatusSchema>

export const attendanceFilterSchema = z.object({
  date: z
    .string({
      required_error: 'Date is required',
    })
    .refine((val) => !isNaN(Date.parse(val)), 'Invalid date format'),
  gradeId: z.string().optional(),
  sectionId: z.string().optional(),
  search: z.string().optional(),
})

export type AttendanceFilterData = z.infer<typeof attendanceFilterSchema>

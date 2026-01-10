import { z } from 'zod'

export const studentFormSchema = z.object({
  firstName: z
    .string()
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name cannot exceed 50 characters'),
  lastName: z
    .string()
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name cannot exceed 50 characters'),
  rollNumber: z
    .string()
    .min(1, 'Roll number is required')
    .max(20, 'Roll number cannot exceed 20 characters')
    .regex(/^[A-Za-z0-9-]+$/, 'Roll number can only contain letters, numbers, and hyphens'),
  gender: z
    .enum(['male', 'female', 'other'], {
      required_error: 'Gender is required',
    }),
  grade: z
    .string({
      required_error: 'Grade is required',
    })
    .min(1, 'Grade is required'),
  section: z
    .string({
      required_error: 'Section is required',
    })
    .min(1, 'Section is required'),
  phone: z
    .string()
    .min(10, 'Phone number must be at least 10 digits')
    .max(15, 'Phone number cannot exceed 15 digits')
    .regex(/^[+]?[0-9-]+$/, 'Phone number can only contain numbers, hyphens, and optional +'),
  email: z
    .string()
    .email('Invalid email address')
    .max(100, 'Email cannot exceed 100 characters')
    .optional()
    .or(z.literal('')),
  guardianName: z
    .string()
    .min(2, 'Guardian name must be at least 2 characters')
    .max(100, 'Guardian name cannot exceed 100 characters'),
  relationship: z
    .string()
    .min(2, 'Relationship must be at least 2 characters')
    .max(50, 'Relationship cannot exceed 50 characters'),
  guardianPhone: z
    .string()
    .min(10, 'Guardian phone must be at least 10 digits')
    .max(15, 'Guardian phone cannot exceed 15 digits')
    .regex(/^[+]?[0-9-]+$/, 'Guardian phone can only contain numbers, hyphens, and optional +'),
  address: z
    .string()
    .max(500, 'Address cannot exceed 500 characters')
    .optional()
    .or(z.literal('')),
  medicalInfo: z
    .string()
    .max(1000, 'Medical information cannot exceed 1000 characters')
    .optional()
    .or(z.literal('')),
})

export type StudentFormData = z.infer<typeof studentFormSchema>

export const studentUpdateSchema = studentFormSchema.partial()

export type StudentUpdateData = z.infer<typeof studentUpdateSchema>

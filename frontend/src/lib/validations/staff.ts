import { z } from 'zod'

export const staffFormSchema = z.object({
  firstName: z.string().min(1, 'First name is required').min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(1, 'Last name is required').min(2, 'Last name must be at least 2 characters'),
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  phone: z.string().min(1, 'Phone number is required').min(10, 'Phone number must be at least 10 characters'),
  type: z.enum(['Teacher', 'Staff'], { required_error: 'Role type is required' }),
  department: z.string().min(1, 'Department is required').min(2, 'Department must be at least 2 characters'),
  designation: z.string().min(1, 'Designation is required').min(2, 'Designation must be at least 2 characters'),
  gender: z.enum(['Male', 'Female', 'Other'], { required_error: 'Gender is required' }),
  dateOfBirth: z.string().optional(),
  qualification: z.string().optional(),
  address: z.string().optional(),
  experience: z.string().optional(),
  salary: z.string().optional()
}).refine(
  (data) => data.type === 'Teacher' ? !!data.experience : true,
  { path: ['experience'], message: 'Experience is required for teachers' }
)

export type StaffFormData = z.infer<typeof staffFormSchema>

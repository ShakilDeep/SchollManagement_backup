export interface Student {
  id: string
  user?: string | number
  fullName: string
  firstName: string
  lastName: string
  // Derived field for display
  name?: string
  rollNumber: string
  admissionNumber: string
  admissionDate: string
  gender: string
  dateOfBirth?: string
  bloodGroup?: string
  phone: string
  email?: string
  emergencyContact?: string
  emergencyPhone?: string
  address?: string
  city?: string
  state?: string
  zipCode?: string
  grade: string // ID from backend
  gradeName?: string // Display name
  gradeDisplay?: string // Alternative display field
  section: string // ID from backend
  sectionName?: string // Display name
  sectionDisplay?: string // Alternative display field
  academicYear?: string
  academicYearName?: string
  guardian?: string
  relationship?: string
  status: 'Active' | 'Inactive'
  photo?: string
  avatar?: string // Derived from photo or first letter of name
}
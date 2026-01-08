export interface Student {
  id: string
  rollNumber: string
  name: string
  grade: string
  section: string
  status: 'Active' | 'Inactive'
  guardian: string
  phone: string
  admissionDate: string
  avatar: string
  email: string
  address: string
}
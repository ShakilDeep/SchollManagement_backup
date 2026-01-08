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

export const students: Student[] = [
  {
    id: '1',
    rollNumber: '2024-001',
    name: 'Sarah Johnson',
    grade: 'Grade 10',
    section: 'A',
    status: 'Active',
    guardian: 'Michael Johnson',
    phone: '+1 234-567-8901',
    admissionDate: '2024-01-15',
    avatar: 'SJ',
    email: 'sarah.j@school.com',
    address: '123 Maple Ave, Springfield'
  },
  {
    id: '2',
    rollNumber: '2024-002',
    name: 'David Smith',
    grade: 'Grade 10',
    section: 'B',
    status: 'Active',
    guardian: 'Robert Smith',
    phone: '+1 234-567-8902',
    admissionDate: '2024-01-15',
    avatar: 'DS',
    email: 'david.s@school.com',
    address: '456 Oak Ln, Springfield'
  },
  {
    id: '3',
    rollNumber: '2024-003',
    name: 'Emily Brown',
    grade: 'Grade 9',
    section: 'A',
    status: 'Active',
    guardian: 'James Brown',
    phone: '+1 234-567-8903',
    admissionDate: '2024-01-16',
    avatar: 'EB',
    email: 'emily.b@school.com',
    address: '789 Pine Rd, Springfield'
  },
  {
    id: '4',
    rollNumber: '2024-004',
    name: 'James Wilson',
    grade: 'Grade 11',
    section: 'C',
    status: 'Active',
    guardian: 'William Wilson',
    phone: '+1 234-567-8904',
    admissionDate: '2024-01-10',
    avatar: 'JW',
    email: 'james.w@school.com',
    address: '101 Cedar Blvd, Springfield'
  },
  {
    id: '5',
    rollNumber: '2024-005',
    name: 'Sophia Davis',
    grade: 'Grade 9',
    section: 'B',
    status: 'Inactive',
    guardian: 'Thomas Davis',
    phone: '+1 234-567-8905',
    admissionDate: '2024-01-12',
    avatar: 'SD',
    email: 'sophia.d@school.com',
    address: '202 Birch St, Springfield'
  },
  {
    id: '6',
    rollNumber: '2024-006',
    name: 'Michael Lee',
    grade: 'Grade 12',
    section: 'A',
    status: 'Active',
    guardian: 'Richard Lee',
    phone: '+1 234-567-8906',
    admissionDate: '2024-01-20',
    avatar: 'ML',
    email: 'michael.l@school.com',
    address: '303 Elm Dr, Springfield'
  }
]

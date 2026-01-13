export interface PrefetchQueryConfig {
  queryKey: string[]
  queryFn: () => Promise<any>
}

export interface RoutePrefetchConfig {
  [route: string]: PrefetchQueryConfig[]
}

const fetchStaff = async () => {
  const response = await fetch('/api/staff')
  if (!response.ok) {
    throw new Error('Failed to fetch staff')
  }
  return response.json()
}

const fetchStaffPredictions = async () => {
  const response = await fetch('/api/staff/predictions')
  if (!response.ok) {
    throw new Error('Failed to fetch staff predictions')
  }
  return response.json()
}

const fetchInventory = async () => {
  const response = await fetch('/api/inventory')
  if (!response.ok) {
    throw new Error('Failed to fetch inventory')
  }
  return response.json()
}

const fetchStudents = async () => {
  const response = await fetch('/api/students')
  if (!response.ok) {
    throw new Error('Failed to fetch students')
  }
  return response.json()
}

const fetchAttendance = async () => {
  const response = await fetch('/api/attendance')
  if (!response.ok) {
    throw new Error('Failed to fetch attendance')
  }
  return response.json()
}

const fetchTimetable = async () => {
  const response = await fetch('/api/timetable')
  if (!response.ok) {
    throw new Error('Failed to fetch timetable')
  }
  return response.json()
}

const fetchTimetablePredictions = async () => {
  const response = await fetch('/api/timetable/predictions')
  if (!response.ok) {
    throw new Error('Failed to fetch timetable predictions')
  }
  return response.json()
}

const fetchExams = async () => {
  const response = await fetch('/api/exams')
  if (!response.ok) {
    throw new Error('Failed to fetch exams')
  }
  return response.json()
}

const fetchExamResults = async () => {
  const response = await fetch('/api/exam-results')
  if (!response.ok) {
    throw new Error('Failed to fetch exam results')
  }
  return response.json()
}

const fetchSubjects = async () => {
  const response = await fetch('/api/subjects')
  if (!response.ok) {
    throw new Error('Failed to fetch subjects')
  }
  return response.json()
}

const fetchGrades = async () => {
  const response = await fetch('/api/grades')
  if (!response.ok) {
    throw new Error('Failed to fetch grades')
  }
  return response.json()
}

const fetchLibraryBooks = async () => {
  const response = await fetch('/api/library/books')
  if (!response.ok) {
    throw new Error('Failed to fetch library books')
  }
  return response.json()
}

const fetchLibraryBorrowals = async () => {
  const response = await fetch('/api/library/borrowals')
  if (!response.ok) {
    throw new Error('Failed to fetch library borrowals')
  }
  return response.json()
}

const fetchTransportVehicles = async () => {
  const response = await fetch('/api/transport/vehicles')
  if (!response.ok) {
    throw new Error('Failed to fetch transport vehicles')
  }
  return response.json()
}

const fetchTransportAllocations = async () => {
  const response = await fetch('/api/transport/allocations')
  if (!response.ok) {
    throw new Error('Failed to fetch transport allocations')
  }
  return response.json()
}

const fetchHostels = async () => {
  const response = await fetch('/api/hostels')
  if (!response.ok) {
    throw new Error('Failed to fetch hostels')
  }
  return response.json()
}

const fetchHostelRooms = async () => {
  const response = await fetch('/api/hostels/rooms')
  if (!response.ok) {
    throw new Error('Failed to fetch hostel rooms')
  }
  return response.json()
}

const fetchHostelAllocations = async () => {
  const response = await fetch('/api/hostels/allocations')
  if (!response.ok) {
    throw new Error('Failed to fetch hostel allocations')
  }
  return response.json()
}

const fetchMessages = async () => {
  const response = await fetch('/api/messages')
  if (!response.ok) {
    throw new Error('Failed to fetch messages')
  }
  return response.json()
}

const fetchCurriculum = async () => {
  const response = await fetch('/api/curriculum')
  if (!response.ok) {
    throw new Error('Failed to fetch curriculum')
  }
  return response.json()
}

const fetchLessons = async () => {
  const response = await fetch('/api/lessons')
  if (!response.ok) {
    throw new Error('Failed to fetch lessons')
  }
  return response.json()
}

const fetchTeachers = async () => {
  const response = await fetch('/api/teachers')
  if (!response.ok) {
    throw new Error('Failed to fetch teachers')
  }
  return response.json()
}

const fetchAcademicYears = async () => {
  const response = await fetch('/api/academic-years')
  if (!response.ok) {
    throw new Error('Failed to fetch academic years')
  }
  return response.json()
}

export const routePrefetchConfig: RoutePrefetchConfig = {
  '/dashboard/staff': [
    { queryKey: ['staff'], queryFn: fetchStaff },
    { queryKey: ['staff-predictions'], queryFn: fetchStaffPredictions },
  ],
  '/dashboard/inventory': [
    { queryKey: ['inventory'], queryFn: fetchInventory },
  ],
  '/dashboard/students': [
    { queryKey: ['students'], queryFn: fetchStudents },
  ],
  '/dashboard/attendance': [
    { queryKey: ['attendance'], queryFn: fetchAttendance },
  ],
  '/dashboard/timetable': [
    { queryKey: ['timetable'], queryFn: fetchTimetable },
    { queryKey: ['timetable-predictions'], queryFn: fetchTimetablePredictions },
  ],
  '/dashboard/exams': [
    { queryKey: ['exams'], queryFn: fetchExams },
    { queryKey: ['exam-results'], queryFn: fetchExamResults },
    { queryKey: ['subjects'], queryFn: fetchSubjects },
    { queryKey: ['grades'], queryFn: fetchGrades },
  ],
  '/dashboard/library': [
    { queryKey: ['library-books'], queryFn: fetchLibraryBooks },
    { queryKey: ['library-borrowals'], queryFn: fetchLibraryBorrowals },
  ],
  '/dashboard/transport': [
    { queryKey: ['transport-vehicles'], queryFn: fetchTransportVehicles },
    { queryKey: ['transport-allocations'], queryFn: fetchTransportAllocations },
  ],
  '/dashboard/hostel': [
    { queryKey: ['hostels'], queryFn: fetchHostels },
    { queryKey: ['hostel-rooms'], queryFn: fetchHostelRooms },
    { queryKey: ['hostel-allocations'], queryFn: fetchHostelAllocations },
  ],
  '/dashboard/messages': [
    { queryKey: ['messages'], queryFn: fetchMessages },
  ],
  '/dashboard/curriculum': [
    { queryKey: ['subjects'], queryFn: fetchSubjects },
    { queryKey: ['grades'], queryFn: fetchGrades },
    { queryKey: ['academic-years'], queryFn: fetchAcademicYears },
    { queryKey: ['teachers'], queryFn: fetchTeachers },
    { queryKey: ['curriculum'], queryFn: fetchCurriculum },
    { queryKey: ['lessons'], queryFn: fetchLessons },
  ],
}

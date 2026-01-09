'use client'

import { useState, useEffect, useMemo, useCallback, memo, lazy, Suspense } from 'react'
import Link from 'next/link'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Search,
  Download,
  Filter,
  UserPlus,
  GraduationCap,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Shield,
  Eye,
  Edit
} from 'lucide-react'

import { type Student } from '@/types/student'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { StudentCard } from './components/student-card'
import { StudentsPageSkeleton } from './components/students-skeleton'
import { StatsCards } from './components/stats-cards'

const AddStudentDialog = lazy(() => import('./components/add-student-dialog'))

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [gradeFilter, setGradeFilter] = useState('all')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)

  const debouncedSearchTerm = useDebouncedValue(searchTerm, 300)

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await fetch('/api/students')
        if (!res.ok) throw new Error('Failed to fetch students')
        const data = await res.json()
        setStudents(data)
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }
    fetchStudents()
  }, [])

  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const matchesSearch =
        student.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        student.rollNumber.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      const matchesStatus = statusFilter === 'all' || student.status === statusFilter
      const matchesGrade = gradeFilter === 'all' || student.grade === gradeFilter
      return matchesSearch && matchesStatus && matchesGrade
    })
  }, [students, debouncedSearchTerm, statusFilter, gradeFilter])

  const stats = useMemo(() => {
    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()
    
    return {
      total: students.length,
      active: students.filter((s) => s.status === 'Active').length,
      inactive: students.filter((s) => s.status === 'Inactive').length,
      newThisMonth: students.filter((s) => {
        const admissionDate = new Date(s.admissionDate)
        return admissionDate.getMonth() === currentMonth && admissionDate.getFullYear() === currentYear
      }).length
    }
  }, [students])

  const exportStudentsToCSV = useCallback(() => {
    const headers = ['Roll Number', 'Name', 'Grade', 'Section', 'Status', 'Guardian', 'Phone', 'Email', 'Admission Date']
    const csvData = filteredStudents.map(student => [
      student.rollNumber,
      student.name,
      student.grade,
      student.section,
      student.status,
      student.guardian,
      student.phone,
      student.email,
      student.admissionDate
    ])
    
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `students_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }, [filteredStudents])

  const handleAddStudent = useCallback(async (studentData: any) => {
    try {
      const response = await fetch('/api/students', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...studentData,
          status: 'Active'
        }),
      })
      
      if (!response.ok) {
        const error = await response.text()
        throw new Error(error)
      }
      
      const res = await fetch('/api/students')
      if (res.ok) {
        const data = await res.json()
        setStudents(data)
      }
      
      return { success: true }
    } catch (error) {
      console.error('Error adding student:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }, [])

  return (
    <DashboardLayout>
      <div className="space-y-8 pb-8" style={{ contentVisibility: 'auto' }}>
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
              Students
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              Manage your student community with ease
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              className="rounded-2xl px-6 py-3 h-12"
              onClick={exportStudentsToCSV}
            >
              <Download className="mr-2 w-5 h-5" />
              Export
            </Button>
            <Suspense fallback={<Button className="rounded-2xl px-6 py-3 h-12">Loading...</Button>}>
              <AddStudentDialog 
                open={isAddDialogOpen} 
                onOpenChange={setIsAddDialogOpen}
                onSubmit={handleAddStudent}
              />
            </Suspense>
            <Button 
              className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 rounded-2xl px-6 py-3 h-12 text-base font-semibold shadow-xl shadow-blue-500/30"
              onClick={() => setIsAddDialogOpen(true)}
            >
              <UserPlus className="mr-2 w-5 h-5" />
              Add Student
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatsCards 
            total={stats.total}
            active={stats.active}
            newThisMonth={stats.newThisMonth}
            inactive={stats.inactive}
          />
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input
              placeholder="Search by name or roll number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 pr-4 h-12 rounded-2xl border-2 border-slate-200 dark:border-slate-700 focus:border-violet-500"
            />
          </div>
          <div className="flex gap-3">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px] h-12 rounded-2xl">
                <Filter className="mr-2 w-5 h-5" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Select value={gradeFilter} onValueChange={setGradeFilter}>
              <SelectTrigger className="w-[180px] h-12 rounded-2xl">
                <Filter className="mr-2 w-5 h-5" />
                <SelectValue placeholder="Grade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Grades</SelectItem>
                <SelectItem value="Grade 9">Grade 9</SelectItem>
                <SelectItem value="Grade 10">Grade 10</SelectItem>
                <SelectItem value="Grade 11">Grade 11</SelectItem>
                <SelectItem value="Grade 12">Grade 12</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3" style={{ contentVisibility: 'auto', containIntrinsicSize: '400px' }}>
          {filteredStudents.length === 0 ? (
            <div className="col-span-full py-16 text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <Search className="w-10 h-10 text-slate-400" />
              </div>
              <p className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                No students found
              </p>
              <p className="text-slate-600 dark:text-slate-400">
                Try adjusting your search or filters
              </p>
            </div>
          ) : (
            filteredStudents.map((student) => (
              <StudentCard key={student.id} student={student} />
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}

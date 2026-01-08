'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Plus,
  Search,
  MoreVertical,
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

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [gradeFilter, setGradeFilter] = useState('all')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    rollNumber: '',
    gender: '',
    grade: '',
    section: '',
    phone: '',
    email: '',
    guardianName: '',
    relationship: '',
    guardianPhone: '',
    address: '',
    medicalInfo: ''
  })

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

  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.rollNumber.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || student.status === statusFilter
    const matchesGrade = gradeFilter === 'all' || student.grade === gradeFilter
    return matchesSearch && matchesStatus && matchesGrade
  })

  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()
  
  const stats = {
    total: students.length,
    active: students.filter((s) => s.status === 'Active').length,
    inactive: students.filter((s) => s.status === 'Inactive').length,
    newThisMonth: students.filter((s) => {
      const admissionDate = new Date(s.admissionDate)
      return admissionDate.getMonth() === currentMonth && admissionDate.getFullYear() === currentYear
    }).length
  }

  const exportStudentsToCSV = () => {
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
    console.log('CSV export completed')
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    console.log('Submitting student data:', formData)
    
    try {
      const response = await fetch('/api/students', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          status: 'Active'
        }),
      })
      
      if (!response.ok) {
        const error = await response.text()
        console.error('Error response:', error)
        alert('Error adding student: ' + error)
        return
      }
      
      const result = await response.json()
      console.log('Student added successfully:', result)
      
      // Reset form
      setFormData({
        firstName: '',
        lastName: '',
        rollNumber: '',
        gender: '',
        grade: '',
        section: '',
        phone: '',
        email: '',
        guardianName: '',
        relationship: '',
        guardianPhone: '',
        address: '',
        medicalInfo: ''
      })
      
      // Close dialog
      setIsAddDialogOpen(false)
      
      // Refresh students list
      const res = await fetch('/api/students')
      if (res.ok) {
        const data = await res.json()
        setStudents(data)
      }
      
      alert('Student added successfully!')
    } catch (error) {
      console.error('Error adding student:', error)
      alert('Error adding student. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 pb-8">
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
              onClick={() => {
                console.log('Exporting student data...')
                exportStudentsToCSV()
              }}
            >
              <Download className="mr-2 w-5 h-5" />
              Export
            </Button>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 rounded-2xl px-6 py-3 h-12 text-base font-semibold shadow-xl shadow-blue-500/30"
                >
                  <UserPlus className="mr-2 w-5 h-5" />
                  Add Student
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-3xl">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold">Add New Student</DialogTitle>
                  <DialogDescription className="text-base">
                    Register a new student in the system
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid gap-6 py-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <Label className="text-base font-semibold">First Name</Label>
                      <Input 
                        placeholder="Enter first name" 
                        className="h-12 rounded-2xl"
                        value={formData.firstName}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-3">
                      <Label className="text-base font-semibold">Last Name</Label>
                      <Input 
                        placeholder="Enter last name" 
                        className="h-12 rounded-2xl"
                        value={formData.lastName}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <Label className="text-base font-semibold">Roll Number</Label>
                      <Input 
                        placeholder="e.g., 2024-007" 
                        className="h-12 rounded-2xl"
                        value={formData.rollNumber}
                        onChange={(e) => handleInputChange('rollNumber', e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-3">
                      <Label className="text-base font-semibold">Gender</Label>
                      <Select value={formData.gender} onValueChange={(value) => handleInputChange('gender', value)}>
                        <SelectTrigger className="h-12 rounded-2xl">
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <Label className="text-base font-semibold">Grade</Label>
                      <Select value={formData.grade} onValueChange={(value) => handleInputChange('grade', value)}>
                        <SelectTrigger className="h-12 rounded-2xl">
                          <SelectValue placeholder="Select grade" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Grade 9">Grade 9</SelectItem>
                          <SelectItem value="Grade 10">Grade 10</SelectItem>
                          <SelectItem value="Grade 11">Grade 11</SelectItem>
                          <SelectItem value="Grade 12">Grade 12</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-3">
                      <Label className="text-base font-semibold">Section</Label>
                      <Select value={formData.section} onValueChange={(value) => handleInputChange('section', value)}>
                        <SelectTrigger className="h-12 rounded-2xl">
                          <SelectValue placeholder="Select section" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="A">Section A</SelectItem>
                          <SelectItem value="B">Section B</SelectItem>
                          <SelectItem value="C">Section C</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-base font-semibold">Phone Number</Label>
                    <Input 
                      placeholder="+1 234-567-8900" 
                      className="h-12 rounded-2xl"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                    />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-base font-semibold">Email</Label>
                    <Input 
                      type="email" 
                      placeholder="student@example.com" 
                      className="h-12 rounded-2xl"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <Label className="text-base font-semibold">Guardian Name</Label>
                      <Input 
                        placeholder="Guardian's full name" 
                        className="h-12 rounded-2xl"
                        value={formData.guardianName}
                        onChange={(e) => handleInputChange('guardianName', e.target.value)}
                      />
                    </div>
                    <div className="space-y-3">
                      <Label className="text-base font-semibold">Relationship</Label>
                      <Input 
                        placeholder="e.g., Father, Mother" 
                        className="h-12 rounded-2xl"
                        value={formData.relationship}
                        onChange={(e) => handleInputChange('relationship', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-base font-semibold">Guardian Phone</Label>
                    <Input 
                      placeholder="+1 234-567-8900" 
                      className="h-12 rounded-2xl"
                      value={formData.guardianPhone}
                      onChange={(e) => handleInputChange('guardianPhone', e.target.value)}
                    />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-base font-semibold">Address</Label>
                    <Textarea 
                      placeholder="Enter full address" 
                      className="min-h-[120px] rounded-2xl resize-none"
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                    />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-base font-semibold">Medical Information</Label>
                    <Textarea 
                      placeholder="Any allergies, medical conditions, or special needs" 
                      className="min-h-[100px] rounded-2xl resize-none"
                      value={formData.medicalInfo}
                      onChange={(e) => handleInputChange('medicalInfo', e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter className="gap-3">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsAddDialogOpen(false)}
                    className="rounded-2xl px-6 py-3 h-12"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 rounded-2xl px-6 py-3 h-12 text-base font-semibold"
                    disabled={isSubmitting}
                  >
                    <UserPlus className="mr-2 w-5 h-5" />
                    {isSubmitting ? 'Adding Student...' : 'Add Student'}
                  </Button>
                </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-3xl p-6 text-white shadow-xl shadow-blue-500/30">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div className="bg-white/20 backdrop-blur px-3 py-1 rounded-full text-sm font-semibold">
                Total
              </div>
            </div>
            <p className="text-4xl font-bold mb-1">{stats.total}</p>
            <p className="text-white/80">Registered students</p>
          </div>
          
          <div className="bg-gradient-to-br from-emerald-500 to-teal-500 rounded-3xl p-6 text-white shadow-xl shadow-emerald-500/30">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
                <Shield className="w-6 h-6" />
              </div>
              <div className="bg-white/20 backdrop-blur px-3 py-1 rounded-full text-sm font-semibold">
                Active
              </div>
            </div>
            <p className="text-4xl font-bold mb-1">{stats.active}</p>
            <p className="text-white/80">Currently enrolled</p>
          </div>

          <div className="bg-gradient-to-br from-violet-500 to-purple-500 rounded-3xl p-6 text-white shadow-xl shadow-violet-500/30">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
                <UserPlus className="w-6 h-6" />
              </div>
              <div className="bg-white/20 backdrop-blur px-3 py-1 rounded-full text-sm font-semibold">
                New
              </div>
            </div>
            <p className="text-4xl font-bold mb-1">{stats.newThisMonth}</p>
            <p className="text-white/80">This month</p>
          </div>

          <div className="bg-gradient-to-br from-slate-800 to-slate-900 dark:from-slate-700 dark:to-slate-800 rounded-3xl p-6 text-white shadow-xl">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center">
                <Phone className="w-6 h-6" />
              </div>
              <div className="bg-white/10 backdrop-blur px-3 py-1 rounded-full text-sm font-semibold">
                Info
              </div>
            </div>
            <p className="text-4xl font-bold mb-1">{stats.inactive}</p>
            <p className="text-white/80">Inactive accounts</p>
          </div>
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

        {/* Student Cards Grid */}
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
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
              <div 
                key={student.id}
                className="group relative overflow-hidden bg-white dark:bg-slate-900/50 rounded-3xl p-6 shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 border-2 border-transparent hover:border-violet-500"
              >
                {/* Status Badge */}
                <div className="absolute top-4 right-4">
                  <Badge 
                    className={cn(
                      'px-4 py-1.5 rounded-full text-sm font-semibold',
                      student.status === 'Active'
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-500 text-white'
                    )}
                  >
                    {student.status}
                  </Badge>
                </div>

                {/* Avatar */}
                <div className="mb-4">
                  <div className={cn(
                    'w-16 h-16 rounded-2xl flex items-center justify-center text-white text-xl font-bold',
                    'bg-gradient-to-br from-violet-500 to-purple-600',
                    'shadow-lg shadow-violet-500/30'
                  )}>
                    {student.avatar}
                  </div>
                </div>

                {/* Student Info */}
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">
                      {student.rollNumber}
                    </p>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                      {student.name}
                    </h3>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <MapPin className="w-4 h-4" />
                    <span>{student.grade} - {student.section}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <Phone className="w-4 h-4" />
                    <span>{student.phone}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <Mail className="w-4 h-4" />
                    <span>Guardian: {student.guardian}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <Calendar className="w-4 h-4" />
                    <span>Joined: {student.admissionDate}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <Link href={`/dashboard/students/${student.id}`} className="flex-1">
                    <Button 
                      variant="outline" 
                      className="w-full rounded-xl h-11"
                    >
                      <Eye className="mr-2 w-4 h-4" />
                      View
                    </Button>
                  </Link>
                  <Link href={`/dashboard/students/${student.id}?action=edit`} className="flex-1">
                    <Button 
                      className="w-full bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 rounded-xl h-11"
                    >
                      <Edit className="mr-2 w-4 h-4" />
                      Edit
                    </Button>
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}

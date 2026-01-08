'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
  Eye,
  Edit,
  Trash2,
  Filter,
  Briefcase,
  GraduationCap,
  Loader2,
  Users
} from 'lucide-react'

interface Staff {
  id: string
  employeeId: string
  name: string
  type: 'Teacher' | 'Staff'
  department: string
  designation: string
  status: string
  phone: string
  email: string
  joinDate: string
}

interface StaffFormData {
  firstName: string
  lastName: string
  email: string
  phone: string
  type: 'Teacher' | 'Staff'
  department: string
  designation: string
  gender: string
  dateOfBirth: string
  qualification: string
  address: string
  experience: string
  salary: string
}

export default function StaffPage() {
  const [staff, setStaff] = useState<Staff[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [departmentFilter, setDepartmentFilter] = useState('all')
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null)
  const [selectedStaffDetails, setSelectedStaffDetails] = useState<any>(null)
  
  const [formData, setFormData] = useState<StaffFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    type: 'Teacher',
    department: '',
    designation: '',
    gender: 'Male',
    dateOfBirth: '',
    qualification: '',
    address: '',
    experience: '',
    salary: ''
  })
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const fetchStaff = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/staff')
      if (!response.ok) {
        throw new Error('Failed to fetch staff')
      }
      const data = await response.json()
      setStaff(data)
    } catch (err) {
      setError('Failed to load staff data')
      console.error('Error fetching staff:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStaff()
  }, [])

  const filteredStaff = staff.filter((member) => {
    const matchesSearch =
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.employeeId.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = typeFilter === 'all' || member.type === typeFilter
    const matchesDept = departmentFilter === 'all' || member.department === departmentFilter
    return matchesSearch && matchesType && matchesDept
  })

  const stats = {
    total: staff.length,
    teachers: staff.filter((s) => s.type === 'Teacher').length,
    staff: staff.filter((s) => s.type === 'Staff').length,
    active: staff.filter((s) => s.status === 'Active').length,
    onLeave: staff.filter((s) => s.status === 'On Leave').length
  }

  const handleViewStaff = async (staffMember: Staff) => {
    try {
      setSelectedStaff(staffMember)
      const response = await fetch(`/api/staff/${staffMember.id}`)
      if (!response.ok) {
        throw new Error('Failed to fetch staff details')
      }
      const data = await response.json()
      setSelectedStaffDetails(data)
      setIsViewDialogOpen(true)
    } catch (err) {
      console.error('Error fetching staff details:', err)
    }
  }

  const handleEditStaff = async (staffMember: Staff) => {
    try {
      setSelectedStaff(staffMember)
      const response = await fetch(`/api/staff/${staffMember.id}`)
      if (!response.ok) {
        throw new Error('Failed to fetch staff details')
      }
      const data = await response.json()
      setSelectedStaffDetails(data)
      setFormData({
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        email: data.email || '',
        phone: data.phone || '',
        type: data.type || 'Teacher',
        department: data.department || '',
        designation: data.designation || '',
        gender: data.gender || 'Male',
        dateOfBirth: data.dateOfBirth || '',
        qualification: data.qualification || '',
        address: data.address || '',
        experience: data.experience ? data.experience.toString() : '',
        salary: data.salary ? data.salary.toString() : ''
      })
      setIsEditDialogOpen(true)
    } catch (err) {
      console.error('Error fetching staff details:', err)
    }
  }

  const handleDeleteClick = (staffMember: Staff) => {
    setSelectedStaff(staffMember)
    setIsDeleteDialogOpen(true)
  }

  const handleCloseViewDialog = () => {
    setIsViewDialogOpen(false)
    setSelectedStaff(null)
    setSelectedStaffDetails(null)
  }

  const handleCloseEditDialog = () => {
    setIsEditDialogOpen(false)
    setSelectedStaff(null)
    setSelectedStaffDetails(null)
    setSubmitError(null)
  }

  const handleCloseDeleteDialog = () => {
    setIsDeleteDialogOpen(false)
    setSelectedStaff(null)
    setSubmitError(null)
  }

  const resetAddForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      type: 'Teacher',
      department: '',
      designation: '',
      gender: 'Male',
      dateOfBirth: '',
      qualification: '',
      address: '',
      experience: '',
      salary: ''
    })
    setSubmitError(null)
  }

  const handleCloseAddDialog = () => {
    setIsAddDialogOpen(false)
    resetAddForm()
  }

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const response = await fetch('/api/staff', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to add staff member')
      }

      await fetchStaff()
      handleCloseAddDialog()
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to add staff member')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedStaff) return

    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const response = await fetch(`/api/staff/${selectedStaff.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          status: selectedStaffDetails?.status,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update staff member')
      }

      await fetchStaff()
      handleCloseEditDialog()
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to update staff member')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteStaff = async () => {
    if (!selectedStaff) return

    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const response = await fetch(`/api/staff/${selectedStaff.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete staff member')
      }

      await fetchStaff()
      handleCloseDeleteDialog()
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to delete staff member')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <p className="text-neutral-900 font-medium">{error}</p>
            <Button onClick={fetchStaff} className="mt-4">
              Retry
            </Button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Staff & HR</h1>
            <p className="text-neutral-500 mt-1 leading-relaxed text-sm">
              Manage teachers, staff, and human resources
            </p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-neutral-900 hover:bg-neutral-800">
                <Plus className="mr-2 h-4 w-4" />
                Add Staff Member
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader className="pb-4">
                <DialogTitle className="text-lg font-semibold text-neutral-900">Add New Staff Member</DialogTitle>
                <DialogDescription className="text-neutral-500 text-sm">
                  Fill in the staff member's information to register them in the system
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddStaff}>
                <div className="grid gap-6 py-4">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-neutral-200/80">
                      <div className="h-0.5 w-4 bg-neutral-900 rounded-full" />
                      <span className="text-xs font-semibold text-neutral-600 uppercase tracking-wide">Personal Information</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName" className="text-xs font-semibold text-neutral-600">First Name</Label>
                        <Input
                          id="firstName"
                          value={formData.firstName}
                          onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                          placeholder="Enter first name"
                        required
                        className="h-10 border-neutral-200/80"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName" className="text-xs font-medium text-neutral-600">Last Name *</Label>
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        placeholder="Enter last name"
                        required
                        className="h-10 border-neutral-200/80"
                      />
                    </div>
                  </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="type" className="text-xs font-semibold text-neutral-600">Role Type</Label>
                        <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value as 'Teacher' | 'Staff' })}>
                          <SelectTrigger className="h-10 border-neutral-200/80">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Teacher">Teacher</SelectItem>
                            <SelectItem value="Staff">Staff</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="department" className="text-xs font-semibold text-neutral-600">Department</Label>
                        <Input
                          id="department"
                          value={formData.department}
                          onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                          placeholder="e.g., Mathematics, Science"
                          required
                          className="h-10 border-neutral-200/80"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-xs font-semibold text-neutral-600">Phone Number</Label>
                        <Input
                          id="phone"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="+1 234-567-8900"
                          required
                          className="h-10 border-neutral-200/80"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-xs font-semibold text-neutral-600">Email Address</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="staff@school.edu"
                          required
                          className="h-10 border-neutral-200/80"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-neutral-200/80">
                      <div className="h-0.5 w-4 bg-neutral-900 rounded-full" />
                      <span className="text-xs font-semibold text-neutral-600 uppercase tracking-wide">Additional Details</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="gender" className="text-xs font-semibold text-neutral-600">Gender</Label>
                        <Select value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value })}>
                          <SelectTrigger className="h-10 border-neutral-200/80">
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Male">Male</SelectItem>
                            <SelectItem value="Female">Female</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="dateOfBirth" className="text-xs font-semibold text-neutral-600">Date of Birth</Label>
                        <Input
                          id="dateOfBirth"
                          type="date"
                          value={formData.dateOfBirth}
                          onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                          required
                          className="h-10 border-neutral-200/80"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="salary" className="text-xs font-semibold text-neutral-600">Annual Salary</Label>
                        <Input
                          id="salary"
                          type="number"
                          value={formData.salary}
                          onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                          placeholder="Annual salary"
                          className="h-10 border-neutral-200/80"
                        />
                      </div>
                      {formData.type === 'Teacher' && (
                        <div className="space-y-2">
                          <Label htmlFor="experience" className="text-xs font-semibold text-neutral-600">Experience (years)</Label>
                          <Input
                            id="experience"
                            type="number"
                            value={formData.experience}
                            onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                            placeholder="Years of experience"
                            className="h-10 border-neutral-200/80"
                          />
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="qualification" className="text-xs font-semibold text-neutral-600">Qualification</Label>
                        <Input
                          id="qualification"
                          value={formData.qualification}
                          onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                          placeholder="e.g., M.Sc Mathematics, B.Ed"
                          className="h-10 border-neutral-200/80"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="designation" className="text-xs font-semibold text-neutral-600">Designation</Label>
                        <Input
                          id="designation"
                          value={formData.designation}
                          onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                          placeholder="e.g., Senior Teacher, Office Manager"
                          required
                          className="h-10 border-neutral-200/80"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address" className="text-xs font-semibold text-neutral-600">Full Address</Label>
                      <Textarea
                        id="address"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        placeholder="Enter full address"
                        className="border-neutral-200/80 resize-none"
                        rows={3}
                      />
                    </div>
                  </div>
                </div>
                {submitError && (
                  <div className="mb-4 text-sm text-neutral-900">{submitError}</div>
                )}
                <DialogFooter className="pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isSubmitting}
                    onClick={handleCloseAddDialog}
                    className="h-10 border-neutral-200/80"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting} className="bg-neutral-900 hover:bg-neutral-800 h-10">
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Add Staff Member
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
          <Card className="border-l-4 border-l-neutral-900 border-neutral-200/60 shadow-none bg-neutral-50/30">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-xs font-semibold text-neutral-600 mb-1">Total Workforce</CardTitle>
              <div className="flex items-baseline gap-2">
                <div className="text-4xl font-bold text-neutral-900">{stats.total}</div>
                <Briefcase className="h-4 w-4 text-neutral-400" />
              </div>
            </CardHeader>
            <CardContent className="pt-0 px-4 pb-4">
              <div className="text-xs text-neutral-500">Across all departments</div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-600 border-neutral-200/60 shadow-none">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-xs font-semibold text-neutral-600 mb-1">Teaching Staff</CardTitle>
              <div className="flex items-baseline gap-2">
                <div className="text-4xl font-bold text-blue-900">{stats.teachers}</div>
                <GraduationCap className="h-4 w-4 text-blue-500" />
              </div>
            </CardHeader>
            <CardContent className="pt-0 px-4 pb-4">
              <div className="text-xs text-neutral-500">
                {stats.teachers > 0 ? `${Math.round((stats.teachers / stats.total) * 100)}% of total staff` : 'No teachers assigned'}
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-emerald-600 border-neutral-200/60 shadow-none">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-xs font-semibold text-neutral-600 mb-1">Currently Active</CardTitle>
              <div className="flex items-baseline gap-2">
                <div className="text-4xl font-bold text-emerald-900">{stats.active}</div>
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
            </CardHeader>
            <CardContent className="pt-0 px-4 pb-4">
              <div className="text-xs text-neutral-500">
                {stats.active > 0 ? `${Math.round((stats.active / stats.total) * 100)}% attendance rate` : 'No active staff'}
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-amber-600 border-neutral-200/60 shadow-none md:col-span-1 lg:col-span-1">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-xs font-semibold text-neutral-600 mb-1">On Leave</CardTitle>
              <div className="flex items-baseline gap-2">
                <div className="text-4xl font-bold text-amber-900">{stats.onLeave}</div>
              </div>
            </CardHeader>
            <CardContent className="pt-0 px-4 pb-4">
              <div className="text-xs text-neutral-500">
                {stats.onLeave > 0 ? `${Math.round((stats.onLeave / stats.total) * 100)}% on leave` : 'All staff present'}
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-600 border-neutral-200/60 shadow-none md:col-span-2 lg:col-span-2">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-xs font-semibold text-neutral-600 mb-1">Admin & Support</CardTitle>
              <div className="flex items-center justify-between">
                <div className="flex items-baseline gap-2">
                  <div className="text-4xl font-bold text-purple-900">{stats.staff}</div>
                  <Users className="h-4 w-4 text-purple-500" />
                </div>
                <div className="text-xs text-neutral-500 bg-purple-50 px-2 py-1 rounded-full">
                  {stats.staff > 0 ? `${Math.round((stats.staff / stats.total) * 100)}%` : '0%'}
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0 px-4 pb-4">
              <div className="text-xs text-neutral-500">Administrative and support personnel</div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-l-4 border-l-neutral-900 border-neutral-200/60 shadow-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 pt-5 px-5">
            <div>
              <CardTitle className="text-base font-semibold text-neutral-900">Staff Directory</CardTitle>
              <div className="text-xs text-neutral-500 mt-0.5">Manage and view all personnel</div>
            </div>
            <Badge variant="outline" className="bg-neutral-50 border-neutral-200 text-neutral-600 text-xs font-medium px-2.5 py-0.5">
              {filteredStaff.length} of {staff.length}
            </Badge>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <div className="flex flex-col sm:flex-row gap-3 mb-5">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                <Input
                  placeholder="Search by name, ID, or designation..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-10 border-neutral-200/80 focus:border-neutral-400 bg-neutral-50/30"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[140px] h-10 border-neutral-200/80 bg-white">
                  <SelectValue placeholder="Role Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="Teacher">Teachers</SelectItem>
                  <SelectItem value="Staff">Staff</SelectItem>
                </SelectContent>
              </Select>
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger className="w-[160px] h-10 border-neutral-200/80 bg-white">
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {[...new Set(staff.map((s) => s.department))].map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-lg border border-neutral-200/60 overflow-hidden bg-white">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-neutral-200/80 bg-gradient-to-r from-neutral-50/80 to-transparent">
                    <TableHead className="text-xs font-semibold text-neutral-500 uppercase tracking-wider h-12 px-4">ID</TableHead>
                    <TableHead className="text-xs font-semibold text-neutral-500 uppercase tracking-wider h-12 px-4">Staff Member</TableHead>
                    <TableHead className="text-xs font-semibold text-neutral-500 uppercase tracking-wider h-12 px-4">Role</TableHead>
                    <TableHead className="text-xs font-semibold text-neutral-500 uppercase tracking-wider h-12 px-4">Department</TableHead>
                    <TableHead className="text-xs font-semibold text-neutral-500 uppercase tracking-wider h-12 px-4">Designation</TableHead>
                    <TableHead className="text-xs font-semibold text-neutral-500 uppercase tracking-wider h-12 px-4">Status</TableHead>
                    <TableHead className="text-xs font-semibold text-neutral-500 uppercase tracking-wider h-12 px-4">Contact</TableHead>
                    <TableHead className="text-xs font-semibold text-neutral-500 uppercase tracking-wider h-12 px-4 w-[80px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStaff.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-neutral-500 py-16 text-sm">
                        <div className="flex flex-col items-center gap-2">
                          <Briefcase className="h-8 w-8 text-neutral-300" />
                          <div className="text-neutral-600 font-medium">No staff members found</div>
                          <div className="text-neutral-400 text-xs">Try adjusting your filters or search terms</div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredStaff.map((member) => (
                      <TableRow key={member.id} className="border-b border-neutral-200/60 hover:bg-neutral-50/50 transition-colors duration-150">
                        <TableCell className="font-mono text-xs text-neutral-600 font-medium px-4 py-3.5 bg-neutral-50/30">{member.employeeId}</TableCell>
                        <TableCell className="text-sm font-medium text-neutral-900 px-4 py-3.5">{member.name}</TableCell>
                        <TableCell className="px-4 py-3.5">
                          <Badge variant="secondary" className={`text-xs font-medium px-2 py-0.5 ${member.type === 'Teacher' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-purple-50 text-purple-700 border-purple-200'}`}>
                            {member.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-neutral-600 text-sm px-4 py-3.5">{member.department}</TableCell>
                        <TableCell className="text-neutral-600 text-sm px-4 py-3.5">{member.designation}</TableCell>
                        <TableCell className="px-4 py-3.5">
                          <Badge
                            className={`text-xs font-medium px-2 py-0.5 ${
                              member.status === 'Active'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}
                          >
                            {member.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-4 py-3.5">
                          <div className="space-y-0.5">
                            <div className="text-xs text-neutral-600">{member.email}</div>
                            <div className="text-[11px] text-neutral-400">{member.phone}</div>
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-3.5">
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewStaff(member)}
                              className="text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100/80 h-8 w-8 p-0"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditStaff(member)}
                              className="text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100/80 h-8 w-8 p-0"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteClick(member)}
                              className="text-neutral-500 hover:text-red-600 hover:bg-red-50/80 h-8 w-8 p-0"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-neutral-900">Staff Details</DialogTitle>
            <DialogDescription className="text-neutral-600">
              Complete information for {selectedStaffDetails?.firstName} {selectedStaffDetails?.lastName}
            </DialogDescription>
          </DialogHeader>
          {selectedStaffDetails && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-neutral-600">Employee ID</Label>
                  <p className="text-neutral-900 font-medium">{selectedStaffDetails.employeeId}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-neutral-600">Type</Label>
                  <Badge className="bg-neutral-100 text-neutral-700">{selectedStaffDetails.type}</Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-neutral-600">First Name</Label>
                  <p className="text-neutral-900">{selectedStaffDetails.firstName}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-neutral-600">Last Name</Label>
                  <p className="text-neutral-900">{selectedStaffDetails.lastName}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-neutral-600">Email</Label>
                  <p className="text-neutral-900">{selectedStaffDetails.email}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-neutral-600">Phone</Label>
                  <p className="text-neutral-900">{selectedStaffDetails.phone}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-neutral-600">Department</Label>
                  <p className="text-neutral-900">{selectedStaffDetails.department}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-neutral-600">Designation</Label>
                  <p className="text-neutral-900">{selectedStaffDetails.designation}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-neutral-600">Gender</Label>
                  <p className="text-neutral-900">{selectedStaffDetails.gender}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-neutral-600">Date of Birth</Label>
                  <p className="text-neutral-900">
                    {new Date(selectedStaffDetails.dateOfBirth).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-neutral-600">Join Date</Label>
                  <p className="text-neutral-900">
                    {new Date(selectedStaffDetails.joinDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="space-y-1">
                  <Label className="text-neutral-600">Status</Label>
                  <Badge
                    className={
                      selectedStaffDetails.status === 'Active'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-amber-100 text-amber-700'
                    }
                  >
                    {selectedStaffDetails.status}
                  </Badge>
                </div>
              </div>
              {selectedStaffDetails.qualification && (
                <div className="space-y-1">
                  <Label className="text-neutral-600">Qualification</Label>
                  <p className="text-neutral-900">{selectedStaffDetails.qualification}</p>
                </div>
              )}
              {selectedStaffDetails.experience && (
                <div className="space-y-1">
                  <Label className="text-neutral-600">Experience</Label>
                  <p className="text-neutral-900">{selectedStaffDetails.experience} years</p>
                </div>
              )}
              {selectedStaffDetails.salary && (
                <div className="space-y-1">
                  <Label className="text-neutral-600">Salary</Label>
                  <p className="text-neutral-900">
                    ${Number(selectedStaffDetails.salary).toLocaleString()}/year
                  </p>
                </div>
              )}
              {selectedStaffDetails.address && (
                <div className="space-y-1">
                  <Label className="text-neutral-600">Address</Label>
                  <p className="text-neutral-900">{selectedStaffDetails.address}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCloseViewDialog}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-neutral-900">Edit Staff Member</DialogTitle>
            <DialogDescription className="text-neutral-600">
              Update the information for {selectedStaffDetails?.firstName} {selectedStaffDetails?.lastName}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="editFirstName">First Name *</Label>
                  <Input
                    id="editFirstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editLastName">Last Name *</Label>
                  <Input
                    id="editLastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="editType">Type *</Label>
                  <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value as 'Teacher' | 'Staff' })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Teacher">Teacher</SelectItem>
                      <SelectItem value="Staff">Staff</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editDepartment">Department *</Label>
                  <Input
                    id="editDepartment"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="editDesignation">Designation *</Label>
                <Input
                  id="editDesignation"
                  value={formData.designation}
                  onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="editPhone">Phone Number *</Label>
                  <Input
                    id="editPhone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editEmail">Email *</Label>
                  <Input
                    id="editEmail"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="editGender">Gender *</Label>
                  <Select value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editDateOfBirth">Date of Birth *</Label>
                  <Input
                    id="editDateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="editSalary">Salary</Label>
                  <Input
                    id="editSalary"
                    type="number"
                    value={formData.salary}
                    onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                    placeholder="Annual salary"
                  />
                </div>
                {formData.type === 'Teacher' && (
                  <div className="space-y-2">
                    <Label htmlFor="editExperience">Experience (years)</Label>
                    <Input
                      id="editExperience"
                      type="number"
                      value={formData.experience}
                      onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                      placeholder="Years of experience"
                    />
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="editQualification">Qualification</Label>
                <Input
                  id="editQualification"
                  value={formData.qualification}
                  onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                  placeholder="e.g., M.Sc Mathematics, B.Ed"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editAddress">Address</Label>
                <Textarea
                  id="editAddress"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Enter full address"
                />
              </div>
            </div>
            {submitError && (
              <div className="mb-4 text-sm text-neutral-900">{submitError}</div>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting}
                onClick={handleCloseEditDialog}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-neutral-900 hover:bg-neutral-800">
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-neutral-900">Delete Staff Member</DialogTitle>
            <DialogDescription className="text-neutral-600">
              Are you sure you want to delete {selectedStaff?.name}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={handleCloseDeleteDialog}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteStaff}
              disabled={isSubmitting}
            >
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}

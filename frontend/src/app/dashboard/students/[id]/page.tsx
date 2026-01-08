'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams, useParams } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

export default function StudentDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const isEditMode = searchParams.get('action') === 'edit'
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // Form State
  const [formData, setFormData] = useState<any>(null)

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        if (params.id) {
          const res = await fetch(`/api/students/${params.id}`)
          if (!res.ok) throw new Error('Student not found')
          const data = await res.json()
          setFormData(data)
        }
      } catch (error) {
        console.error(error)
        setFormData(null)
      } finally {
        setLoading(false)
      }
    }
    fetchStudent()
  }, [params.id])

  const handleSave = async () => {
    try {
        setSaving(true)
        const res = await fetch(`/api/students/${params.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                firstName: formData.name.split(' ')[0], // Simple split for now
                lastName: formData.name.split(' ').slice(1).join(' '),
                rollNumber: formData.rollNumber,
                grade: formData.grade,
                section: formData.section,
                phone: formData.phone,
                email: formData.email,
                address: formData.address,
                // Add other fields as needed
            })
        })

        if (!res.ok) throw new Error('Failed to update')
        
        const updated = await res.json()
        setFormData(updated)
        toast.success('Student updated successfully')
        router.push(`/dashboard/students/${params.id}`) // Exit edit mode
        router.refresh()
    } catch (error) {
        console.error(error)
        toast.error('Failed to update student')
    } finally {
        setSaving(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }))
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full pt-20">
          <p className="text-muted-foreground">Loading student details...</p>
        </div>
      </DashboardLayout>
    )
  }

  if (!formData) {
    return (
      <DashboardLayout>
        <div className="p-8">
          <div className="flex flex-col items-center gap-4 text-center">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Student not found</h1>
            <p className="text-muted-foreground">The student you are looking for does not exist or has been removed.</p>
            <Link href="/dashboard/students">
              <Button>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Students
              </Button>
            </Link>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/students">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              {isEditMode ? 'Edit Student' : 'Student Profile'}
            </h1>
            <p className="text-slate-500 dark:text-slate-400">
              {isEditMode ? 'Update student information' : 'View detailed student records'}
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Profile Card */}
          <Card className="md:col-span-1 border-none shadow-xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
            <CardContent className="pt-6 flex flex-col items-center text-center">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-4xl font-bold mb-4 shadow-lg">
                {formData.avatar}
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{formData.name}</h2>
              <p className="text-slate-500 dark:text-slate-400 mb-4">{formData.rollNumber}</p>
              <div className="flex gap-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  formData.status === 'Active' 
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
                    : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                }`}>
                  {formData.status}
                </span>
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400">
                  {formData.grade} - {formData.section}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Details Form */}
          <div className="md:col-span-2 space-y-6">
            <Card className="border-none shadow-xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input 
                        value={formData.name} 
                        onChange={(e) => handleChange('name', e.target.value)}
                        readOnly={!isEditMode} 
                        className={!isEditMode ? "bg-slate-50 border-none" : ""} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Roll Number</Label>
                    <Input 
                        value={formData.rollNumber} 
                        onChange={(e) => handleChange('rollNumber', e.target.value)}
                        readOnly={!isEditMode} 
                        className={!isEditMode ? "bg-slate-50 border-none" : ""} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Grade</Label>
                    {isEditMode ? (
                      <Select value={formData.grade} onValueChange={(v) => handleChange('grade', v)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select grade" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Grade 9">Grade 9</SelectItem>
                          <SelectItem value="Grade 10">Grade 10</SelectItem>
                          <SelectItem value="Grade 11">Grade 11</SelectItem>
                          <SelectItem value="Grade 12">Grade 12</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input value={formData.grade} readOnly className="bg-slate-50 border-none" />
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Section</Label>
                    {isEditMode ? (
                      <Select value={formData.section} onValueChange={(v) => handleChange('section', v)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select section" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="A">Section A</SelectItem>
                          <SelectItem value="B">Section B</SelectItem>
                          <SelectItem value="C">Section C</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input value={formData.section} readOnly className="bg-slate-50 border-none" />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Email Address</Label>
                    <Input 
                        value={formData.email} 
                        onChange={(e) => handleChange('email', e.target.value)}
                        readOnly={!isEditMode} 
                        className={!isEditMode ? "bg-slate-50 border-none" : ""} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone Number</Label>
                    <Input 
                        value={formData.phone} 
                        onChange={(e) => handleChange('phone', e.target.value)}
                        readOnly={!isEditMode} 
                        className={!isEditMode ? "bg-slate-50 border-none" : ""} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Guardian Name</Label>
                    <Input 
                        value={formData.guardian} 
                        readOnly={!isEditMode} 
                        className={!isEditMode ? "bg-slate-50 border-none" : ""} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Admission Date</Label>
                    <Input 
                        value={formData.admissionDate} 
                        readOnly={!isEditMode} 
                        className={!isEditMode ? "bg-slate-50 border-none" : ""} 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Address</Label>
                  <Textarea 
                    value={formData.address} 
                    onChange={(e) => handleChange('address', e.target.value)}
                    readOnly={!isEditMode} 
                    className={!isEditMode ? "bg-slate-50 border-none resize-none" : "resize-none"} 
                  />
                </div>
              </CardContent>
            </Card>

            {isEditMode && (
              <div className="flex justify-end gap-4">
                <Link href={`/dashboard/students/${formData.id}`}>
                  <Button variant="outline" type="button" disabled={saving}>Cancel</Button>
                </Link>
                <Button 
                    onClick={handleSave} 
                    disabled={saving}
                    className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
                >
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            )}
            {!isEditMode && (
              <div className="flex justify-end">
                <Link href={`/dashboard/students/${formData.id}?action=edit`}>
                   <Button className="bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600">
                    Edit Profile
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

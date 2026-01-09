'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { UserPlus } from 'lucide-react'

interface AddStudentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: any) => Promise<{ success: boolean; error?: string }>
}

export default function AddStudentDialog({ open, onOpenChange, onSubmit }: AddStudentDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
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

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    const result = await onSubmit(formData)
    
    if (result.success) {
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
      onOpenChange(false)
    } else {
      alert('Error adding student: ' + (result.error || 'Unknown error'))
    }
    
    setIsSubmitting(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
              type="button"
              variant="outline" 
              onClick={() => onOpenChange(false)}
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
  )
}

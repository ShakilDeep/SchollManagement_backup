'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { staffFormSchema, StaffFormData } from '@/lib/validations/staff'

interface Staff {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  type: 'Teacher' | 'Staff'
  department: string
  designation: string
  gender: string
  dateOfBirth?: string
  qualification?: string
  address?: string
  experience?: number
  salary?: number
}

interface EditStaffDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  staff: Staff | null
  onSuccess: () => void
}

export function EditStaffDialog({ open, onOpenChange, staff, onSuccess }: EditStaffDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const form = useForm<StaffFormData>({
    resolver: zodResolver(staffFormSchema),
    defaultValues: {
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
    }
  })

  useEffect(() => {
    if (open && staff) {
      form.reset({
        firstName: staff.firstName,
        lastName: staff.lastName,
        email: staff.email,
        phone: staff.phone,
        type: staff.type,
        department: staff.department,
        designation: staff.designation,
        gender: staff.gender,
        dateOfBirth: staff.dateOfBirth || '',
        qualification: staff.qualification || '',
        address: staff.address || '',
        experience: staff.experience ? staff.experience.toString() : '',
        salary: staff.salary ? staff.salary.toString() : ''
      })
    }
  }, [open, staff, form])

  const onSubmit = async (data: StaffFormData) => {
    if (!staff) return

    setIsSubmitting(true)
    setSubmitError(null)
    try {
      const response = await fetch(`/api/staff/${staff.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update staff member')
      }

      form.reset()
      onSuccess()
      onOpenChange(false)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to update staff member')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    form.reset()
    setSubmitError(null)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-lg font-semibold text-neutral-900">Edit Staff Member</DialogTitle>
          <DialogDescription className="text-neutral-500 text-sm">
            Update the staff member's information
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6 py-4">
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-neutral-200/80">
                <div className="h-0.5 w-4 bg-neutral-900 rounded-full" />
                <span className="text-xs font-semibold text-neutral-600 uppercase tracking-wide">Personal Information</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="text-xs font-semibold text-neutral-600">First Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter first name" className="h-10 border-neutral-200/80" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="text-xs font-medium text-neutral-600">Last Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter last name" className="h-10 border-neutral-200/80" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="text-xs font-semibold text-neutral-600">Role Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-10 border-neutral-200/80">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Teacher">Teacher</SelectItem>
                          <SelectItem value="Staff">Staff</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="text-xs font-semibold text-neutral-600">Department</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., Mathematics, Science" className="h-10 border-neutral-200/80" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="text-xs font-semibold text-neutral-600">Phone Number</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="+1 234-567-8900" className="h-10 border-neutral-200/80" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="text-xs font-semibold text-neutral-600">Email Address</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" placeholder="staff@school.edu" className="h-10 border-neutral-200/80" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-neutral-200/80">
                <div className="h-0.5 w-4 bg-neutral-900 rounded-full" />
                <span className="text-xs font-semibold text-neutral-600 uppercase tracking-wide">Additional Details</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="text-xs font-semibold text-neutral-600">Gender</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-10 border-neutral-200/80">
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Male">Male</SelectItem>
                          <SelectItem value="Female">Female</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="dateOfBirth"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="text-xs font-semibold text-neutral-600">Date of Birth</FormLabel>
                      <FormControl>
                        <Input {...field} type="date" className="h-10 border-neutral-200/80" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="salary"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="text-xs font-semibold text-neutral-600">Annual Salary</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" placeholder="Annual salary" className="h-10 border-neutral-200/80" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="experience"
                  render={({ field }) => {
                    const type = form.watch('type')
                    return (
                      <FormItem className="space-y-2">
                        <FormLabel className="text-xs font-semibold text-neutral-600">
                          Experience (years) {type === 'Teacher' && '*'}
                        </FormLabel>
                        <FormControl>
                          <Input {...field} type="number" placeholder="Years of experience" className="h-10 border-neutral-200/80" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )
                  }}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="qualification"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="text-xs font-semibold text-neutral-600">Qualification</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., M.Sc Mathematics, B.Ed" className="h-10 border-neutral-200/80" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="designation"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="text-xs font-semibold text-neutral-600">Designation</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., Senior Teacher, Office Manager" className="h-10 border-neutral-200/80" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="text-xs font-semibold text-neutral-600">Full Address</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Enter full address" className="border-neutral-200/80 resize-none" rows={3} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {submitError && (
              <div className="mb-4 text-sm text-neutral-900">{submitError}</div>
            )}

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting}
                onClick={handleClose}
                className="h-10 border-neutral-200/80"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-neutral-900 hover:bg-neutral-800 h-10">
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Staff Member
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

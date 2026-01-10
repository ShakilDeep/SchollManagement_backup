'use client'

import { useCallback, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { lessonFormSchema, type LessonFormData } from '@/lib/validations/curriculum'

type Lesson = {
  id: string
  curriculumId: string | null
  subjectId: string
  gradeId: string | null
  teacherId: string
  title: string
  content: string | null
  resources: string | null
  date: Date
  duration: number | null
  status: string
  teacher: {
    id: string
    firstName: string
    lastName: string
    user: {
      name: string | null
      email: string
    }
  }
  subject: {
    name: string
  }
}

interface LessonDialogProps {
  isOpen: boolean
  onClose: () => void
  onSave: (form: LessonFormData) => Promise<void>
  lesson: Lesson | null
  teachers: Array<{
    id: string
    firstName: string
    lastName: string
    user: {
      name: string | null
      email: string
    }
  }>
}

export function LessonDialog({
  isOpen,
  onClose,
  onSave,
  lesson,
  teachers,
}: LessonDialogProps) {
  const form = useForm<LessonFormData>({
    resolver: zodResolver(lessonFormSchema),
    defaultValues: {
      title: '',
      content: '',
      resources: '',
      date: new Date().toISOString().split('T')[0],
      duration: 60,
      status: 'Planned',
    }
  })

  useEffect(() => {
    if (isOpen && lesson) {
      form.reset({
        title: lesson.title,
        content: lesson.content || '',
        resources: lesson.resources || '',
        date: new Date(lesson.date).toISOString().split('T')[0],
        duration: lesson.duration || 60,
        status: lesson.status,
      })
    } else if (isOpen) {
      form.reset({
        title: '',
        content: '',
        resources: '',
        date: new Date().toISOString().split('T')[0],
        duration: 60,
        status: 'Planned',
      })
    }
  }, [isOpen, lesson, form])

  const handleSubmit = useCallback(async (data: LessonFormData) => {
    try {
      await onSave(data)
      form.reset()
      onClose()
    } catch (error) {
      console.error('Error saving lesson:', error)
    }
  }, [form, onSave, onClose])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{lesson ? 'Edit Lesson' : 'Add New Lesson'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>Lesson Title</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="e.g., Introduction to Variables"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>Content</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      rows={4}
                      placeholder="Lesson content and description..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="resources"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>Resources</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      rows={2}
                      placeholder="Links, files, or other resources..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel>Duration (minutes)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 60)}
                        min={1}
                        max={180}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Planned">Planned</SelectItem>
                      <SelectItem value="Scheduled">Scheduled</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                      <SelectItem value="Cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose} disabled={form.formState.isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? (lesson ? 'Updating...' : 'Creating...') : (lesson ? 'Update' : 'Create')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

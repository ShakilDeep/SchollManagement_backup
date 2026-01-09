'use client'

import { useState, useCallback, useEffect } from 'react'
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

type LessonForm = {
  title: string
  content: string
  resources: string
  date: string
  duration: number
  status: string
}

interface LessonDialogProps {
  isOpen: boolean
  onClose: () => void
  onSave: (form: LessonForm) => Promise<void>
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
  const [form, setForm] = useState<LessonForm>({
    title: '',
    content: '',
    resources: '',
    date: new Date().toISOString().split('T')[0],
    duration: 60,
    status: 'Planned',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (isOpen && lesson) {
      setForm({
        title: lesson.title,
        content: lesson.content || '',
        resources: lesson.resources || '',
        date: new Date(lesson.date).toISOString().split('T')[0],
        duration: lesson.duration || 60,
        status: lesson.status,
      })
    } else if (isOpen) {
      setForm({
        title: '',
        content: '',
        resources: '',
        date: new Date().toISOString().split('T')[0],
        duration: 60,
        status: 'Planned',
      })
    }
  }, [isOpen, lesson])

  const handleSubmit = useCallback(async () => {
    if (!form.title) return

    setIsSubmitting(true)
    try {
      await onSave(form)
      onClose()
    } catch (error) {
      console.error('Error saving lesson:', error)
    } finally {
      setIsSubmitting(false)
    }
  }, [form, onSave, onClose])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{lesson ? 'Edit Lesson' : 'Add New Lesson'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Lesson Title</label>
            <Input
              placeholder="e.g., Introduction to Variables"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Content</label>
            <Textarea
              placeholder="Lesson content and description..."
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              rows={4}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Resources</label>
            <Textarea
              placeholder="Links, files, or other resources..."
              value={form.resources}
              onChange={(e) => setForm({ ...form, resources: e.target.value })}
              rows={2}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Date</label>
              <Input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Duration (minutes)</label>
              <Input
                type="number"
                value={form.duration}
                onChange={(e) => setForm({ ...form, duration: parseInt(e.target.value) || 60 })}
                min={1}
                max={180}
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Status</label>
            <Select
              value={form.status}
              onValueChange={(value) => setForm({ ...form, status: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Planned">Planned</SelectItem>
                <SelectItem value="Scheduled">Scheduled</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
                <SelectItem value="Cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (lesson ? 'Updating...' : 'Creating...') : (lesson ? 'Update' : 'Create')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

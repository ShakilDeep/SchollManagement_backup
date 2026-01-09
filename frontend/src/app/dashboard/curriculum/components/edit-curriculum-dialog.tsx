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

type Subject = {
  id: string
  name: string
  code: string
  color: string | null
}

type Grade = {
  id: string
  name: string
}

type AcademicYear = {
  id: string
  name: string
  startDate: string
  endDate: string
  isCurrent: boolean
}

type Curriculum = {
  id: string
  name: string
  subjectId: string
  gradeId: string
  academicYearId: string
  description: string | null
  objectives: string | null
  topics: string | null
}

type EditForm = {
  name: string
  subjectId: string
  gradeId: string
  academicYearId: string
  description: string
  objectives: string
  topics: string
}

interface EditCurriculumDialogProps {
  isOpen: boolean
  onClose: () => void
  onUpdate: (form: EditForm) => Promise<void>
  subjects: Subject[]
  grades: Grade[]
  academicYears: AcademicYear[]
  curriculum: Curriculum | null
}

export function EditCurriculumDialog({
  isOpen,
  onClose,
  onUpdate,
  subjects,
  grades,
  academicYears,
  curriculum,
}: EditCurriculumDialogProps) {
  const [form, setForm] = useState<EditForm>({
    name: '',
    subjectId: '',
    gradeId: '',
    academicYearId: '',
    description: '',
    objectives: '',
    topics: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (isOpen && curriculum) {
      setForm({
        name: curriculum.name,
        subjectId: curriculum.subjectId,
        gradeId: curriculum.gradeId,
        academicYearId: curriculum.academicYearId,
        description: curriculum.description || '',
        objectives: curriculum.objectives || '',
        topics: curriculum.topics || '',
      })
    }
  }, [isOpen, curriculum])

  const handleSubmit = useCallback(async () => {
    if (!form.name || !form.subjectId || !form.gradeId || !form.academicYearId) return

    setIsSubmitting(true)
    try {
      await onUpdate(form)
      onClose()
    } catch (error) {
      console.error('Error updating curriculum:', error)
    } finally {
      setIsSubmitting(false)
    }
  }, [form, onUpdate, onClose])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Edit Curriculum</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Name</label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g., Advanced Mathematics"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Subject</label>
              <Select
                value={form.subjectId}
                onValueChange={(value) => setForm({ ...form, subjectId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Grade</label>
              <Select
                value={form.gradeId}
                onValueChange={(value) => setForm({ ...form, gradeId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select grade" />
                </SelectTrigger>
                <SelectContent>
                  {grades.map((grade) => (
                    <SelectItem key={grade.id} value={grade.id}>
                      {grade.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Academic Year</label>
            <Select
              value={form.academicYearId}
              onValueChange={(value) => setForm({ ...form, academicYearId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select academic year" />
              </SelectTrigger>
              <SelectContent>
                {academicYears.map((year) => (
                  <SelectItem key={year.id} value={year.id}>
                    {year.name} {year.isCurrent && '(Current)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <Textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Brief description of the curriculum..."
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Learning Objectives (one per line)</label>
            <Textarea
              rows={3}
              value={form.objectives}
              onChange={(e) => setForm({ ...form, objectives: e.target.value })}
              placeholder="• Master core concepts&#10;• Apply practical skills&#10;• Develop critical thinking"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Topics (one per line)</label>
            <Textarea
              rows={3}
              value={form.topics}
              onChange={(e) => setForm({ ...form, topics: e.target.value })}
              placeholder="• Introduction&#10;• Core Concepts&#10;• Advanced Topics"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Updating...' : 'Update'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

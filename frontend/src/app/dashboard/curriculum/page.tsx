'use client'

import { useState, useEffect } from 'react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
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
  DialogTrigger,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import {
  BookOpen,
  Search,
  Plus,
  Clock,
  CheckCircle,
  Circle,
  Calendar,
  MoreVertical,
  Edit,
  Trash2,
  X,
} from 'lucide-react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'

type Curriculum = {
  id: string
  name: string
  subjectId: string
  gradeId: string
  academicYearId: string
  description: string | null
  objectives: string | null
  topics: string | null
  subject: {
    id: string
    name: string
    code: string
    color: string | null
  }
  grade: {
    id: string
    name: string
  }
  academicYear: {
    id: string
    name: string
  }
  lessons: Lesson[]
}

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

type Teacher = {
  id: string
  firstName: string
  lastName: string
  user: {
    name: string | null
    email: string
  }
}

export default function CurriculumPage() {
  const [curriculums, setCurriculums] = useState<Curriculum[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [grades, setGrades] = useState<Grade[]>([])
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([])
  const [selectedCurriculum, setSelectedCurriculum] = useState<Curriculum | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [subjectFilter, setSubjectFilter] = useState<string>('all')
  const [gradeFilter, setGradeFilter] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [createForm, setCreateForm] = useState({
    name: '',
    subjectId: '',
    gradeId: '',
    academicYearId: '',
    description: '',
    objectives: '',
    topics: '',
  })
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingCurriculum, setEditingCurriculum] = useState<Curriculum | null>(null)
  const [editForm, setEditForm] = useState({
    name: '',
    subjectId: '',
    gradeId: '',
    academicYearId: '',
    description: '',
    objectives: '',
    topics: '',
  })
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [isLessonDialogOpen, setIsLessonDialogOpen] = useState(false)
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null)
  const [lessonForm, setLessonForm] = useState({
    title: '',
    content: '',
    resources: '',
    date: new Date().toISOString().split('T')[0],
    duration: 60,
    status: 'Planned',
  })

  useEffect(() => {
    fetchSubjects()
    fetchGrades()
    fetchAcademicYears()
    fetchTeachers()
  }, [])

  useEffect(() => {
    fetchCurriculums()
  }, [subjectFilter, gradeFilter])

  const fetchSubjects = async () => {
    try {
      const response = await fetch('/api/subjects')
      if (!response.ok) throw new Error('Failed to fetch subjects')
      const data = await response.json()
      setSubjects(data)
    } catch (error) {
      console.error('Error fetching subjects:', error)
    }
  }

  const fetchGrades = async () => {
    try {
      const response = await fetch('/api/grades')
      if (!response.ok) throw new Error('Failed to fetch grades')
      const data = await response.json()
      setGrades(data)
    } catch (error) {
      console.error('Error fetching grades:', error)
    }
  }

  const fetchAcademicYears = async () => {
    try {
      const response = await fetch('/api/academic-years')
      if (!response.ok) throw new Error('Failed to fetch academic years')
      const data = await response.json()
      setAcademicYears(data)
    } catch (error) {
      console.error('Error fetching academic years:', error)
    }
  }

  const fetchTeachers = async () => {
    try {
      const response = await fetch('/api/teachers')
      if (!response.ok) throw new Error('Failed to fetch teachers')
      const data = await response.json()
      setTeachers(data)
    } catch (error) {
      console.error('Error fetching teachers:', error)
    }
  }

  const fetchCurriculums = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (subjectFilter !== 'all') params.append('subjectId', subjectFilter)
      if (gradeFilter !== 'all') params.append('gradeId', gradeFilter)

      const response = await fetch(`/api/curriculum?${params}`)
      if (!response.ok) throw new Error('Failed to fetch curriculums')
      const data = await response.json()
      setCurriculums(data)
    } catch (error) {
      console.error('Error fetching curriculums:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCurriculum = async () => {
    if (!createForm.name || !createForm.subjectId || !createForm.gradeId || !createForm.academicYearId) return

    const isDuplicate = curriculums.some(c => 
      c.name === createForm.name &&
      c.subjectId === createForm.subjectId &&
      c.gradeId === createForm.gradeId &&
      c.academicYearId === createForm.academicYearId
    )

    if (isDuplicate) {
      alert('A curriculum with this name already exists for the selected subject, grade, and academic year.')
      return
    }

    try {
      const response = await fetch('/api/curriculum', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...createForm,
          objectives: JSON.stringify(createForm.objectives.split('\n').filter(o => o.trim())),
          topics: JSON.stringify(createForm.topics.split('\n').filter(t => t.trim())),
        }),
      })

      if (!response.ok) throw new Error('Failed to create curriculum')

      setIsCreateOpen(false)
      setCreateForm({
        name: '',
        subjectId: '',
        gradeId: '',
        academicYearId: '',
        description: '',
        objectives: '',
        topics: '',
      })
      fetchCurriculums()
    } catch (error) {
      console.error('Error creating curriculum:', error)
    }
  }

  const handleDeleteCurriculum = async (curriculumId: string) => {
    if (!confirm('Are you sure you want to delete this curriculum? This will also delete all associated lessons.')) return

    try {
      await fetch(`/api/curriculum/${curriculumId}`, { method: 'DELETE' })
      setCurriculums((prev) => prev.filter((c) => c.id !== curriculumId))
      if (selectedCurriculum?.id === curriculumId) {
        setSelectedCurriculum(null)
      }
    } catch (error) {
      console.error('Error deleting curriculum:', error)
    }
  }

  const openEditCurriculum = (curriculum: Curriculum) => {
    setEditingCurriculum(curriculum)
    setEditForm({
      name: curriculum.name,
      subjectId: curriculum.subjectId,
      gradeId: curriculum.gradeId,
      academicYearId: curriculum.academicYearId,
      description: curriculum.description || '',
      objectives: curriculum.objectives || '',
      topics: curriculum.topics || '',
    })
    setIsEditOpen(true)
  }

  const handleUpdateCurriculum = async () => {
    if (!editingCurriculum || !editForm.name || !editForm.subjectId || !editForm.gradeId || !editForm.academicYearId) return

    const isDuplicate = curriculums.some(c =>
      c.name === editForm.name &&
      c.subjectId === editForm.subjectId &&
      c.gradeId === editForm.gradeId &&
      c.academicYearId === editForm.academicYearId &&
      c.id !== editingCurriculum.id
    )

    if (isDuplicate) {
      alert('A curriculum with this name already exists for the selected subject, grade, and academic year.')
      return
    }

    try {
      const response = await fetch(`/api/curriculum/${editingCurriculum.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editForm,
          objectives: JSON.stringify(editForm.objectives.split('\n').filter(o => o.trim())),
          topics: JSON.stringify(editForm.topics.split('\n').filter(t => t.trim())),
        }),
      })

      if (!response.ok) throw new Error('Failed to update curriculum')

      setIsEditOpen(false)
      setEditingCurriculum(null)
      setEditForm({
        name: '',
        subjectId: '',
        gradeId: '',
        academicYearId: '',
        description: '',
        objectives: '',
        topics: '',
      })
      fetchCurriculums()
    } catch (error) {
      console.error('Error updating curriculum:', error)
    }
  }

  const closeEditDialog = () => {
    setIsEditOpen(false)
    setEditingCurriculum(null)
    setEditForm({
      name: '',
      subjectId: '',
      gradeId: '',
      academicYearId: '',
      description: '',
      objectives: '',
      topics: '',
    })
  }

  const handleCreateLesson = async () => {
    if (!selectedCurriculum || !lessonForm.title) return

    try {
      const response = await fetch('/api/lessons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          curriculumId: selectedCurriculum.id,
          subjectId: selectedCurriculum.subjectId,
          gradeId: selectedCurriculum.gradeId,
          teacherId: teachers[0]?.id,
          title: lessonForm.title,
          content: lessonForm.content,
          resources: lessonForm.resources,
          date: lessonForm.date,
          duration: lessonForm.duration,
          status: lessonForm.status,
        }),
      })

      if (!response.ok) throw new Error('Failed to create lesson')

      const newLesson = await response.json()
      setSelectedCurriculum((prev) => prev ? {
        ...prev,
        lessons: [...prev.lessons, newLesson]
      } : null)

      closeLessonDialog()
    } catch (error) {
      console.error('Error creating lesson:', error)
    }
  }

  const handleUpdateLesson = async () => {
    if (!editingLesson || !lessonForm.title) return

    try {
      const response = await fetch(`/api/lessons/${editingLesson.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: lessonForm.title,
          content: lessonForm.content,
          resources: lessonForm.resources,
          date: lessonForm.date,
          duration: lessonForm.duration,
          status: lessonForm.status,
        }),
      })

      if (!response.ok) throw new Error('Failed to update lesson')

      const updatedLesson = await response.json()
      setSelectedCurriculum((prev) => prev ? {
        ...prev,
        lessons: prev.lessons.map(l => l.id === updatedLesson.id ? updatedLesson : l)
      } : null)

      closeLessonDialog()
    } catch (error) {
      console.error('Error updating lesson:', error)
    }
  }

  const handleDeleteLesson = async (lessonId: string) => {
    if (!confirm('Are you sure you want to delete this lesson?')) return

    try {
      const response = await fetch(`/api/lessons/${lessonId}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Failed to delete lesson')

      setSelectedCurriculum((prev) => prev ? {
        ...prev,
        lessons: prev.lessons.filter(l => l.id !== lessonId)
      } : null)
    } catch (error) {
      console.error('Error deleting lesson:', error)
    }
  }

  const openEditLesson = (lesson: Lesson) => {
    setEditingLesson(lesson)
    setLessonForm({
      title: lesson.title,
      content: lesson.content || '',
      resources: lesson.resources || '',
      date: new Date(lesson.date).toISOString().split('T')[0],
      duration: lesson.duration || 60,
      status: lesson.status,
    })
    setIsLessonDialogOpen(true)
  }

  const closeLessonDialog = () => {
    setIsLessonDialogOpen(false)
    setEditingLesson(null)
    setLessonForm({
      title: '',
      content: '',
      resources: '',
      date: new Date().toISOString().split('T')[0],
      duration: 60,
      status: 'Planned',
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800'
      case 'Planned':
        return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800'
      case 'Cancelled':
        return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const getLessonProgress = (lessons: Lesson[]) => {
    if (!lessons.length) return 0
    const completed = lessons.filter(l => l.status === 'Completed').length
    return Math.round((completed / lessons.length) * 100)
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const filteredCurriculums = curriculums.filter((curriculum) => {
    if (!searchTerm) return true
    const search = searchTerm.toLowerCase()
    return (
      curriculum.name.toLowerCase().includes(search) ||
      curriculum.description?.toLowerCase().includes(search) ||
      curriculum.subject.name.toLowerCase().includes(search)
    )
  })

  return (
    <DashboardLayout>
      <div className="flex h-[calc(100vh-5rem)]">
        <div className="w-[40%] border-r border-slate-200 dark:border-slate-700/50 flex flex-col bg-slate-50/50 dark:bg-slate-900/50">
          <div className="p-5 border-b border-slate-200 dark:border-slate-700/50">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                <h1 className="text-lg font-semibold text-slate-900 dark:text-white">Curriculum</h1>
              </div>
              <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-2">
                    <Plus className="h-4 w-4" />
                    New
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-xl">
                  <DialogHeader>
                    <DialogTitle>Create New Curriculum</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Name</label>
                      <Input
                        id="create-name"
                        name="create-name"
                        value={createForm.name}
                        onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                        placeholder="e.g., Advanced Mathematics"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Subject</label>
                        <Select
                          value={createForm.subjectId}
                          onValueChange={(value) => setCreateForm({ ...createForm, subjectId: value })}
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
                          value={createForm.gradeId}
                          onValueChange={(value) => setCreateForm({ ...createForm, gradeId: value })}
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
                        value={createForm.academicYearId}
                        onValueChange={(value) => setCreateForm({ ...createForm, academicYearId: value })}
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
                        id="create-description"
                        name="create-description"
                        rows={3}
                        value={createForm.description}
                        onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                        placeholder="Brief description of the curriculum..."
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Learning Objectives (one per line)</label>
                      <Textarea
                        id="create-objectives"
                        name="create-objectives"
                        rows={3}
                        value={createForm.objectives}
                        onChange={(e) => setCreateForm({ ...createForm, objectives: e.target.value })}
                        placeholder="• Master core concepts&#10;• Apply practical skills&#10;• Develop critical thinking"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Topics (one per line)</label>
                      <Textarea
                        id="create-topics"
                        name="create-topics"
                        rows={3}
                        value={createForm.topics}
                        onChange={(e) => setCreateForm({ ...createForm, topics: e.target.value })}
                        placeholder="• Introduction&#10;• Core Concepts&#10;• Advanced Topics"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setIsCreateOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleCreateCurriculum}>Create</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="sm:max-w-xl">
                  <DialogHeader>
                    <DialogTitle>Edit Curriculum</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Name</label>
                      <Input
                        id="edit-name"
                        name="edit-name"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        placeholder="e.g., Advanced Mathematics"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Subject</label>
                        <Select
                          value={editForm.subjectId}
                          onValueChange={(value) => setEditForm({ ...editForm, subjectId: value })}
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
                          value={editForm.gradeId}
                          onValueChange={(value) => setEditForm({ ...editForm, gradeId: value })}
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
                        value={editForm.academicYearId}
                        onValueChange={(value) => setEditForm({ ...editForm, academicYearId: value })}
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
                        id="edit-description"
                        name="edit-description"
                        rows={3}
                        value={editForm.description}
                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                        placeholder="Brief description of the curriculum..."
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Learning Objectives (one per line)</label>
                      <Textarea
                        id="edit-objectives"
                        name="edit-objectives"
                        rows={3}
                        value={editForm.objectives}
                        onChange={(e) => setEditForm({ ...editForm, objectives: e.target.value })}
                        placeholder="• Master core concepts&#10;• Apply practical skills&#10;• Develop critical thinking"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Topics (one per line)</label>
                      <Textarea
                        id="edit-topics"
                        name="edit-topics"
                        rows={3}
                        value={editForm.topics}
                        onChange={(e) => setEditForm({ ...editForm, topics: e.target.value })}
                        placeholder="• Introduction&#10;• Core Concepts&#10;• Advanced Topics"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={closeEditDialog}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleUpdateCurriculum}>Update</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                id="curriculum-search"
                name="curriculum-search"
                placeholder="Search curriculum..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoComplete="off"
                className="pl-10 h-9 text-sm bg-white dark:bg-slate-800"
              />
            </div>

            <div className="flex gap-2">
              <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                <SelectTrigger className="flex-1 h-9 text-sm bg-white dark:bg-slate-800">
                  <SelectValue placeholder="All subjects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All subjects</SelectItem>
                  {subjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={gradeFilter} onValueChange={setGradeFilter}>
                <SelectTrigger className="flex-1 h-9 text-sm bg-white dark:bg-slate-800">
                  <SelectValue placeholder="All grades" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All grades</SelectItem>
                  {grades.map((grade) => (
                    <SelectItem key={grade.id} value={grade.id}>
                      {grade.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <ScrollArea className="flex-1">
            {loading ? (
              <div className="p-8 text-center text-sm text-slate-500">Loading curriculums...</div>
            ) : filteredCurriculums.length === 0 ? (
              <div className="p-8 text-center">
                <BookOpen className="h-12 w-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {searchTerm
                    ? 'No curriculums found matching your search.'
                    : 'No curriculums found. Create your first curriculum to get started.'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {filteredCurriculums.map((curriculum) => {
                  const progress = getLessonProgress(curriculum.lessons)
                  return (
                    <button
                      key={curriculum.id}
                      onClick={() => setSelectedCurriculum(curriculum)}
                      className={cn(
                        'w-full p-4 text-left transition-colors hover:bg-slate-100 dark:hover:bg-slate-800/50',
                        selectedCurriculum?.id === curriculum.id && 'bg-slate-100 dark:bg-slate-800/50'
                      )}
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex-1">
                          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
                            {curriculum.name}
                          </h3>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                              {curriculum.subject.code}
                            </Badge>
                            <span className="text-xs text-slate-500">{curriculum.grade.name}</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                            {progress}%
                          </span>
                          <div className="w-16 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500 transition-all duration-300"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      </div>
                      {curriculum.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                          {curriculum.description}
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Circle className="h-3 w-3" />
                          {curriculum.lessons.length} lessons
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </ScrollArea>
        </div>

        <div className="flex-1 flex flex-col bg-white dark:bg-slate-900">
          {selectedCurriculum ? (
            <>
              <div className="p-6 border-b border-slate-200 dark:border-slate-700/50">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h1 className="text-xl font-semibold text-slate-900 dark:text-white">
                        {selectedCurriculum.name}
                      </h1>
                      <Badge variant="outline" className="text-xs">
                        {selectedCurriculum.subject.code}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {selectedCurriculum.grade.name}
                      </Badge>
                    </div>
                    {selectedCurriculum.description && (
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {selectedCurriculum.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="gap-2" onClick={() => openEditCurriculum(selectedCurriculum)}>
                      <Edit className="h-4 w-4" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteCurriculum(selectedCurriculum.id)}
                      className="gap-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </div>

                {selectedCurriculum.objectives && (
                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-slate-900 dark:text-white mb-2">Learning Objectives</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {JSON.parse(selectedCurriculum.objectives).map((objective: string, idx: number) => (
                        <div key={idx} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400">
                          <CheckCircle className="h-3.5 w-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
                          <span>{objective}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedCurriculum.topics && (
                  <div>
                    <h3 className="text-sm font-medium text-slate-900 dark:text-white mb-2">Topics Covered</h3>
                    <div className="flex flex-wrap gap-2">
                      {JSON.parse(selectedCurriculum.topics).map((topic: string, idx: number) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {topic}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 border-b border-slate-200 dark:border-slate-700/50">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Lessons</h2>
                  <Button size="sm" className="gap-2" onClick={() => setIsLessonDialogOpen(true)}>
                    <Plus className="h-4 w-4" />
                    Add Lesson
                  </Button>
                  <Dialog open={isLessonDialogOpen} onOpenChange={setIsLessonDialogOpen}>
                    <DialogContent className="max-w-lg">
                      <DialogHeader>
                        <DialogTitle>{editingLesson ? 'Edit Lesson' : 'Add New Lesson'}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Lesson Title</label>
                          <Input
                            placeholder="e.g., Introduction to Variables"
                            value={lessonForm.title}
                            onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Content</label>
                          <Textarea
                            placeholder="Lesson content and description..."
                            value={lessonForm.content}
                            onChange={(e) => setLessonForm({ ...lessonForm, content: e.target.value })}
                            rows={4}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Resources</label>
                          <Textarea
                            placeholder="Resources (one per line)..."
                            value={lessonForm.resources}
                            onChange={(e) => setLessonForm({ ...lessonForm, resources: e.target.value })}
                            rows={2}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Date</label>
                            <Input
                              type="date"
                              value={lessonForm.date}
                              onChange={(e) => setLessonForm({ ...lessonForm, date: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Duration (min)</label>
                            <Input
                              type="number"
                              value={lessonForm.duration}
                              onChange={(e) => setLessonForm({ ...lessonForm, duration: parseInt(e.target.value) })}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Status</label>
                          <Select
                            value={lessonForm.status}
                            onValueChange={(value) => setLessonForm({ ...lessonForm, status: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Planned">Planned</SelectItem>
                              <SelectItem value="Completed">Completed</SelectItem>
                              <SelectItem value="Cancelled">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={closeLessonDialog}>Cancel</Button>
                        <Button onClick={editingLesson ? handleUpdateLesson : handleCreateLesson}>
                          {editingLesson ? 'Update Lesson' : 'Create Lesson'}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              <ScrollArea className="flex-1 p-6">
                {selectedCurriculum.lessons.length === 0 ? (
                  <div className="text-center py-12">
                    <Circle className="h-12 w-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      No lessons yet. Add your first lesson to start planning.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedCurriculum.lessons.map((lesson) => (
                      <div
                        key={lesson.id}
                        className="p-4 border border-slate-200 dark:border-slate-700/50 rounded-lg hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-sm font-medium text-slate-900 dark:text-white">
                                {lesson.title}
                              </h3>
                              <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0', getStatusColor(lesson.status))}>
                                {lesson.status}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-slate-500">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatDate(lesson.date)}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {lesson.duration} min
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-7 w-7">
                              <AvatarFallback className="text-[10px]">
                                {getInitials(lesson.teacher.user.name || lesson.teacher.firstName)}
                              </AvatarFallback>
                            </Avatar>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={() => openEditLesson(lesson)}
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-red-600 hover:text-red-700 dark:text-red-400"
                              onClick={() => handleDeleteLesson(lesson.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center max-w-md">
                <BookOpen className="h-16 w-16 text-slate-200 dark:text-slate-700 mx-auto mb-4" />
                <h2 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                  Select a Curriculum
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Choose a curriculum from the list to view details, objectives, and lessons.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}

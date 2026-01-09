'use client'

import { useState, useEffect, useMemo, useCallback, lazy, Suspense } from 'react'
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
import {
  Dialog,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  BookOpen,
  Search,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
} from 'lucide-react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { CurriculumCard } from './components/curriculum-card'
import { LessonCard } from './components/lesson-card'
import { VirtualizedCurriculumList } from './components/virtualized-curriculum-list'
import { VirtualizedLessonList } from './components/virtualized-lesson-list'
import { getStatusColor, getLessonProgress, getInitials, formatDate } from './utils'
import { memo } from 'react'

const MemoizedCurriculumCard = memo(CurriculumCard)
const MemoizedLessonCard = memo(LessonCard)

const CreateCurriculumDialog = lazy(() => import('./components/create-curriculum-dialog').then(m => ({ default: m.CreateCurriculumDialog })))
const EditCurriculumDialog = lazy(() => import('./components/edit-curriculum-dialog').then(m => ({ default: m.EditCurriculumDialog })))
const LessonDialog = lazy(() => import('./components/lesson-dialog').then(m => ({ default: m.LessonDialog })))

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

type CreateForm = {
  name: string
  subjectId: string
  gradeId: string
  academicYearId: string
  description: string
  objectives: string
  topics: string
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

type LessonForm = {
  title: string
  content: string
  resources: string
  date: string
  duration: number
  status: string
}

function DialogLoadingFallback() {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="text-sm text-slate-500">Loading...</div>
    </div>
  )
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
  const debouncedSearchTerm = useDebouncedValue(searchTerm, 300)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingCurriculum, setEditingCurriculum] = useState<Curriculum | null>(null)
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [isLessonDialogOpen, setIsLessonDialogOpen] = useState(false)
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null)

  useEffect(() => {
    fetchSubjects()
    fetchGrades()
    fetchAcademicYears()
    fetchTeachers()
  }, [])

  useEffect(() => {
    fetchCurriculums()
  }, [subjectFilter, gradeFilter])

  const fetchSubjects = useCallback(async () => {
    try {
      const response = await fetch('/api/subjects')
      if (!response.ok) throw new Error('Failed to fetch subjects')
      const data = await response.json()
      setSubjects(data)
    } catch (error) {
      console.error('Error fetching subjects:', error)
    }
  }, [])

  const fetchGrades = useCallback(async () => {
    try {
      const response = await fetch('/api/grades')
      if (!response.ok) throw new Error('Failed to fetch grades')
      const data = await response.json()
      setGrades(data)
    } catch (error) {
      console.error('Error fetching grades:', error)
    }
  }, [])

  const fetchAcademicYears = useCallback(async () => {
    try {
      const response = await fetch('/api/academic-years')
      if (!response.ok) throw new Error('Failed to fetch academic years')
      const data = await response.json()
      setAcademicYears(data)
    } catch (error) {
      console.error('Error fetching academic years:', error)
    }
  }, [])

  const fetchTeachers = useCallback(async () => {
    try {
      const response = await fetch('/api/teachers')
      if (!response.ok) throw new Error('Failed to fetch teachers')
      const data = await response.json()
      setTeachers(data)
    } catch (error) {
      console.error('Error fetching teachers:', error)
    }
  }, [])

  const fetchCurriculums = useCallback(async () => {
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
  }, [subjectFilter, gradeFilter])

  const handleCreateCurriculum = useCallback(async (form: CreateForm) => {
    const isDuplicate = curriculums.some(c => 
      c.name === form.name &&
      c.subjectId === form.subjectId &&
      c.gradeId === form.gradeId &&
      c.academicYearId === form.academicYearId
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
          ...form,
          objectives: JSON.stringify(form.objectives.split('\n').filter(o => o.trim())),
          topics: JSON.stringify(form.topics.split('\n').filter(t => t.trim())),
        }),
      })

      if (!response.ok) throw new Error('Failed to create curriculum')

      fetchCurriculums()
    } catch (error) {
      console.error('Error creating curriculum:', error)
      throw error
    }
  }, [curriculums, fetchCurriculums])

  const handleDeleteCurriculum = useCallback(async (curriculumId: string) => {
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
  }, [selectedCurriculum])

  const openEditCurriculum = useCallback((curriculum: Curriculum) => {
    setEditingCurriculum(curriculum)
    setIsEditOpen(true)
  }, [])

  const handleUpdateCurriculum = useCallback(async (form: EditForm) => {
    if (!editingCurriculum) return

    const isDuplicate = curriculums.some(c =>
      c.name === form.name &&
      c.subjectId === form.subjectId &&
      c.gradeId === form.gradeId &&
      c.academicYearId === form.academicYearId &&
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
          ...form,
          objectives: JSON.stringify(form.objectives.split('\n').filter(o => o.trim())),
          topics: JSON.stringify(form.topics.split('\n').filter(t => t.trim())),
        }),
      })

      if (!response.ok) throw new Error('Failed to update curriculum')

      setEditingCurriculum(null)
      fetchCurriculums()
    } catch (error) {
      console.error('Error updating curriculum:', error)
      throw error
    }
  }, [editingCurriculum, curriculums, fetchCurriculums])

  const handleCreateLesson = useCallback(async (form: LessonForm) => {
    if (!selectedCurriculum) return

    try {
      const response = await fetch('/api/lessons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          curriculumId: selectedCurriculum.id,
          subjectId: selectedCurriculum.subjectId,
          gradeId: selectedCurriculum.gradeId,
          teacherId: teachers[0]?.id,
          title: form.title,
          content: form.content,
          resources: form.resources,
          date: form.date,
          duration: form.duration,
          status: form.status,
        }),
      })

      if (!response.ok) throw new Error('Failed to create lesson')

      const newLesson = await response.json()
      setSelectedCurriculum((prev) => prev ? {
        ...prev,
        lessons: [...prev.lessons, newLesson]
      } : null)
    } catch (error) {
      console.error('Error creating lesson:', error)
      throw error
    }
  }, [selectedCurriculum, teachers])

  const handleUpdateLesson = useCallback(async (form: LessonForm) => {
    if (!editingLesson) return

    try {
      const response = await fetch(`/api/lessons/${editingLesson.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          content: form.content,
          resources: form.resources,
          date: form.date,
          duration: form.duration,
          status: form.status,
        }),
      })

      if (!response.ok) throw new Error('Failed to update lesson')

      const updatedLesson = await response.json()
      setSelectedCurriculum((prev) => prev ? {
        ...prev,
        lessons: prev.lessons.map(l => l.id === updatedLesson.id ? updatedLesson : l)
      } : null)
    } catch (error) {
      console.error('Error updating lesson:', error)
      throw error
    }
  }, [editingLesson])

  const handleDeleteLesson = useCallback(async (lessonId: string) => {
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
  }, [])

  const openEditLesson = useCallback((lesson: Lesson) => {
    setEditingLesson(lesson)
    setIsLessonDialogOpen(true)
  }, [])

  const filteredCurriculums = useMemo(() => {
    return curriculums.filter((curriculum) => {
      if (!debouncedSearchTerm) return true
      const search = debouncedSearchTerm.toLowerCase()
      return (
        curriculum.name.toLowerCase().includes(search) ||
        curriculum.description?.toLowerCase().includes(search) ||
        curriculum.subject.name.toLowerCase().includes(search)
      )
    })
  }, [curriculums, debouncedSearchTerm])

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
              </Dialog>

              <Suspense fallback={<DialogLoadingFallback />}>
                <CreateCurriculumDialog
                  isOpen={isCreateOpen}
                  onClose={() => setIsCreateOpen(false)}
                  onCreate={handleCreateCurriculum}
                  subjects={subjects}
                  grades={grades}
                  academicYears={academicYears}
                />
              </Suspense>

              <Suspense fallback={<DialogLoadingFallback />}>
                <EditCurriculumDialog
                  isOpen={isEditOpen}
                  onClose={() => setIsEditOpen(false)}
                  onUpdate={handleUpdateCurriculum}
                  subjects={subjects}
                  grades={grades}
                  academicYears={academicYears}
                  curriculum={editingCurriculum}
                />
              </Suspense>
            </div>

            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
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
              <div className="h-full" style={{ minHeight: 'calc(100vh - 200px)' }}>
                <VirtualizedCurriculumList
                  curriculums={filteredCurriculums}
                  selectedCurriculum={selectedCurriculum}
                  onSelect={setSelectedCurriculum}
                  getLessonProgress={getLessonProgress}
                  height={600}
                />
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
                </div>

                <Suspense fallback={<DialogLoadingFallback />}>
                  <LessonDialog
                    isOpen={isLessonDialogOpen}
                    onClose={() => {
                      setIsLessonDialogOpen(false)
                      setEditingLesson(null)
                    }}
                    onSave={editingLesson ? handleUpdateLesson : handleCreateLesson}
                    lesson={editingLesson}
                    teachers={teachers}
                  />
                </Suspense>
              </div>

              <ScrollArea className="flex-1">
                {selectedCurriculum.lessons.length === 0 ? (
                  <div className="p-8 text-center">
                    <BookOpen className="h-12 w-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      No lessons yet. Add your first lesson to get started.
                    </p>
                  </div>
                ) : (
                  <div className="h-full" style={{ minHeight: 'calc(100vh - 200px)' }}>
                    <VirtualizedLessonList
                      lessons={selectedCurriculum.lessons}
                      onEdit={openEditLesson}
                      onDelete={handleDeleteLesson}
                      height={600}
                    />
                  </div>
                )}
              </ScrollArea>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <BookOpen className="h-16 w-16 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
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

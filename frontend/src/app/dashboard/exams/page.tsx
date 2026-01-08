'use client'

import { useState, useEffect, useRef } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { 
  Plus, 
  Download, 
  FileText, 
  BarChart3, 
  TrendingUp,
  Calendar,
  Clock,
  Users,
  Award,
  Target,
  Activity,
  Filter,
  Search,
  ChevronDown,
  ChevronRight,
  Eye,
  Settings,
  Bell,
  AlertCircle,
  X,
  Loader2
} from 'lucide-react'

interface Exam {
  id: string
  name: string
  type: string
  startDate: string
  endDate: string
  status: string
  papers: ExamPaper[]
}

interface ExamPaper {
  id: string
  subject: string
  subjectCode: string
  grade: string
  gradeId?: string
  totalMarks: number
  passingMarks: number
  duration: number
  examDate: string
  startTime?: string
  endTime?: string
  totalStudents: number
}

interface ExamResult {
  id: string
  studentId: string
  studentName: string
  rollNumber: string
  subject: string
  subjectCode: string
  examName: string
  examType: string
  examStatus: string
  grade: string
  section: string
  marksObtained: number
  totalMarks: number
  passingMarks: number
  percentage: number
  rank: number
  remarks: string
  examDate: string
  examPaperId: string
}

interface Stats {
  average: number
  highest: number
  lowest: number
  passed: number
  failed: number
  total: number
}

export default function ExamsPage() {
  const [selectedExam, setSelectedExam] = useState<string>('1')
  const [exams, setExams] = useState<Exam[]>([])
  const [examResults, setExamResults] = useState<ExamResult[]>([])
  const [stats, setStats] = useState<Stats>({
    average: 0,
    highest: 0,
    lowest: 0,
    passed: 0,
    failed: 0,
    total: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Advanced UI state
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [showCreateExamModal, setShowCreateExamModal] = useState(false)
  const [showFilterModal, setShowFilterModal] = useState(false)
  const [selectedExamForDetails, setSelectedExamForDetails] = useState<Exam | null>(null)
  const [newExam, setNewExam] = useState({
    name: '',
    type: 'Final',
    startDate: '',
    endDate: '',
    description: ''
  })
  const [examPapers, setExamPapers] = useState<any[]>([])
  const [subjects, setSubjects] = useState<any[]>([])
  const [grades, setGrades] = useState<any[]>([])
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(false)
  const [isLoadingGrades, setIsLoadingGrades] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const startDateRef = useRef<HTMLInputElement>(null)
  const endDateRef = useRef<HTMLInputElement>(null)
  const nameRef = useRef<HTMLInputElement>(null)
  const descriptionRef = useRef<HTMLTextAreaElement>(null)
  const [examFilter, setExamFilter] = useState({
    type: 'All',
    status: 'All'
  })
  const [activeTab, setActiveTab] = useState('exams')

  // Fetch exams data
  useEffect(() => {
    const fetchExams = async () => {
      try {
        const response = await fetch('/api/exams')
        if (!response.ok) {
          throw new Error('Failed to fetch exams')
        }
        const data = await response.json()
        setExams(data.exams || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch exams')
      } finally {
        setLoading(false)
      }
    }

    fetchExams()
  }, [])

  // Fetch exam results
  useEffect(() => {
    const fetchExamResults = async () => {
      try {
        const response = await fetch('/api/exam-results')
        if (!response.ok) {
          throw new Error('Failed to fetch exam results')
        }
        const data = await response.json()
        setExamResults(data.results || [])
        setStats(data.stats || {
          average: 0,
          highest: 0,
          lowest: 0,
          passed: 0,
          failed: 0,
          total: 0
        })
      } catch (err) {
        console.error('Failed to fetch exam results:', err)
      }
    }

    fetchExamResults()
  }, [])

  // Fetch subjects
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        setIsLoadingSubjects(true)
        const response = await fetch('/api/subjects')
        if (response.ok) {
          const data = await response.json()
          setSubjects(data || [])
        }
      } catch (err) {
        console.error('Failed to fetch subjects:', err)
      } finally {
        setIsLoadingSubjects(false)
      }
    }

    fetchSubjects()
  }, [])

  // Fetch grades
  useEffect(() => {
    const fetchGrades = async () => {
      try {
        setIsLoadingGrades(true)
        const response = await fetch('/api/grades')
        if (response.ok) {
          const data = await response.json()
          setGrades(data || [])
        }
      } catch (err) {
        console.error('Failed to fetch grades:', err)
      } finally {
        setIsLoadingGrades(false)
      }
    }

    fetchGrades()
  }, [])

  const currentExam = exams.find(e => e.id === selectedExam)


  // Event handlers
  const handleViewDetails = (exam: Exam) => {
    setSelectedExamForDetails(exam)
    setShowDetailsModal(true)
  }

  const handleCloseDetailsModal = () => {
    setShowDetailsModal(false)
    setSelectedExamForDetails(null)
  }

  const handleSchedule = (exam: Exam) => {
    setSelectedExamForDetails(exam)
    setShowScheduleModal(true)
  }

  const handleCloseScheduleModal = () => {
    setShowScheduleModal(false)
    setSelectedExamForDetails(null)
  }

  const handleCreateExam = () => {
    setNewExam({
      name: '',
      type: 'Final',
      startDate: '',
      endDate: '',
      description: ''
    })
    setShowCreateExamModal(true)
  }

  const handleCloseCreateExamModal = () => {
    setShowCreateExamModal(false)
    setNewExam({
      name: '',
      type: 'Final',
      startDate: '',
      endDate: '',
      description: ''
    })
    setExamPapers([])
    setSubmitError(null)
  }

  const handleCloseFilterModal = () => {
    setShowFilterModal(false)
  }

  const handleAddPaper = () => {
    setExamPapers([
      ...examPapers,
      {
        subjectId: '',
        gradeId: '',
        totalMarks: 100,
        passingMarks: 40,
        duration: 120,
        examDate: '',
        startTime: '',
        endTime: ''
      }
    ])
  }

  const handleRemovePaper = (index: number) => {
    setExamPapers(examPapers.filter((_, i) => i !== index))
  }

  const handlePaperChange = (index: number, field: string, value: any) => {
    const updatedPapers = [...examPapers]
    updatedPapers[index] = {
      ...updatedPapers[index],
      [field]: value
    }
    setExamPapers(updatedPapers)
  }

  const handleCreateExamSubmit = async () => {
    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const finalName = newExam.name || (nameRef.current?.value || '')
      const finalStartDate = newExam.startDate || (startDateRef.current?.value || '')
      const finalEndDate = newExam.endDate || (endDateRef.current?.value || '')
      const finalDescription = newExam.description || (descriptionRef.current?.value || '')
      
      if (!finalName) {
        setSubmitError('Exam name is required')
        setIsSubmitting(false)
        return
      }
      
      if (!finalStartDate || !finalEndDate) {
        setSubmitError('Start date and end date are required')
        setIsSubmitting(false)
        return
      }

      const examToSubmit = {
        name: finalName,
        type: newExam.type,
        startDate: finalStartDate,
        endDate: finalEndDate,
        description: finalDescription,
        papers: examPapers.length > 0 ? examPapers : undefined
      }
      
      const response = await fetch('/api/exams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(examToSubmit),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create exam')
      }

      const data = await response.json()
      
      // Refresh exams data
      const fetchExams = async () => {
        const response = await fetch('/api/exams')
        const data = await response.json()
        setExams(data.exams || [])
      }
      await fetchExams()
      
      // Reset form and close modal
      handleCloseCreateExamModal()
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to create exam')
      console.error('Failed to create exam:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleExportResults = async () => {
    try {
      // Fetch exam results data
      const response = await fetch('/api/exam-results')
      const data = await response.json()
      
      if (data.results && data.results.length > 0) {
        // Create CSV content
        const headers = [
          'Student Name',
          'Roll Number',
          'Grade',
          'Section',
          'Subject',
          'Exam Name',
          'Exam Type',
          'Marks Obtained',
          'Total Marks',
          'Percentage',
          'Grade',
          'Rank',
          'Exam Date'
        ]
        
        const csvContent = [
          headers.join(','),
          ...data.results.map((result: any) => [
            `"${result.studentName}"`,
            `"${result.rollNumber}"`,
            `"${result.grade}"`,
            `"${result.section}"`,
            `"${result.subject}"`,
            `"${result.examName}"`,
            `"${result.examType}"`,
            result.marksObtained,
            result.totalMarks,
            result.percentage,
            calculateGrade((result.marksObtained / result.totalMarks) * 100),
            result.rank || 'N/A',
            `"${result.examDate}"`
          ].join(','))
        ].join('\n')
        
        // Create blob and download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        const url = URL.createObjectURL(blob)
        link.setAttribute('href', url)
        link.setAttribute('download', `exam_results_${new Date().toISOString().split('T')[0]}.csv`)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }
    } catch (error) {
      console.error('Failed to export results:', error)
    }
  }

  const calculateGrade = (percentage: number) => {
    if (percentage >= 90) return 'A'
    if (percentage >= 80) return 'B'
    if (percentage >= 70) return 'C'
    if (percentage >= 60) return 'D'
    return 'F'
  }

  const getGradeColor = (grade: string) => {
    if (grade.startsWith('A')) return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
    if (grade.startsWith('B')) return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
    if (grade.startsWith('C')) return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
    return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      'Completed': 'default',
      'Upcoming': 'secondary',
      'Ongoing': 'default'
    }
    return <Badge variant={variants[status]}>{status}</Badge>
  }

  const getGradeBadge = (grade: string) => {
    return <Badge className={getGradeColor(grade)}>{grade}</Badge>
  }

  const getRankBadge = (rank: number) => {
    let variant: "default" | "secondary" | "destructive" = "default"
    if (rank <= 3) variant = "default"
    else if (rank <= 10) variant = "secondary"
    else variant = "destructive"
    
    return <Badge variant={variant}>#{rank}</Badge>
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading exams data...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="text-red-500 mb-4">Error loading exams</div>
            <p className="text-gray-600">{error}</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        {/* Premium Header Section */}
        <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-800 shadow-2xl border border-slate-200/50 dark:border-slate-700/50 backdrop-blur-xl">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-indigo-600/5"></div>
          <div className="relative px-8 py-10">
            <div className="flex items-start justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg">
                    <BarChart3 className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                      Examination Center
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400 mt-1 text-lg">
                      Comprehensive exam management and analytics platform
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                    <Activity className="h-4 w-4" />
                    <span>Active Academic Year: Spring 2025</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                    <Users className="h-4 w-4" />
                    <span>{examResults.length} Students Enrolled</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button 
                  variant="outline" 
                  onClick={handleExportResults}
                  className="bg-white/80 backdrop-blur-sm border-slate-200 hover:bg-slate-50 dark:bg-slate-800/80 dark:border-slate-700 dark:hover:bg-slate-700/80 shadow-sm"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export Results
                </Button>
                <Button 
                  onClick={handleCreateExam}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-600/25 dark:shadow-blue-600/40 transform hover:scale-105 transition-all duration-200"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Exam
                </Button>
                <Button variant="ghost" size="sm" className="relative">
                  <Bell className="h-4 w-4" />
                  <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full"></span>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Premium Navigation Tabs */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-2">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-slate-100 dark:bg-slate-900/50 rounded-xl p-1">
              <TabsTrigger 
                value="exams" 
                className="data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-600/20 dark:data-[state=active]:bg-slate-800 dark:data-[state=active]:shadow-blue-600/10 rounded-lg transition-all duration-200"
              >
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-blue-100 dark:bg-blue-900/50 rounded-md">
                    <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="font-medium">Exams</span>
                  <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                    {exams.length}
                  </Badge>
                </div>
              </TabsTrigger>
              <TabsTrigger 
                value="results" 
                className="data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:shadow-indigo-600/20 dark:data-[state=active]:bg-slate-800 dark:data-[state=active]:shadow-indigo-600/10 rounded-lg transition-all duration-200"
              >
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-indigo-100 dark:bg-indigo-900/50 rounded-md">
                    <BarChart3 className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <span className="font-medium">Results</span>
                  <Badge variant="secondary" className="ml-2 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">
                    {examResults.length}
                  </Badge>
                </div>
              </TabsTrigger>
            </TabsList>

            {/* Exams Tab Content */}
            <TabsContent value="exams" className="mt-6 space-y-6">
              {/* Quick Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/30">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-600 dark:text-blue-400 text-sm font-medium">Total Exams</p>
                        <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">{exams.length}</p>
                      </div>
                      <div className="p-3 bg-blue-600/20 rounded-lg">
                        <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradiant-to-br from-grdeient-to-green-100 to-brfrom-freen-900/20 dark:torom-gre8n-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800/30">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-green-600 dark:text-green-400 text-sm font-medium">Completed</p>
                        <p className="text-3xl font-bold text-green-900 dark:text-green-100">
                          {exams.filter(e => e.status === 'Completed').length}
                        </p>
                      </div>
                      <div className="p-3 bg-green-600/20 rounded-lg">
                        <Award className="h-6 w-6 text-green-600 dark:text-green-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/30">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-amber-600 dark:text-amber-400 text-sm font-medium">Upcoming</p>
                        <p className="text-3xl font-bold text-amber-900 dark:text-amber-100">
                          {exams.filter(e => e.status === 'Upcoming').length}
                        </p>
                      </div>
                      <div className="p-3 bg-amber-600/20 rounded-lg">
                        <Calendar className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800/30">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-purple-600 dark:text-purple-400 text-sm font-medium">Active Now</p>
                        <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">
                          {exams.filter(e => e.status === 'Ongoing').length}
                        </p>
                      </div>
                      <div className="p-3 bg-purple-600/20 rounded-lg">
                        <Activity className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Enhanced Exams List */}
              <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                <CardHeader className="border-b border-slate-200/50 dark:border-slate-700/50">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl font-semibold text-slate-900 dark:text-white">
                      Examination Schedule
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" className="gap-2" onClick={() => setShowFilterModal(true)}>
                        <Filter className="h-4 w-4" />
                        Filter
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {exams.map((exam) => (
                      <div 
                        key={exam.id} 
                        className="group relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 transition-all duration-300 hover:scale-[1.02]"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="relative p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 space-y-4">
                              <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${
                                  exam.status === 'Completed' ? 'bg-green-100 dark:bg-green-900/50' :
                                  exam.status === 'Ongoing' ? 'bg-amber-100 dark:bg-amber-900/50' :
                                  'bg-blue-100 dark:bg-blue-900/50'
                                }`}>
                                  {exam.status === 'Completed' ? <Award className="h-5 w-5 text-green-600 dark:text-green-400" /> :
                                   exam.status === 'Ongoing' ? <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" /> :
                                   <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />}
                                </div>
                                <div>
                                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{exam.name}</h3>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge 
                                      variant="outline" 
                                      className="bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600"
                                    >
                                      {exam.type}
                                    </Badge>
                                    {getStatusBadge(exam.status)}
                                  </div>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                  <FileText className="h-4 w-4" />
                                  <span>{exam.papers?.[0]?.subject || 'Multiple Subjects'}</span>
                                </div>
                                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                  <Users className="h-4 w-4" />
                                  <span>{exam.papers?.[0]?.grade || 'Multiple Grades'}</span>
                                </div>
                                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                  <Calendar className="h-4 w-4" />
                                  <span>{exam.startDate} - {exam.endDate}</span>
                                </div>
                              </div>

                              {exam.papers && exam.papers.length > 0 && (
                                <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-500">
                                  <span>{exam.papers.length} papers</span>
                                  <span>•</span>
                                  <span>{exam.papers.reduce((sum, paper) => sum + paper.totalStudents, 0)} total students</span>
                                </div>
                              )}
                            </div>

                            <div className="flex items-center gap-2 ml-4">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => handleViewDetails(exam)}
                                className="gap-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 border-blue-200 dark:border-blue-800"
                              >
                                <Eye className="h-4 w-4" />
                                View Details
                              </Button>
                              {exam.status === 'Upcoming' && (
                                <Button 
                                  size="sm" 
                                  onClick={() => handleSchedule(exam)}
                                  className="bg-blue-600 hover:bg-blue-700"
                                >
                                  <Settings className="h-4 w-4 mr-2" />
                                  Schedule
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Results Tab Content */}
            <TabsContent value="results" className="mt-6 space-y-6">
              {/* Results Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 border-emerald-200 dark:border-emerald-800/30">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-emerald-600 dark:text-emerald-400 text-sm font-medium">Average Score</p>
                        <p className="text-3xl font-bold text-emerald-900 dark:text-emerald-100">
                          {examResults.length > 0 ? 
                            Math.round(examResults.reduce((sum, r) => sum + (r.marksObtained / r.totalMarks * 100), 0) / examResults.length) : 0}
                        </p>
                      </div>
                      <div className="p-3 bg-emerald-600/20 rounded-lg">
                        <TrendingUp className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/30">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-600 dark:text-blue-400 text-sm font-medium">Highest Score</p>
                        <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">
                          {examResults.length > 0 ? 
                            Math.round(Math.max(...examResults.map(r => r.marksObtained / r.totalMarks * 100))) : 0}
                        </p>
                      </div>
                      <div className="p-3 bg-blue-600/20 rounded-lg">
                        <Award className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800/30">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-violet-600 dark:text-violet-400 text-sm font-medium">Pass Rate</p>
                        <p className="text-3xl font-bold text-violet-900 dark:text-violet-100">
                          {examResults.length > 0 ? 
                            Math.round((examResults.filter(r => {
                              const percentage = (r.marksObtained / r.totalMarks) * 100
                              const grade = calculateGrade(percentage)
                              return grade === 'A' || grade === 'B' || grade === 'C'
                            }).length / examResults.length) * 100) : 0}%
                        </p>
                      </div>
                      <div className="p-3 bg-violet-600/20 rounded-lg">
                        <Target className="h-6 w-6 text-violet-600 dark:text-violet-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Results Table */}
              <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl shadow-xl border-slate-200/50 dark:border-slate-700/50">
                <CardHeader className="border-b border-slate-200/50 dark:border-slate-700/50">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl font-semibold text-slate-900 dark:text-white">
                      Student Results
                    </CardTitle>

                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-700">
                          <th className="text-left py-3 px-4 font-medium text-slate-700 dark:text-slate-300">Student</th>
                          <th className="text-left py-3 px-4 font-medium text-slate-700 dark:text-slate-300">Subject</th>
                          <th className="text-left py-3 px-4 font-medium text-slate-700 dark:text-slate-300">Score</th>
                          <th className="text-left py-3 px-4 font-medium text-slate-700 dark:text-slate-300">Grade</th>
                          <th className="text-left py-3 px-4 font-medium text-slate-700 dark:text-slate-300">Status</th>
                          <th className="text-left py-3 px-4 font-medium text-slate-700 dark:text-slate-300">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {examResults.map((result) => (
                          <tr key={result.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-medium">
                                  {result.studentName.charAt(0)}
                                </div>
                                <div>
                                  <p className="font-medium text-slate-900 dark:text-white">{result.studentName}</p>
                                  <p className="text-xs text-slate-500 dark:text-slate-400">{result.rollNumber}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div>
                                <p className="font-medium text-slate-900 dark:text-white">{result.subject}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">{result.section}</p>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <div className="w-16 bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                                  <div 
                                    className={`h-2 rounded-full ${
                                      (result.marksObtained / result.totalMarks * 100) >= 80 ? 'bg-emerald-500' :
                                      (result.marksObtained / result.totalMarks * 100) >= 60 ? 'bg-blue-500' :
                                      (result.marksObtained / result.totalMarks * 100) >= 40 ? 'bg-amber-500' :
                                      'bg-red-500'
                                    }`}
                                    style={{ width: `${(result.marksObtained / result.totalMarks * 100)}%` }}
                                  ></div>
                                </div>
                                <span className="text-sm font-medium text-slate-900 dark:text-white">
                                  {Math.round(result.marksObtained / result.totalMarks * 100)}%
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              {getGradeBadge(calculateGrade((result.marksObtained / result.totalMarks) * 100))}
                            </td>
                            <td className="py-3 px-4">
                              {getRankBadge(result.rank)}
                            </td>
                            <td className="py-3 px-4">
                              <Button variant="ghost" size="sm" className="gap-2">
                                <Eye className="h-4 w-4" />
                                View
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* View Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {selectedExamForDetails?.name} - Details
          </DialogTitle>
          <DialogDescription>
            Comprehensive information about the examination
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Exam Type</Label>
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                {selectedExamForDetails?.type}
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Status</Label>
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                {selectedExamForDetails && getStatusBadge(selectedExamForDetails.status)}
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Start Date</Label>
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                {selectedExamForDetails?.startDate}
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">End Date</Label>
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                {selectedExamForDetails?.endDate}
              </div>
            </div>
          </div>

          {selectedExamForDetails?.papers && selectedExamForDetails.papers.length > 0 && (
            <div className="space-y-3">
              <Label className="text-sm font-medium">Exam Papers</Label>
              <div className="space-y-2">
                {selectedExamForDetails.papers.map((paper) => (
                  <div key={paper.id} className="p-3 border border-slate-200 dark:border-slate-700 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{paper.subject}</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          Grade: {paper.grade} | Duration: {paper.duration} mins
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{paper.totalMarks} marks</p>
                        <p className="text-xs text-slate-500">{paper.totalStudents} students</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleCloseDetailsModal}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Schedule Modal */}
    <Dialog open={showScheduleModal} onOpenChange={setShowScheduleModal}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Schedule Exam - {selectedExamForDetails?.name}
          </DialogTitle>
          <DialogDescription>
            Set the schedule and timing for this examination
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="schedule-date">Exam Date</Label>
            <Input
              id="schedule-date"
              type="date"
              className="w-full"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start-time">Start Time</Label>
              <Input
                id="start-time"
                type="time"
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-time">End Time</Label>
              <Input
                id="end-time"
                type="time"
                className="w-full"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="venue">Venue</Label>
            <Input
              id="venue"
              placeholder="e.g., Main Hall, Room A-101"
              className="w-full"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="instructions">Special Instructions</Label>
            <Textarea
              id="instructions"
              placeholder="Enter any special instructions for students..."
              className="w-full"
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleCloseScheduleModal}>
            Cancel
          </Button>
          <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
            Schedule Exam
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Create Exam Modal */}
    <Dialog open={showCreateExamModal} onOpenChange={setShowCreateExamModal}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Create New Exam
          </DialogTitle>
          <DialogDescription>
            Create a new examination schedule with associated papers
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6">
          {/* Exam Details Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Exam Details</h3>
            <div className="space-y-2">
              <Label htmlFor="exam-name">Exam Name</Label>
              <Input
                id="exam-name"
                ref={nameRef}
                value={newExam.name}
                onChange={(e) => setNewExam({...newExam, name: e.target.value})}
                placeholder="e.g., Final Examination 2025"
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="exam-type">Exam Type</Label>
              <Select value={newExam.type} onValueChange={(value) => setNewExam({...newExam, type: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Mid-term">Mid-term</SelectItem>
                  <SelectItem value="Final">Final</SelectItem>
                  <SelectItem value="Quiz">Quiz</SelectItem>
                  <SelectItem value="Assignment">Assignment</SelectItem>
                  <SelectItem value="Practical">Practical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start-date">Start Date</Label>
                <Input
                  id="start-date"
                  ref={startDateRef}
                  type="date"
                  value={newExam.startDate}
                  onChange={(e) => setNewExam({...newExam, startDate: e.target.value})}
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-date">End Date</Label>
                <Input
                  id="end-date"
                  ref={endDateRef}
                  type="date"
                  value={newExam.endDate}
                  onChange={(e) => setNewExam({...newExam, endDate: e.target.value})}
                  className="w-full"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="exam-description">Description</Label>
              <Textarea
                id="exam-description"
                ref={descriptionRef}
                value={newExam.description}
                onChange={(e) => setNewExam({...newExam, description: e.target.value})}
                placeholder="Enter exam description and details..."
                className="w-full"
                rows={3}
              />
            </div>
          </div>

          {/* Exam Papers Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Exam Papers</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddPaper}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Paper
              </Button>
            </div>
            
            {examPapers.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg">
                <FileText className="h-12 w-12 text-slate-400 mx-auto mb-3" />
                <p className="text-sm text-slate-600 dark:text-slate-400">No papers added yet</p>
                <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">Click "Add Paper" to create exam papers</p>
              </div>
            ) : (
              <div className="space-y-4">
                {examPapers.map((paper, index) => (
                  <Card key={index} className="border-slate-200 dark:border-slate-700">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium">Paper {index + 1}</CardTitle>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemovePaper(index)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor={`paper-subject-${index}`}>Subject</Label>
                          <Select
                            value={paper.subjectId}
                            onValueChange={(value) => handlePaperChange(index, 'subjectId', value)}
                          >
                            <SelectTrigger id={`paper-subject-${index}`}>
                              <SelectValue placeholder="Select subject" />
                            </SelectTrigger>
                            <SelectContent>
                              {isLoadingSubjects ? (
                                <div className="flex items-center justify-center p-4">
                                  <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                                </div>
                              ) : subjects.length === 0 ? (
                                <div className="text-center p-4 text-sm text-slate-500">No subjects available</div>
                              ) : (
                                subjects.map((subject) => (
                                  <SelectItem key={subject.id} value={subject.id}>
                                    {subject.name} ({subject.code})
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`paper-grade-${index}`}>Grade</Label>
                          <Select
                            value={paper.gradeId}
                            onValueChange={(value) => handlePaperChange(index, 'gradeId', value)}
                          >
                            <SelectTrigger id={`paper-grade-${index}`}>
                              <SelectValue placeholder="Select grade" />
                            </SelectTrigger>
                            <SelectContent>
                              {isLoadingGrades ? (
                                <div className="flex items-center justify-center p-4">
                                  <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                                </div>
                              ) : grades.length === 0 ? (
                                <div className="text-center p-4 text-sm text-slate-500">No grades available</div>
                              ) : (
                                grades.map((grade) => (
                                  <SelectItem key={grade.id} value={grade.id}>
                                    {grade.name}
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor={`paper-total-marks-${index}`}>Total Marks</Label>
                          <Input
                            id={`paper-total-marks-${index}`}
                            type="number"
                            value={paper.totalMarks}
                            onChange={(e) => handlePaperChange(index, 'totalMarks', parseInt(e.target.value))}
                            placeholder="100"
                            className="w-full"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`paper-passing-marks-${index}`}>Passing Marks</Label>
                          <Input
                            id={`paper-passing-marks-${index}`}
                            type="number"
                            value={paper.passingMarks}
                            onChange={(e) => handlePaperChange(index, 'passingMarks', parseInt(e.target.value))}
                            placeholder="40"
                            className="w-full"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`paper-duration-${index}`}>Duration (min)</Label>
                          <Input
                            id={`paper-duration-${index}`}
                            type="number"
                            value={paper.duration}
                            onChange={(e) => handlePaperChange(index, 'duration', parseInt(e.target.value))}
                            placeholder="120"
                            className="w-full"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor={`paper-date-${index}`}>Exam Date</Label>
                          <Input
                            id={`paper-date-${index}`}
                            type="date"
                            value={paper.examDate}
                            onChange={(e) => handlePaperChange(index, 'examDate', e.target.value)}
                            className="w-full"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`paper-start-time-${index}`}>Start Time</Label>
                          <Input
                            id={`paper-start-time-${index}`}
                            type="time"
                            value={paper.startTime}
                            onChange={(e) => handlePaperChange(index, 'startTime', e.target.value)}
                            className="w-full"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {submitError && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded-lg text-sm">
            {submitError}
          </div>
        )}
        
        <DialogFooter>
          <Button variant="outline" onClick={handleCloseCreateExamModal} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button 
            onClick={handleCreateExamSubmit}
            className="bg-blue-600 hover:bg-blue-700"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Exam'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Filter Modal */}
    <Dialog open={showFilterModal} onOpenChange={(open) => {
      console.log('Dialog onOpenChange called with:', open)
      setShowFilterModal(open)
    }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Filter Exams</DialogTitle>
          <DialogDescription>
            Filter exams by type and status to find specific examinations.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="filter-type">Exam Type</Label>
            <Select
              value={examFilter.type}
              onValueChange={(value) => setExamFilter({...examFilter, type: value})}
            >
              <SelectTrigger id="filter-type">
                <SelectValue placeholder="Select exam type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Types</SelectItem>
                <SelectItem value="Unit Test">Unit Test</SelectItem>
                <SelectItem value="Midterm">Midterm</SelectItem>
                <SelectItem value="Final">Final</SelectItem>
                <SelectItem value="Practical">Practical</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="filter-status">Exam Status</Label>
            <Select
              value={examFilter.status}
              onValueChange={(value) => setExamFilter({...examFilter, status: value})}
            >
              <SelectTrigger id="filter-status">
                <SelectValue placeholder="Select exam status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Status</SelectItem>
                <SelectItem value="Upcoming">Upcoming</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setExamFilter({ type: 'All', status: 'All' })}>
            Reset
          </Button>
          <Button variant="outline" onClick={handleCloseFilterModal}>
            Cancel
          </Button>
          <Button onClick={() => console.log('Applying filter:', examFilter)}>
            Apply Filter
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </DashboardLayout>
  )
}

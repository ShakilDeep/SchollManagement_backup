'use client'

import { useState, useMemo, useCallback, useEffect, useRef, lazy, Suspense } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { useAttendance, useAttendanceStats, useGrades, useSections, useSaveAttendance } from '@/lib/api/hooks/use-attendance'

import { AttendanceRow } from './components/attendance-row'
const StatsCard = lazy(() => import('./components/stats-card').then(m => ({ default: m.StatsCard })))
const AttendanceLoadingSkeleton = lazy(() => import('./components/attendance-loading-skeleton').then(m => ({ default: m.AttendanceLoadingSkeleton })))

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { 
  CalendarIcon, 
  Download, 
  Save, 
  Users,
  UserCheck,
  UserX,
  Clock,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Filter,
  ChevronDown,
  Search,
  Bell,
  Settings,
  BarChart3,
  Activity,
  CheckCircle,
  XCircle,
  Timer
} from 'lucide-react'
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isToday, isSameDay, subDays } from 'date-fns'
import { cn } from '@/lib/utils'

export interface StudentAttendance {
  id: string
  rollNumber: string
  name: string
  grade: string
  section: string
  status: 'Present' | 'Absent' | 'Late' | 'HalfDay' | 'Unmarked'
  checkIn?: string
  checkOut?: string
  avatar?: string
  email?: string
  phone?: string
}

export interface AttendanceTrend {
  date: Date
  present: number
  absent: number
  late: number
  halfDay: number
  rate: number
}

// Utility functions moved outside component for reusability
const getStatusConfig = (status: string) => {
  const configs = {
    Present: {
      icon: CheckCircle,
      color: 'emerald',
      bgClass: 'bg-emerald-500',
      textClass: 'text-emerald-600',
      lightBgClass: 'bg-emerald-100',
      darkTextClass: 'dark:text-emerald-400'
    },
    Absent: {
      icon: XCircle,
      color: 'rose',
      bgClass: 'bg-rose-500',
      textClass: 'text-rose-600',
      lightBgClass: 'bg-rose-100',
      darkTextClass: 'dark:text-rose-400'
    },
    Late: {
      icon: Clock,
      color: 'amber',
      bgClass: 'bg-amber-500',
      textClass: 'text-amber-600',
      lightBgClass: 'bg-amber-100',
      darkTextClass: 'dark:text-amber-400'
    },
    HalfDay: {
      icon: Timer,
      color: 'purple',
      bgClass: 'bg-purple-500',
      textClass: 'text-purple-600',
      lightBgClass: 'bg-purple-100',
      darkTextClass: 'dark:text-purple-400'
    },
    Unmarked: {
      icon: AlertCircle,
      color: 'slate',
      bgClass: 'bg-slate-500',
      textClass: 'text-slate-600',
      lightBgClass: 'bg-slate-100',
      darkTextClass: 'dark:text-slate-400'
    }
  }
  return configs[status as keyof typeof configs] || configs.Unmarked
}

const currentDate = new Date()

export default function AttendancePage() {
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [grade, setGrade] = useState<string>('all')
  const [section, setSection] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState<string>('')
  const debouncedSearchTerm = useDebouncedValue(searchTerm, 300)
  const [selectedView, setSelectedView] = useState<'overview' | 'detailed'>('overview')
  
  const { data: attendanceData = [], isLoading: attendanceLoading } = useAttendance({
    date: date?.toISOString() || '',
    gradeId: grade === 'all' ? undefined : grade,
    sectionId: section === 'all' ? undefined : section,
    search: debouncedSearchTerm
  })
  
  const { data: statsData, isLoading: statsLoading } = useAttendanceStats(date?.toISOString() || '')
  
  const { data: grades = [] } = useGrades()
  
  const { data: sections = [] } = useSections(grade === 'all' ? undefined : grade)
  
  const saveAttendanceMutation = useSaveAttendance()
  
  const [localAttendanceData, setLocalAttendanceData] = useState<StudentAttendance[]>([])
  const prevAttendanceDataRef = useRef<StudentAttendance[]>([])
  
  useEffect(() => {
    if (attendanceData && JSON.stringify(prevAttendanceDataRef.current) !== JSON.stringify(attendanceData)) {
      setLocalAttendanceData(attendanceData)
      prevAttendanceDataRef.current = attendanceData
    }
  }, [attendanceData])
  
  const stats = useMemo(() => {
    const total = localAttendanceData.length
    const present = localAttendanceData.filter((s) => s.status === 'Present').length
    const absent = localAttendanceData.filter((s) => s.status === 'Absent').length
    const late = localAttendanceData.filter((s) => s.status === 'Late').length
    const halfDay = localAttendanceData.filter((s) => s.status === 'HalfDay').length
    
    const effectivePresent = present + late + halfDay

    return {
      total,
      present,
      absent,
      late,
      halfDay,
      rate: total > 0 ? (effectivePresent / total * 100) : 0
    }
  }, [localAttendanceData])

  const gradeOptions = useMemo(() => {
    return [
      { id: 'all', name: 'All Grades' },
      ...(grades || [])
    ]
  }, [grades])

  const sectionOptions = useMemo(() => {
    return [
      { id: 'all', name: 'All Sections' },
      ...(sections || [])
    ]
  }, [sections])

  const handleStatusChange = useCallback((studentId: string, newStatus: StudentAttendance['status']) => {
    setLocalAttendanceData(prev =>
      prev.map(student =>
        student.id === studentId
          ? { ...student, status: newStatus }
          : student
      )
    )
  }, [])

  const handleMarkAllPresent = useCallback(() => {
    setLocalAttendanceData(prev =>
      prev.map(student => ({ ...student, status: 'Present' }))
    )
  }, [])

  const getTrendIcon = useCallback((current: number, previous: number) => {
    if (current > previous) return <TrendingUp className="h-4 w-4 text-emerald-500" />
    if (current < previous) return <TrendingDown className="h-4 w-4 text-rose-500" />
    return <Activity className="h-4 w-4 text-slate-400" />
  }, [])

  const getTrendColor = useCallback((current: number, previous: number) => {
    if (current > previous) return 'text-emerald-500'
    if (current < previous) return 'text-rose-500'
    return 'text-slate-500'
  }, [])

  const handleSaveAttendance = useCallback(() => {
    if (!date) return
    
    saveAttendanceMutation.mutate({
      date: date.toISOString(),
      attendanceData: localAttendanceData.map(s => ({ id: s.id, status: s.status }))
    })
  }, [date, localAttendanceData, saveAttendanceMutation])

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 dark:from-slate-900 dark:via-blue-900/10 dark:to-indigo-900/20">
        {/* Sophisticated Header */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-10"></div>
          <div className="relative">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 p-8">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-xl">
                    <Users className="h-8 w-8" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                      Attendance Management
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400 text-lg">
                      Real-time student attendance tracking and analytics
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm text-slate-500">
                  <span className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    Live Data
                  </span>
                  <span>•</span>
                  <span>{format(currentDate, 'EEEE, MMMM d, yyyy')}</span>
                  <span>•</span>
                  <span>{localAttendanceData.length} Students</span>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Button className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg transition-all duration-300">
                  <Download className="mr-2 h-4 w-4" />
                  Export Report
                </Button>
                <Button variant="outline" size="icon" className="bg-white/50 backdrop-blur-sm">
                  <Settings className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" className="bg-white/50 backdrop-blur-sm relative">
                  <Bell className="h-4 w-4" />
                  <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full"></span>
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 space-y-8">
          {/* View Toggle and Quick Stats */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <Button
                variant={selectedView === 'overview' ? 'default' : 'outline'}
                onClick={() => setSelectedView('overview')}
                className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white"
              >
                <BarChart3 className="mr-2 h-4 w-4" />
                Overview
              </Button>
              <Button
                variant={selectedView === 'detailed' ? 'default' : 'outline'}
                onClick={() => setSelectedView('detailed')}
                className="bg-white/50 backdrop-blur-sm border-slate-200 hover:bg-white/80"
              >
                <Users className="mr-2 h-4 w-4" />
                Detailed View
              </Button>
            </div>

            {/* Quick Stats Pills */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-white/50 backdrop-blur-sm rounded-full border border-slate-200">
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                <span className="text-sm font-medium">{stats.present} Present</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-white/50 backdrop-blur-sm rounded-full border border-slate-200">
                <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                <span className="text-sm font-medium">{stats.absent} Absent</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-white/50 backdrop-blur-sm rounded-full border border-slate-200">
                <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                <span className="text-sm font-medium">{stats.late} Late</span>
              </div>
            </div>
          </div>

          {/* Advanced Filters */}
          <Card className="border-none shadow-xl bg-white/70 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30">
                    <Filter className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <CardTitle className="text-xl">Smart Filters</CardTitle>
                </div>
                <Button variant="ghost" size="sm" className="text-slate-500 hover:text-slate-700">
                  Reset All
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="search-students">Search Students</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      id="search-students"
                      name="search-students"
                      type="text"
                      placeholder="Name or Roll No..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start bg-white/50 backdrop-blur-sm border-slate-200 hover:bg-white/80">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, 'PPP') : 'Select date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Grade</Label>
                  <Select value={grade} onValueChange={setGrade}>
                    <SelectTrigger className="bg-white/50 backdrop-blur-sm border-slate-200">
                      <SelectValue placeholder="All Grades" />
                    </SelectTrigger>
                    <SelectContent>
                      {gradeOptions.map((g) => (
                        <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Section</Label>
                  <Select value={section} onValueChange={setSection}>
                    <SelectTrigger className="bg-white/50 backdrop-blur-sm border-slate-200">
                      <SelectValue placeholder="All Sections" />
                    </SelectTrigger>
                    <SelectContent>
                      {sectionOptions.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Quick Actions</Label>
                  <Button 
                    onClick={handleMarkAllPresent}
                    className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
                  >
                    Mark All Present
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Premium Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Suspense fallback={<div className="h-40 bg-slate-200 animate-pulse rounded-xl" />}>
              <StatsCard
                title="Present Today"
                value={stats.present}
                icon={UserCheck}
                colorClass="bg-emerald-400"
                bgClass="bg-gradient-to-br from-emerald-400 to-teal-600"
                trendValue={Math.floor(stats.present * 0.9)}
                getTrendIcon={getTrendIcon}
                getTrendColor={getTrendColor}
              />
            </Suspense>
            <Suspense fallback={<div className="h-40 bg-slate-200 animate-pulse rounded-xl" />}>
              <StatsCard
                title="Absent Today"
                value={stats.absent}
                icon={UserX}
                colorClass="bg-rose-400"
                bgClass="bg-gradient-to-br from-rose-400 to-red-600"
                trendValue={Math.floor(stats.absent * 1.1)}
                getTrendIcon={getTrendIcon}
                getTrendColor={getTrendColor}
              />
            </Suspense>
            <Suspense fallback={<div className="h-40 bg-slate-200 animate-pulse rounded-xl" />}>
              <StatsCard
                title="Late Today"
                value={stats.late}
                icon={Clock}
                colorClass="bg-amber-400"
                bgClass="bg-gradient-to-br from-amber-400 to-orange-600"
                trendValue={Math.floor(stats.late * 0.8)}
                getTrendIcon={getTrendIcon}
                getTrendColor={getTrendColor}
              />
            </Suspense>
            <Suspense fallback={<div className="h-40 bg-slate-200 animate-pulse rounded-xl" />}>
              <StatsCard
                title="Attendance Rate"
                value={stats.rate.toFixed(1)}
                icon={Activity}
                colorClass="bg-indigo-400"
                bgClass="bg-gradient-to-br from-indigo-400 to-purple-600"
                trendValue={85}
                getTrendIcon={getTrendIcon}
                getTrendColor={getTrendColor}
              />
            </Suspense>
          </div>

          {/* Weekly Trend Chart */}
          <Card className="border-none shadow-xl bg-white/70 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30">
                    <BarChart3 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <CardTitle className="text-xl">Weekly Attendance Trend</CardTitle>
                </div>
                <Button variant="ghost" size="sm" className="text-slate-500 hover:text-slate-700">
                  View Details
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {statsData?.trends && statsData.trends.length > 0 ? (
                  <div className="grid grid-cols-7 gap-2">
                    {statsData.trends.map((day, index) => (
                    <div key={index} className="text-center space-y-2">
                      <div className="text-xs font-medium text-slate-500">
                        {format(day.date, 'EEE')}
                      </div>
                      <div className="relative h-32 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden group hover:scale-105 transition-all duration-300">
                        <div 
                          className={cn(
                            "absolute bottom-0 w-full bg-gradient-to-t transition-all duration-500",
                            day.rate >= 90 ? "from-emerald-500 to-emerald-400" :
                            day.rate >= 80 ? "from-blue-500 to-blue-400" :
                            day.rate >= 70 ? "from-amber-500 to-amber-400" :
                            "from-rose-500 to-rose-400"
                          )}
                          style={{ height: `${day.rate}%` }}
                        >
                          <div className="absolute top-2 left-0 right-0 text-center">
                            <span className="text-xs font-bold text-white">
                              {day.rate.toFixed(0)}%
                            </span>
                          </div>
                        </div>
                        {isToday(day.date) && (
                          <div className="absolute top-0 right-0 w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
                        )}
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-400">
                        {day.present}/{day.present + day.absent + day.late + day.halfDay}
                      </div>
                    </div>
                  ))}
                </div>
                ) : (
                  <div className="flex items-center justify-center h-32">
                    <div className="animate-pulse text-slate-500">Loading attendance trends...</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Advanced Attendance Table */}
          <Card className="border-none shadow-xl bg-white/70 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30">
                    <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <CardTitle className="text-xl">Student Attendance Details</CardTitle>
                  <Badge variant="secondary" className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
                    {localAttendanceData.length} Students
                  </Badge>
                </div>
                <Button 
                  onClick={handleSaveAttendance}
                  className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white"
                >
                  <Save className="mr-2 h-4 w-4" />
                  Save Attendance
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <Table>
                  <TableHeader className="bg-slate-50 dark:bg-slate-800/50">
                    <TableRow>
                      <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Student</TableHead>
                      <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Grade</TableHead>
                      <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Status</TableHead>
                      <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Check In</TableHead>
                      <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Check Out</TableHead>
                      <TableHead className="font-semibold text-slate-700 dark:text-slate-300">AI Prediction (Tomorrow)</TableHead>
                      <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendanceLoading ? (
                      <Suspense fallback={null}>
                        <AttendanceLoadingSkeleton />
                      </Suspense>
                    ) : localAttendanceData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="h-24 text-center text-slate-500">
                      No students found
                    </TableCell>
                      </TableRow>
                    ) : (
                      localAttendanceData.map((student) => (
                        <AttendanceRow
                          key={student.id}
                          student={student}
                          onStatusChange={handleStatusChange}
                          getStatusConfig={getStatusConfig}
                        />
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}

'use client'

import { useState, useMemo, useEffect, useCallback, lazy, Suspense } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, Clock, BookOpen, Users, AlertTriangle, TrendingUp, Download, Filter, Bell, MapPin, Activity } from 'lucide-react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import TimetableSkeleton from './components/timetable-skeleton'
const SubjectCard = lazy(() => import('./components/subject-card'))

interface Period {
  period: number
  time: string
  day: string
  subject: string
  teacher: string
  room: string
  type?: 'lecture' | 'lab' | 'practical' | 'seminar'
  difficulty?: 'basic' | 'intermediate' | 'advanced'
  conflict?: boolean
}

// Database state
interface GradeSection {
  id: string
  name: string
  sections: Array<{
    id: string
    name: string
    displayName: string
  }>
}

export default function TimetablePage() {
  const [grade, setGrade] = useState('10')
  const [section, setSection] = useState('A')
  const [viewType, setViewType] = useState<'weekly' | 'daily' | 'grid'>('weekly')
  const [selectedDay, setSelectedDay] = useState('Monday')

  // State for dropdown data
  const [grades, setGrades] = useState<GradeSection[]>([])
  const [timetableData, setTimetableData] = useState<Period[]>([])
  const [loading, setLoading] = useState(true)
  
  const classKey = `${grade}-${section}`

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      
      const [sectionsResponse, timetableResponse] = await Promise.all([
        fetch('/api/sections', { cache: 'force-cache' }),
        fetch(`/api/timetable?gradeId=${grade}&section=${section}`, { cache: 'no-store' })
      ])
      
      if (sectionsResponse.ok) {
        const sectionsData = await sectionsResponse.json()
        setGrades(sectionsData.grades)
        
        if (sectionsData.defaultSelection) {
          const defaultGrade = sectionsData.grades.find((g: GradeSection) => g.id === sectionsData.defaultSelection.grade)
          if (defaultGrade) {
            setGrade(defaultGrade.name.replace('Grade ', ''))
            const defaultSection = defaultGrade.sections.find((s: any) => s.id === sectionsData.defaultSelection.section)
            if (defaultSection) {
              setSection(defaultSection.name)
            }
          }
        }
      }
      
      if (timetableResponse.ok) {
        const timetableData = await timetableResponse.json()
        setTimetableData(timetableData)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }, [grade, section])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const statistics = useMemo(() => {
    const totalPeriods = timetableData.length
    const uniqueSubjects = new Set(timetableData.map(p => p.subject)).size
    const practicalPeriods = timetableData.filter(p => p.type === 'practical' || p.type === 'lab').length
    const conflicts = timetableData.filter(p => p.conflict).length
    
    return {
      totalPeriods,
      uniqueSubjects,
      practicalPeriods,
      conflicts,
      averagePeriodsPerDay: totalPeriods > 0 ? (totalPeriods / 5).toFixed(1) : '0'
    }
  }, [timetableData])

  const weeklySchedule = useMemo(() => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
    return days.map(day => ({
      day,
      periods: timetableData.filter(p => p.day === day).sort((a, b) => a.period - b.period)
    }))
  }, [timetableData])

  const currentPeriod = useMemo(() => {
    const now = new Date()
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
    const currentDay = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][now.getDay()]
    
    return timetableData.find(p => p.day === currentDay && p.time <= currentTime)
  }, [timetableData])

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-6 space-y-6 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
          <TimetableSkeleton />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Timetable</h1>
          <p className="text-slate-600 mt-1">Class {grade} - Section {section}</p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* View Type Selector */}
          <Select value={viewType} onValueChange={(value: 'weekly' | 'daily' | 'grid') => setViewType(value)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">Weekly View</SelectItem>
              <SelectItem value="daily">Daily View</SelectItem>
              <SelectItem value="grid">Grid View</SelectItem>
            </SelectContent>
          </Select>
          
          {/* Grade Selector */}
          <Select value={grade} onValueChange={setGrade}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {grades.map((g) => (
                <SelectItem key={g.id} value={g.name.replace('Grade ', '')}>
                  {g.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {/* Section Selector */}
          <Select value={section} onValueChange={setSection}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {grades.find(g => g.name.replace('Grade ', '') === grade)?.sections.map((sec) => (
                <SelectItem key={sec.id} value={sec.name}>
                  {sec.name}
                </SelectItem>
              )) || <SelectItem value="A">Section A</SelectItem>}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Periods</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.totalPeriods}</div>
            <p className="text-xs text-muted-foreground">This week</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Subjects</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.uniqueSubjects}</div>
            <p className="text-xs text-muted-foreground">Different courses</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Practical Sessions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.practicalPeriods}</div>
            <p className="text-xs text-muted-foreground">Hands-on learning</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conflicts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{statistics.conflicts}</div>
            <p className="text-xs text-muted-foreground">Schedule conflicts</p>
          </CardContent>
        </Card>
      </div>

      {/* Current Period Indicator */}
      {currentPeriod && (
        <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-lg">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold">Current Period</p>
                  <p className="text-sm opacity-90">{currentPeriod.subject} - {currentPeriod.teacher}</p>
                </div>
              </div>
              <Badge variant="secondary" className="bg-white/20 text-white">
                {currentPeriod.time}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Timetable Display */}
      {viewType === 'weekly' && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {weeklySchedule.map(({ day, periods }) => (
            <Card 
              key={day} 
              className={`${day === selectedDay ? 'ring-2 ring-blue-500' : ''}`}
              style={{ contentVisibility: 'auto', containIntrinsicSize: 'auto 500px' }}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-center">{day}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {periods.length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground py-4">No classes</p>
                ) : (
                  <Suspense fallback={<div className="animate-pulse bg-slate-200 rounded-lg h-20" />}>
                    {periods.map((period, idx) => (
                      <SubjectCard 
                        key={`${day}-${idx}`} 
                        period={period}
                        isCurrent={currentPeriod?.day === day && currentPeriod?.period === period.period}
                      />
                    ))}
                  </Suspense>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {viewType === 'daily' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Select Day</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedDay} onValueChange={setSelectedDay}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {weeklySchedule.map(({ day }) => (
                    <SelectItem key={day} value={day}>{day}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>{selectedDay} Schedule</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Suspense fallback={<div className="animate-pulse bg-slate-200 rounded-lg h-20" />}>
                {weeklySchedule.find(s => s.day === selectedDay)?.periods.map((period, idx) => (
                  <SubjectCard 
                    key={`${selectedDay}-${idx}`} 
                    period={period}
                    isCurrent={currentPeriod?.day === selectedDay && currentPeriod?.period === period.period}
                  />
                )) || <p className="text-center text-sm text-muted-foreground py-4">No classes</p>}
              </Suspense>
            </CardContent>
          </Card>
        </div>
      )}

      {viewType === 'grid' && (
        <Card>
          <CardHeader>
            <CardTitle>Weekly Grid View</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="border border-gray-200 p-2 bg-gray-50">Time</th>
                    {weeklySchedule.map(({ day }) => (
                      <th key={day} className="border border-gray-200 p-2 bg-gray-50">{day}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 8 }, (_, i) => i + 1).map(period => (
                    <tr key={period}>
                      <td className="border border-gray-200 p-2 bg-gray-50 font-medium">
                        Period {period}
                      </td>
                      {weeklySchedule.map(({ day, periods }) => {
                        const currentPeriodData = periods.find(p => p.period === period)
                        return (
                          <td key={`${day}-${period}`} className="border border-gray-200 p-2">
                            {currentPeriodData ? (
                              <div className="text-xs p-1 rounded bg-blue-500 text-white">
                                <div className="font-semibold">{currentPeriodData.subject}</div>
                                <div>{currentPeriodData.teacher}</div>
                                <div>{currentPeriodData.room}</div>
                              </div>
                            ) : (
                              <div className="text-xs text-gray-400">-</div>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
      </div>
    </DashboardLayout>
  )
}
'use client'

import { useState, useMemo, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, Clock, BookOpen, Users, AlertTriangle, TrendingUp, Download, Filter, Bell, MapPin, Activity } from 'lucide-react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'

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

const subjectConfig = {
  'Mathematics': { icon: '📐', color: 'bg-blue-500', difficulty: 'advanced' as const, type: 'lecture' as const },
  'Physics': { icon: '⚛️', color: 'bg-purple-500', difficulty: 'advanced' as const, type: 'practical' as const },
  'Chemistry': { icon: '🧪', color: 'bg-green-500', difficulty: 'intermediate' as const, type: 'lab' as const },
  'Biology': { icon: '🧬', color: 'bg-emerald-500', difficulty: 'intermediate' as const, type: 'practical' as const },
  'English': { icon: '📚', color: 'bg-indigo-500', difficulty: 'basic' as const, type: 'seminar' as const },
  'History': { icon: '📜', color: 'bg-yellow-500', difficulty: 'basic' as const, type: 'lecture' as const },
  'Geography': { icon: '🌍', color: 'bg-teal-500', difficulty: 'basic' as const, type: 'seminar' as const },
  'Computer Science': { icon: '💻', color: 'bg-cyan-500', difficulty: 'intermediate' as const, type: 'lab' as const },
  'Physical Education': { icon: '🏃', color: 'bg-orange-500', difficulty: 'basic' as const, type: 'practical' as const },
  'Art': { icon: '🎨', color: 'bg-pink-500', difficulty: 'basic' as const, type: 'practical' as const }
}

const SubjectCard = ({ period, isCurrent }: { period: Period; isCurrent?: boolean }) => {
  const config = subjectConfig[period.subject as keyof typeof subjectConfig] || {
    icon: '📖',
    color: 'bg-gray-500',
    difficulty: 'basic' as const,
    type: 'lecture' as const
  }

  return (
    <Card className={`relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-105 ${
      isCurrent ? 'ring-2 ring-blue-500 shadow-lg' : ''
    } ${period.conflict ? 'border-red-300 bg-red-50' : ''}`}>
      {isCurrent && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500 animate-pulse"></div>
      )}
      
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{config.icon}</span>
            <CardTitle className="text-sm font-semibold">{period.subject}</CardTitle>
          </div>
          <div className="flex items-center gap-1">
            {period.conflict && <AlertTriangle className="h-3 w-3 text-red-500" />}
            <Badge variant="secondary" className="text-xs">
              {period.type || config.type}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0 space-y-2">
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <Users className="h-3 w-3" />
          <span>{period.teacher}</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-600">
          <MapPin className="h-3 w-3" />
          <span>{period.room}</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-600">
          <Clock className="h-3 w-3" />
          <span>{period.time}</span>
        </div>
      </CardContent>
    </Card>
  )
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

  // Fetch data from database
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        
        // Fetch grades and sections
        const sectionsResponse = await fetch('/api/sections')
        if (sectionsResponse.ok) {
          const sectionsData = await sectionsResponse.json()
          setGrades(sectionsData.grades)
          
          // Set default grade and section if available
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
        
        // Fetch timetable data
        const timetableResponse = await fetch(`/api/timetable?gradeId=${grade}&section=${section}`)
        if (timetableResponse.ok) {
          const timetableData = await timetableResponse.json()
          setTimetableData(timetableData)
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [grade, section])

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
      <div className="p-6 space-y-6 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading timetable data...</p>
        </div>
      </div>
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
            <Card key={day} className={`${day === selectedDay ? 'ring-2 ring-blue-500' : ''}`}>
              <CardHeader className="pb-2">
                <CardTitle className="text-center">{day}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {periods.length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground py-4">No classes</p>
                ) : (
                  periods.map((period, idx) => (
                    <SubjectCard 
                      key={`${day}-${idx}`} 
                      period={period}
                      isCurrent={currentPeriod?.day === day && currentPeriod?.period === period.period}
                    />
                  ))
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
              {weeklySchedule.find(s => s.day === selectedDay)?.periods.map((period, idx) => (
                <SubjectCard 
                  key={`${selectedDay}-${idx}`} 
                  period={period}
                  isCurrent={currentPeriod?.day === selectedDay && currentPeriod?.period === period.period}
                />
              )) || <p className="text-center text-sm text-muted-foreground py-4">No classes</p>}
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
                              <div className={`text-xs p-1 rounded ${subjectConfig[currentPeriodData.subject as keyof typeof subjectConfig]?.color || 'bg-gray-200'} text-white`}>
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
'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import {
  Users,
  GraduationCap,
  ClipboardCheck,
  BookOpen,
  TrendingUp,
  TrendingDown,
  Clock,
  AlertCircle,
  Sparkles,
  ArrowUpRight,
  FileText,
  Calendar,
  Truck,
  Brain,
  ShieldAlert,
  Lightbulb,
  RefreshCw,
  ChevronRight
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { AIChatAssistant } from '@/components/dashboard/AIChatAssistant'

interface DashboardData {
  stats: Array<{
    title: string
    value: string
    change: string
    trend: 'up' | 'down' | 'stable'
    icon: any
    description: string
    color: string
  }>
  recentActivities: Array<{
    id: string
    type: string
    title: string
    description: string
    time: string
    status: string
    icon: any
  }>
  highlights: Array<{
    title: string
    value: string
    description: string
    trend: string
    icon: any
  }>
}

interface AIPredictions {
  enrollmentTrends: {
    nextMonth: number
    nextQuarter: number
    nextYear: number
    trend: 'increasing' | 'stable' | 'decreasing'
    confidence: number
  }
  dropoutRisk: {
    highRiskStudents: number
    mediumRiskStudents: number
    lowRiskStudents: number
    riskFactors: string[]
  }
  resourceOptimization: {
    teacherAllocation: string[]
    classroomUtilization: string[]
    resourceRecommendations: string[]
  }
  performancePredictions: {
    nextWeekAverage: number
    nextMonthAverage: number
    topPerformingGrades: Array<{ grade: string; average: number }>
    gradesNeedingAttention: Array<{ grade: string; average: number; improvement: string }>
    subjectInsights: Array<{ subject: string; average: number; trend: 'improving' | 'stable' | 'declining' }>
  }
  attendancePatterns: {
    todayPrediction: { present: number; absent: number; rate: number }
    weeklyTrend: Array<{ day: string; rate: number }>
    predictedNextWeek: number
    patternInsights: string[]
    atRiskStudents: number
  }
  teacherEffectiveness: {
    topTeachers: Array<{ name: string; effectiveness: number; subject: string }>
    teachersNeedingSupport: Array<{ name: string; effectiveness: number; suggestions: string[] }>
    overallEffectiveness: number
  }
  alerts: Array<{
    type: 'urgent' | 'warning' | 'info'
    title: string
    message: string
    action?: string
  }>
  insights: {
    keyHighlights: string[]
    opportunities: string[]
    priorities: Array<{ title: string; urgency: 'high' | 'medium' | 'low' }>
  }
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [aiPredictions, setAiPredictions] = useState<AIPredictions | null>(null)
  const [loading, setLoading] = useState(true)
  const [aiLoading, setAiLoading] = useState(false)
  const [showRecommendationsDialog, setShowRecommendationsDialog] = useState(false)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const res = await fetch('/api/dashboard')
        if (!res.ok) throw new Error('Failed to fetch dashboard data')
        const dashboardData = await res.json()
        setData(dashboardData)
      } catch (error) {
      } finally {
        setLoading(false)
      }
    }

    const fetchAIPredictions = async () => {
      setAiLoading(true)
      try {
        const res = await fetch('/api/ai/dashboard', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        })
        if (!res.ok) throw new Error('Failed to fetch AI predictions')
        const aiData = await res.json()
        setAiPredictions(aiData.data)
      } catch (error) {
      } finally {
        setAiLoading(false)
      }
    }

    fetchDashboardData()
    fetchAIPredictions()
  }, [])

  const handleRefreshPredictions = async () => {
    setAiLoading(true)
    try {
      const res = await fetch('/api/ai/dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ forceRefresh: true })
      })
      if (!res.ok) throw new Error('Failed to refresh AI predictions')
      const aiData = await res.json()
      setAiPredictions(aiData.data)
    } catch (error) {
    } finally {
      setAiLoading(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6 md:space-y-8 pb-8 overflow-x-hidden">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-violet-200 to-fuchsia-200 animate-pulse h-64 md:h-80">
            <div className="p-4 md:p-8">
              <div className="h-4 md:h-6 w-24 md:w-32 bg-white/40 rounded-full mb-4 md:mb-8"></div>
              <div className="h-8 md:h-12 w-64 md:w-96 bg-white/40 rounded-lg mb-1 md:mb-2"></div>
              <div className="h-4 md:h-6 w-48 md:w-64 bg-white/30 rounded-lg mb-6 md:mb-12"></div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8 pt-4 md:pt-8 border-t border-white/20">
                <div>
                  <div className="h-8 md:h-10 w-16 md:w-20 bg-white/40 rounded-lg mb-1 md:mb-2"></div>
                  <div className="h-3 md:h-4 w-20 md:w-24 bg-white/30 rounded"></div>
                </div>
                <div>
                  <div className="h-8 md:h-10 w-12 md:w-16 bg-white/40 rounded-lg mb-1 md:mb-2"></div>
                  <div className="h-3 md:h-4 w-20 md:w-24 bg-white/30 rounded"></div>
                </div>
                <div>
                  <div className="h-8 md:h-10 w-8 md:w-12 bg-white/40 rounded-lg mb-1 md:mb-2"></div>
                  <div className="h-3 md:h-4 w-20 md:w-24 bg-white/30 rounded"></div>
                </div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-slate-800 rounded-xl shadow-md animate-pulse h-32 md:h-36">
                <div className="p-4 md:p-6">
                  <div className="flex justify-between items-start mb-3 md:mb-4">
                    <div className="h-10 w-10 md:h-12 md:w-12 bg-slate-200 dark:bg-slate-700 rounded-2xl"></div>
                    <div className="h-5 w-10 md:h-6 md:w-12 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                  </div>
                  <div className="h-8 md:h-10 w-12 md:w-16 bg-slate-200 dark:bg-slate-700 rounded-lg mb-1 md:mb-2"></div>
                  <div className="h-4 md:h-5 w-20 md:w-24 bg-slate-200 dark:bg-slate-700 rounded mb-1"></div>
                  <div className="h-3 md:h-4 w-24 md:w-32 bg-slate-200 dark:bg-slate-700 rounded"></div>
                </div>
              </div>
            ))}
          </div>
          <div className="space-y-3 md:space-y-4">
            <div className="flex items-center justify-between">
              <div className="h-4 md:h-6 w-36 md:w-48 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
              <div className="h-6 md:h-8 w-20 md:w-24 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white dark:bg-slate-800 rounded-xl shadow-md animate-pulse h-40 md:h-48">
                  <div className="p-4 md:p-6">
                    <div className="h-6 w-32 bg-slate-200 dark:bg-slate-700 rounded-lg mb-4"></div>
                    <div className="space-y-3">
                      <div className="h-4 w-full bg-slate-200 dark:bg-slate-700 rounded"></div>
                      <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-700 rounded"></div>
                      <div className="h-4 w-1/2 bg-slate-200 dark:bg-slate-700 rounded"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="grid gap-6 md:gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-4 md:space-y-6">
              <div className="flex items-center justify-between">
                <div className="h-4 md:h-6 w-36 md:w-48 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
                <div className="h-4 md:h-6 w-12 md:w-16 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
              </div>
              <div className="space-y-3 md:space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-start gap-3 md:gap-4 p-3 md:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 animate-pulse h-24 md:h-28">
                    <div className="h-10 w-10 md:h-12 md:w-12 bg-slate-200 dark:bg-slate-700 rounded-xl shrink-0"></div>
                    <div className="flex-1 min-w-0">
                      <div className="h-3 md:h-4 w-3/4 bg-slate-200 dark:bg-slate-700 rounded mb-1 md:mb-2"></div>
                      <div className="h-3 w-full bg-slate-200 dark:bg-slate-700 rounded mb-1"></div>
                      <div className="h-3 w-1/2 bg-slate-200 dark:bg-slate-700 rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-4 md:space-y-6 lg:space-y-8">
              <div className="rounded-3xl bg-slate-900 p-4 md:p-6 shadow-xl animate-pulse h-48 md:h-64">
                <div className="flex items-center gap-2 mb-4 md:mb-6">
                  <div className="h-6 w-6 md:h-8 md:w-8 bg-slate-700 rounded-lg"></div>
                  <div className="h-4 md:h-6 w-24 md:w-32 bg-slate-700 rounded-lg"></div>
                </div>
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-14 md:h-16 w-full bg-slate-800 rounded-xl mb-2 md:mb-3 last:mb-0"></div>
                ))}
              </div>
              <div className="space-y-3 md:space-y-4">
                <div className="h-4 md:h-6 w-24 md:w-32 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="rounded-2xl p-3 md:p-5 border bg-slate-50 dark:bg-slate-900/10 border-slate-100 dark:border-slate-800 animate-pulse h-28 md:h-32">
                    <div className="space-y-2">
                      <div className="h-6 md:h-8 w-16 md:w-20 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
                      <div className="h-3 md:h-4 w-full bg-slate-200 dark:bg-slate-700 rounded"></div>
                      <div className="h-3 w-1/2 bg-slate-200 dark:bg-slate-700 rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!data) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <p className="text-slate-500">Failed to load dashboard data</p>
        </div>
      </DashboardLayout>
    )
  }

  const iconMap: Record<string, any> = {
    Users,
    GraduationCap,
    Calendar,
    BookOpen,
    ClipboardCheck,
    Truck
  }

  const quickActions = [
    {
      title: 'Add Student',
      description: 'Register new student',
      icon: Users,
      href: '/dashboard/students'
    },
    {
      title: 'Take Attendance',
      description: 'Mark daily attendance',
      icon: ClipboardCheck,
      href: '/dashboard/attendance'
    },
    {
      title: 'Create Lesson',
      description: 'Plan new lesson',
      icon: BookOpen,
      href: '/dashboard/curriculum'
    }
  ]

  return (
    <DashboardLayout>
      <div className="w-full max-w-full overflow-x-hidden">
        {/* Welcome Banner */}
        <div className="relative w-full overflow-hidden rounded-3xl bg-gradient-to-r from-violet-600 to-fuchsia-600 p-4 sm:p-6 md:p-8 text-white shadow-xl">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute bottom-0 left-0 -mb-10 -ml-10 h-64 w-64 rounded-full bg-black/10 blur-3xl" />

          <div className="relative z-10 w-full">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-6 mb-6 md:mb-8">
              <div className="flex items-center gap-2 md:gap-3 bg-white/20 backdrop-blur-md px-3 py-1.5 md:px-4 md:py-2 rounded-full border border-white/10 text-xs md:text-sm">
                <Sparkles className="h-3 w-3 md:h-4 md:w-4 text-yellow-300" />
                <span className="font-medium">Spring Semester 2025</span>
              </div>
              <Button className="bg-white text-violet-600 hover:bg-white/90 rounded-full px-4 md:px-6 text-xs md:text-sm w-full md:w-auto">
                Start New Day <ArrowUpRight className="ml-2 h-3 w-3 md:h-4 md:w-4" />
              </Button>
            </div>

            <div className="space-y-1 md:space-y-2 mb-8 md:mb-12">
              <h1 className="text-2xl md:text-4xl font-bold tracking-tight">
                Welcome Back, <span className="text-yellow-300">Admin!</span>
              </h1>
              <p className="text-white/80 text-sm md:text-lg max-w-full md:max-w-2xl">
                Ready to make today exceptional? Here's what's happening across your campus.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-8 pt-4 md:pt-8 border-t border-white/20">
              <div>
                <p className="text-xl md:text-3xl font-bold mb-0.5 md:mb-1">{data.stats.find(s => s.title === 'Attendance Rate')?.value || '0%'}</p>
                <p className="text-xs md:text-sm text-white/70">Attendance Rate</p>
              </div>
              <div>
                <p className="text-xl md:text-3xl font-bold mb-0.5 md:mb-1">{data.stats.find(s => s.title === 'Total Students')?.change || '+0'}</p>
                <p className="text-xs md:text-sm text-white/70">New Students</p>
              </div>
              <div>
                <p className="text-xl md:text-3xl font-bold mb-0.5 md:mb-1">{data.highlights.length}</p>
                <p className="text-xs md:text-sm text-white/70">Key Metrics</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {data.stats.map((stat) => {
            const IconComponent = iconMap[stat.icon.name] || Users
            return (
              <Card key={stat.title} className="border-none shadow-md hover:shadow-lg transition-all duration-300">
                <CardContent className="p-4 md:p-6">
                  <div className="flex justify-between items-start mb-3 md:mb-4">
                    <div className={cn(
                      "p-2 md:p-3 rounded-xl md:rounded-2xl",
                      stat.color === 'blue' && "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
                      stat.color === 'purple' && "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
                      stat.color === 'green' && "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
                      stat.color === 'orange' && "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400",
                    )}>
                      <IconComponent className="h-5 w-5 md:h-6 md:w-6" />
                    </div>
                    <Badge className={cn(
                      "rounded-full px-1.5 py-0.5 md:px-2 md:py-1 text-[10px] md:text-xs",
                      stat.trend === 'up'
                        ? "bg-emerald-500 hover:bg-emerald-600"
                        : stat.trend === 'down'
                        ? "bg-rose-500 hover:bg-rose-600"
                        : "bg-slate-500 hover:bg-slate-600"
                    )}>
                      {stat.change}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xl md:text-3xl font-bold text-slate-900 dark:text-white">{stat.value}</h3>
                    <p className="text-xs md:text-sm font-medium text-slate-500 dark:text-slate-400">{stat.title}</p>
                    <div className="flex items-center gap-1 text-[10px] md:text-xs text-muted-foreground">
                      {stat.trend === 'up' ? <TrendingUp className="h-3 w-3" /> : stat.trend === 'down' ? <TrendingDown className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                      <span>{stat.description}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* AI Predictions Section */}
        <div className="space-y-3 md:space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <h2 className="text-lg md:text-xl font-bold flex items-center gap-2">
              <Brain className="h-4 w-4 md:h-5 md:w-5 text-violet-500" />
              AI-Powered Insights
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefreshPredictions}
              disabled={aiLoading}
              className="gap-2 text-xs md:text-sm"
            >
              <RefreshCw className={cn("h-3 w-3 md:h-4 md:w-4", aiLoading && "animate-spin")} />
              Refresh
            </Button>
          </div>

          {aiLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-24 md:h-48 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse"></div>
              ))}
            </div>
          ) : aiPredictions ? (
            <div className="space-y-6">
              {/* Alerts Section */}
              {aiPredictions.alerts && aiPredictions.alerts.length > 0 && (
                <div className="space-y-3">
                  {aiPredictions.alerts.slice(0, 3).map((alert, i) => (
                    <div key={i} className={cn(
                      "flex items-start gap-3 p-4 rounded-xl border",
                      alert.type === 'urgent' && "bg-rose-50 dark:bg-rose-900/10 border-rose-200 dark:border-rose-800",
                      alert.type === 'warning' && "bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800",
                      alert.type === 'info' && "bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800"
                    )}>
                      <div className={cn(
                        "p-1.5 rounded-lg",
                        alert.type === 'urgent' && "bg-rose-100 text-rose-600",
                        alert.type === 'warning' && "bg-amber-100 text-amber-600",
                        alert.type === 'info' && "bg-blue-100 text-blue-600"
                      )}>
                        <AlertCircle className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-sm text-slate-900 dark:text-white">{alert.title}</p>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">{alert.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {/* Enrollment Trends */}
                <Card className="border-none shadow-md hover:shadow-lg transition-all duration-300">
                  <CardHeader className="pb-3 md:pb-4">
                    <CardTitle className="flex items-center gap-2 text-sm md:text-base">
                      <div className="p-1.5 md:p-2 bg-violet-100 text-violet-600 rounded-lg">
                        <TrendingUp className="h-3.5 w-3.5 md:h-4 md:w-4" />
                      </div>
                      Enrollment Forecast
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 md:space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">
                          +{aiPredictions.enrollmentTrends.nextMonth}
                        </p>
                        <p className="text-[10px] md:text-xs text-slate-500">Next Month</p>
                      </div>
                      <Badge className={cn(
                        "rounded-full text-[10px] md:text-xs",
                        aiPredictions.enrollmentTrends.trend === 'increasing' ? "bg-emerald-100 text-emerald-700" :
                        aiPredictions.enrollmentTrends.trend === 'decreasing' ? "bg-rose-100 text-rose-700" :
                        "bg-slate-100 text-slate-700"
                      )}>
                        {aiPredictions.enrollmentTrends.trend}
                      </Badge>
                    </div>
                    <div className="space-y-1.5 md:space-y-2">
                      <div className="flex justify-between text-xs md:text-sm">
                        <span className="text-slate-500">Quarterly</span>
                        <span className="font-medium text-slate-900 dark:text-white">
                          +{aiPredictions.enrollmentTrends.nextQuarter}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs md:text-sm">
                        <span className="text-slate-500">Yearly Forecast</span>
                        <span className="font-medium text-slate-900 dark:text-white">
                          {aiPredictions.enrollmentTrends.nextYear}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] md:text-xs text-slate-500">
                      <ShieldAlert className="h-2.5 w-2.5 md:h-3 md:w-3" />
                      <span>Confidence: {(aiPredictions.enrollmentTrends.confidence * 100).toFixed(0)}%</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Dropout Risk */}
                <Card className="border-none shadow-md hover:shadow-lg transition-all duration-300">
                  <CardHeader className="pb-3 md:pb-4">
                    <CardTitle className="flex items-center gap-2 text-sm md:text-base">
                      <div className="p-1.5 md:p-2 bg-rose-100 text-rose-600 rounded-lg">
                        <AlertCircle className="h-3.5 w-3.5 md:h-4 md:w-4" />
                      </div>
                      Dropout Risk Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 md:space-y-4">
                    <div className="space-y-2 md:space-y-3">
                      <div>
                        <div className="flex justify-between text-xs md:text-sm mb-1">
                          <span className="text-slate-500">High Risk</span>
                          <span className="font-medium text-rose-600">{aiPredictions.dropoutRisk.highRiskStudents}</span>
                        </div>
                        <div className="h-1.5 md:h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-rose-500 rounded-full transition-all duration-500"
                            style={{ width: `${(aiPredictions.dropoutRisk.highRiskStudents / Math.max(1, aiPredictions.dropoutRisk.highRiskStudents + aiPredictions.dropoutRisk.mediumRiskStudents + aiPredictions.dropoutRisk.lowRiskStudents)) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs md:text-sm mb-1">
                          <span className="text-slate-500">Medium Risk</span>
                          <span className="font-medium text-orange-600">{aiPredictions.dropoutRisk.mediumRiskStudents}</span>
                        </div>
                        <div className="h-1.5 md:h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-orange-500 rounded-full transition-all duration-500"
                            style={{ width: `${(aiPredictions.dropoutRisk.mediumRiskStudents / Math.max(1, aiPredictions.dropoutRisk.highRiskStudents + aiPredictions.dropoutRisk.mediumRiskStudents + aiPredictions.dropoutRisk.lowRiskStudents)) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs md:text-sm mb-1">
                          <span className="text-slate-500">Low Risk</span>
                          <span className="font-medium text-emerald-600">{aiPredictions.dropoutRisk.lowRiskStudents}</span>
                        </div>
                        <div className="h-1.5 md:h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                            style={{ width: `${(aiPredictions.dropoutRisk.lowRiskStudents / Math.max(1, aiPredictions.dropoutRisk.highRiskStudents + aiPredictions.dropoutRisk.mediumRiskStudents + aiPredictions.dropoutRisk.lowRiskStudents)) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                      <p className="text-[10px] md:text-xs text-slate-500 mb-2">Key Risk Factors:</p>
                      <div className="flex flex-wrap gap-1">
                        {aiPredictions.dropoutRisk.riskFactors.slice(0, 3).map((factor, i) => (
                          <Badge key={i} variant="secondary" className="text-[10px]">
                            {factor}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Performance Predictions */}
                <Card className="border-none shadow-md hover:shadow-lg transition-all duration-300">
                  <CardHeader className="pb-3 md:pb-4">
                    <CardTitle className="flex items-center gap-2 text-sm md:text-base">
                      <div className="p-1.5 md:p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                        <GraduationCap className="h-3.5 w-3.5 md:h-4 md:w-4" />
                      </div>
                      Performance Forecast
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 md:space-y-3">
                    <div className="grid grid-cols-2 gap-2 md:gap-3">
                      <div className="text-center p-2 bg-emerald-50 dark:bg-emerald-900/10 rounded-lg">
                        <p className="text-lg md:text-xl font-bold text-emerald-700 dark:text-emerald-400">{aiPredictions.performancePredictions?.nextWeekAverage || 0}%</p>
                        <p className="text-[10px] text-slate-500">Next Week</p>
                      </div>
                      <div className="text-center p-2 bg-blue-50 dark:bg-blue-900/10 rounded-lg">
                        <p className="text-lg md:text-xl font-bold text-blue-700 dark:text-blue-400">{aiPredictions.performancePredictions?.nextMonthAverage || 0}%</p>
                        <p className="text-[10px] text-slate-500">Next Month</p>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                      <p className="text-xs font-medium text-slate-700 dark:text-slate-300">Top Grades:</p>
                      <div className="flex flex-wrap gap-1">
                        {aiPredictions.performancePredictions?.topPerformingGrades.slice(0, 3).map((grade, i) => (
                          <Badge key={i} variant="outline" className="text-[10px]">
                            {grade.grade}: {grade.average}%
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {/* Attendance Patterns */}
                <Card className="border-none shadow-md hover:shadow-lg transition-all duration-300">
                  <CardHeader className="pb-3 md:pb-4">
                    <CardTitle className="flex items-center gap-2 text-sm md:text-base">
                      <div className="p-1.5 md:p-2 bg-blue-100 text-blue-600 rounded-lg">
                        <ClipboardCheck className="h-3.5 w-3.5 md:h-4 md:w-4" />
                      </div>
                      Attendance Patterns
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 md:space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">
                          {(aiPredictions.attendancePatterns?.todayPrediction.rate || 0).toFixed(0)}%
                        </p>
                        <p className="text-[10px] md:text-xs text-slate-500">Today's Prediction</p>
                      </div>
                      <Badge className="bg-blue-100 text-blue-700 rounded-full text-[10px] md:text-xs">
                        {aiPredictions.attendancePatterns?.predictedNextWeek || 0}% Next Week
                      </Badge>
                    </div>
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5 md:space-y-2">
                      <div className="flex justify-between text-xs md:text-sm">
                        <span className="text-slate-500">At-Risk Students</span>
                        <span className="font-medium text-amber-600">{aiPredictions.attendancePatterns?.atRiskStudents || 0}</span>
                      </div>
                      <div className="flex justify-between text-xs md:text-sm">
                        <span className="text-slate-500">Present Today</span>
                        <span className="font-medium text-emerald-600">{aiPredictions.attendancePatterns?.todayPrediction.present || 0}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Teacher Effectiveness */}
                <Card className="border-none shadow-md hover:shadow-lg transition-all duration-300">
                  <CardHeader className="pb-3 md:pb-4">
                    <CardTitle className="flex items-center gap-2 text-sm md:text-base">
                      <div className="p-1.5 md:p-2 bg-purple-100 text-purple-600 rounded-lg">
                        <Users className="h-3.5 w-3.5 md:h-4 md:w-4" />
                      </div>
                      Teacher Insights
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 md:space-y-3">
                    <div className="text-center p-2 bg-purple-50 dark:bg-purple-900/10 rounded-lg">
                      <p className="text-xl md:text-2xl font-bold text-purple-700 dark:text-purple-400">{(aiPredictions.teacherEffectiveness?.overallEffectiveness || 0).toFixed(1)}</p>
                      <p className="text-[10px] text-slate-500">Overall Effectiveness</p>
                    </div>
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5 md:space-y-2">
                      <p className="text-xs font-medium text-slate-700 dark:text-slate-300">Top Teachers:</p>
                      <div className="space-y-1">
                        {aiPredictions.teacherEffectiveness?.topTeachers.slice(0, 2).map((teacher, i) => (
                          <div key={i} className="flex justify-between text-xs">
                            <span className="text-slate-600 dark:text-slate-400 truncate pr-2">{teacher.name}</span>
                            <span className="font-medium text-purple-600 shrink-0">{(teacher.effectiveness * 100).toFixed(0)}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Smart Recommendations */}
                <Card className="border-none shadow-md hover:shadow-lg transition-all duration-300">
                  <CardHeader className="pb-3 md:pb-4">
                    <CardTitle className="flex items-center gap-2 text-sm md:text-base">
                      <div className="p-1.5 md:p-2 bg-amber-100 text-amber-600 rounded-lg">
                        <Lightbulb className="h-3.5 w-3.5 md:h-4 md:w-4" />
                      </div>
                      AI Recommendations
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 md:space-y-3">
                    <div className="space-y-1.5 md:space-y-2">
                      {aiPredictions.resourceOptimization.resourceRecommendations.slice(0, 3).map((rec, i) => (
                        <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                          <ChevronRight className="h-3.5 w-3.5 md:h-4 md:w-4 text-violet-500 shrink-0 mt-0.5" />
                          <p className="text-[10px] md:text-xs text-slate-700 dark:text-slate-300 leading-relaxed line-clamp-2">{rec}</p>
                        </div>
                      ))}
                    </div>
                    <Dialog open={showRecommendationsDialog} onOpenChange={setShowRecommendationsDialog}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="w-full text-xs">
                          View All Recommendations
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>All AI Recommendations</DialogTitle>
                          <DialogDescription>
                            AI-powered insights based on current school data
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-3 mt-4">
                          {aiPredictions.resourceOptimization.resourceRecommendations.map((rec, i) => (
                            <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                              <div className="p-1 bg-amber-100 text-amber-600 rounded-full">
                                <Lightbulb className="h-3 w-3" />
                              </div>
                              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{rec}</p>
                            </div>
                          ))}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </CardContent>
                </Card>
              </div>

              {/* AI Insights Section */}
              {aiPredictions.insights && (
                <Card className="border-none shadow-md">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <div className="p-2 bg-gradient-to-r from-violet-100 to-fuchsia-100 text-violet-600 rounded-lg">
                        <Brain className="h-4 w-4" />
                      </div>
                      AI-Generated Insights
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800">
                        <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 mb-2">Key Highlights</p>
                        <ul className="space-y-1">
                          {aiPredictions.insights.keyHighlights.slice(0, 3).map((highlight, i) => (
                            <li key={i} className="text-xs text-slate-700 dark:text-slate-300 flex items-start gap-1">
                              <span className="text-emerald-500 mt-0.5">•</span>
                              {highlight}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800">
                        <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 mb-2">Opportunities</p>
                        <ul className="space-y-1">
                          {aiPredictions.insights.opportunities.slice(0, 3).map((opportunity, i) => (
                            <li key={i} className="text-xs text-slate-700 dark:text-slate-300 flex items-start gap-1">
                              <span className="text-blue-500 mt-0.5">•</span>
                              {opportunity}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-800">
                        <p className="text-xs font-semibold text-rose-700 dark:text-rose-400 mb-2">Priorities</p>
                        <ul className="space-y-1">
                          {aiPredictions.insights.priorities.slice(0, 3).map((priority, i) => (
                            <li key={i} className="text-xs text-slate-700 dark:text-slate-300 flex items-start gap-1">
                              <span className={cn(
                                "mt-0.5",
                                priority.urgency === 'high' && "text-rose-500",
                                priority.urgency === 'medium' && "text-amber-500",
                                priority.urgency === 'low' && "text-blue-500"
                              )}>•</span>
                              {priority.title}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <Card className="border-none shadow-md">
              <CardContent className="p-8 text-center">
                <Brain className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">Unable to load AI predictions</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleRefreshPredictions}
                  className="mt-4"
                >
                  Try Again
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

          <div className="grid gap-4 md:gap-6 lg:grid-cols-3 overflow-x-hidden">
            {/* Recent Activities */}
            <div className="lg:col-span-2 space-y-4 md:space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg md:text-xl font-bold flex items-center gap-2">
                <Clock className="h-4 w-4 md:h-5 md:w-5 text-violet-500" />
                Recent Activities
              </h2>
              <Button variant="ghost" className="text-xs md:text-sm font-medium text-violet-600 hover:text-violet-700">
                View All
              </Button>
            </div>
            
            <div className="space-y-3 md:space-y-4">
              {data.recentActivities.map((activity) => {
                const IconComponent = iconMap[activity.icon] || Clock
                return (
                  <div key={activity.id} className="group flex items-start gap-3 md:gap-4 p-3 md:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:border-violet-200 dark:hover:border-violet-800 transition-all duration-300 shadow-sm hover:shadow-md min-h-[5rem] md:min-h-[6rem]">
                    <div className={cn(
                      "p-2 md:p-3 rounded-xl shrink-0",
                      activity.type === 'student' && "bg-blue-100 text-blue-600",
                      activity.type === 'attendance' && "bg-violet-100 text-violet-600",
                      activity.type === 'exam' && "bg-emerald-100 text-emerald-600",
                      activity.type === 'alert' && "bg-rose-100 text-rose-600",
                    )}>
                      <IconComponent className="h-4 w-4 md:h-5 md:w-5" />
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5 md:pt-1">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-semibold text-sm md:text-base text-slate-900 dark:text-white truncate pr-2 md:pr-4">
                          {activity.title}
                        </p>
                        <Badge variant="secondary" className={cn(
                          "rounded-full text-[10px] md:text-xs uppercase font-bold tracking-wider",
                          activity.status === 'success' && "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400",
                          activity.status === 'info' && "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400",
                          activity.status === 'warning' && "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400",
                        )}>
                          {activity.status}
                        </Badge>
                      </div>
                      <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mb-1 md:mb-2">
                        {activity.description}
                      </p>
                      <p className="text-[10px] md:text-xs text-slate-400">
                        {activity.time}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-4 md:space-y-6 lg:space-y-8 overflow-x-hidden">
            {/* Quick Actions */}
            <div className="rounded-3xl bg-slate-900 text-white p-4 md:p-6 shadow-xl">
              <div className="flex items-center gap-2 mb-4 md:mb-6">
                <div className="p-1.5 md:p-2 bg-orange-500/20 rounded-lg">
                  <Sparkles className="h-4 w-4 md:h-5 md:w-5 text-orange-500" />
                </div>
                <h2 className="text-base md:text-lg font-bold">Quick Actions</h2>
              </div>

              <div className="space-y-2 md:space-y-3">
                {quickActions.map((action) => (
                  <Link key={action.title} href={action.href}>
                    <Button
                      variant="ghost"
                      className="w-full justify-between h-auto py-3 md:py-4 px-3 md:px-4 bg-white/5 hover:bg-white/10 rounded-xl text-left group border border-white/5 mb-2 md:mb-3 last:mb-0"
                    >
                      <div className="flex items-center gap-2 md:gap-3">
                        <div className="p-1.5 md:p-2 rounded-lg bg-slate-800 text-slate-300 group-hover:text-white transition-colors">
                          <action.icon className="h-3.5 w-3.5 md:h-4 md:w-4" />
                        </div>
                        <div>
                          <p className="font-medium text-white text-xs md:text-sm">{action.title}</p>
                          <p className="text-[10px] md:text-xs text-slate-400">{action.description}</p>
                        </div>
                      </div>
                      <ArrowUpRight className="h-3.5 w-3.5 md:h-4 md:w-4 text-slate-500 group-hover:text-white transition-colors shrink-0" />
                    </Button>
                  </Link>
                ))}
              </div>
            </div>

            {/* Highlights */}
            <div className="space-y-3 md:space-y-4">
              <h3 className="font-bold flex items-center gap-2 text-slate-900 dark:text-white text-sm md:text-base">
                <span className="p-1.5 rounded-lg bg-rose-100 text-rose-500">
                  <TrendingUp className="h-3.5 w-3.5 md:h-4 md:w-4" />
                </span>
                Highlights
              </h3>

              {data.highlights.map((highlight, index) => {
                const IconComponent = iconMap[highlight.icon] || TrendingUp
                const colorClass = index === 0 ? 'emerald' : index === 1 ? 'violet' : index === 2 ? 'blue' : 'orange'

                return (
                  <div key={index} className={cn(
                    "rounded-2xl p-3 md:p-5 border",
                    colorClass === 'emerald' && "bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-800",
                    colorClass === 'violet' && "bg-violet-50 dark:bg-violet-900/10 border-violet-100 dark:border-violet-800",
                    colorClass === 'blue' && "bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-800",
                    colorClass === 'orange' && "bg-orange-50 dark:bg-orange-900/10 border-orange-100 dark:border-orange-800",
                  )}>
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className={cn(
                          "text-xl md:text-2xl font-bold",
                          colorClass === 'emerald' && "text-emerald-700 dark:text-emerald-400",
                          colorClass === 'violet' && "text-violet-700 dark:text-violet-400",
                          colorClass === 'blue' && "text-blue-700 dark:text-blue-400",
                          colorClass === 'orange' && "text-orange-700 dark:text-orange-400",
                        )}>
                          {highlight.value}
                        </p>
                        <p className={cn(
                          "text-xs md:text-sm font-medium",
                          colorClass === 'emerald' && "text-emerald-600/80 dark:text-emerald-400/80",
                          colorClass === 'violet' && "text-violet-600/80 dark:text-violet-400/80",
                          colorClass === 'blue' && "text-blue-600/80 dark:text-blue-400/80",
                          colorClass === 'orange' && "text-orange-600/80 dark:text-orange-400/80",
                        )}>
                          {highlight.title}
                        </p>
                        <p className="text-[10px] md:text-xs text-slate-500 mt-1">
                          {highlight.description}
                        </p>
                      </div>
                    </div>
                    <IconComponent className={cn(
                      "h-4 w-4 md:h-5 md:w-5",
                      colorClass === 'emerald' && "text-emerald-500",
                      colorClass === 'violet' && "text-violet-500",
                      colorClass === 'blue' && "text-blue-500",
                      colorClass === 'orange' && "text-orange-500",
                    )} />
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
      <AIChatAssistant />
    </DashboardLayout>
  )
}

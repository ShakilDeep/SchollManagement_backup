'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
  Truck
} from 'lucide-react'
import { cn } from '@/lib/utils'

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

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const res = await fetch('/api/dashboard')
        if (!res.ok) throw new Error('Failed to fetch dashboard data')
        const dashboardData = await res.json()
        setData(dashboardData)
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-8">
          <div className="animate-pulse">
            <div className="h-64 bg-gradient-to-r from-violet-200 to-fuchsia-200 rounded-3xl"></div>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-slate-200 rounded-xl animate-pulse"></div>
            ))}
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
    },
    {
      title: 'View Reports',
      description: 'Analytics & insights',
      icon: FileText,
      href: '/dashboard/analytics'
    }
  ]

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Welcome Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-violet-600 to-fuchsia-600 p-8 text-white shadow-xl">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute bottom-0 left-0 -mb-10 -ml-10 h-64 w-64 rounded-full bg-black/10 blur-3xl" />
          
          <div className="relative z-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
              <div className="flex items-center gap-3 bg-white/20 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
                <Sparkles className="h-4 w-4 text-yellow-300" />
                <span className="text-sm font-medium">Spring Semester 2025</span>
              </div>
              <Button className="bg-white text-violet-600 hover:bg-white/90 rounded-full px-6">
                Start New Day <ArrowUpRight className="ml-2 h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-2 mb-12">
              <h1 className="text-4xl font-bold tracking-tight">
                Welcome Back, <span className="text-yellow-300">Admin!</span>
              </h1>
              <p className="text-white/80 text-lg max-w-2xl">
                Ready to make today exceptional? Here's what's happening across your campus.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8 border-t border-white/20">
              <div>
                <p className="text-3xl font-bold mb-1">{data.stats.find(s => s.title === 'Attendance Rate')?.value || '0%'}</p>
                <p className="text-sm text-white/70">Attendance Rate</p>
              </div>
              <div>
                <p className="text-3xl font-bold mb-1">{data.stats.find(s => s.title === 'Total Students')?.change || '+0'}</p>
                <p className="text-sm text-white/70">New Students</p>
              </div>
              <div>
                <p className="text-3xl font-bold mb-1">{data.highlights.length}</p>
                <p className="text-sm text-white/70">Key Metrics</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {data.stats.map((stat) => {
            const IconComponent = iconMap[stat.icon.name] || Users
            return (
              <Card key={stat.title} className="border-none shadow-md hover:shadow-lg transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className={cn(
                      "p-3 rounded-2xl",
                      stat.color === 'blue' && "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
                      stat.color === 'purple' && "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
                      stat.color === 'green' && "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
                      stat.color === 'orange' && "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400",
                    )}>
                      <IconComponent className="h-6 w-6" />
                    </div>
                    <Badge className={cn(
                      "rounded-full px-2 py-1",
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
                    <h3 className="text-3xl font-bold text-slate-900 dark:text-white">{stat.value}</h3>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{stat.title}</p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      {stat.trend === 'up' ? <TrendingUp className="h-3 w-3" /> : stat.trend === 'down' ? <TrendingDown className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                      <span>{stat.description}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Recent Activities */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Clock className="h-5 w-5 text-violet-500" />
                Recent Activities
              </h2>
              <Button variant="ghost" className="text-sm font-medium text-violet-600 hover:text-violet-700">
                View All
              </Button>
            </div>
            
            <div className="space-y-4">
              {data.recentActivities.map((activity) => {
                const IconComponent = iconMap[activity.icon] || Clock
                return (
                  <div key={activity.id} className="group flex items-start gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:border-violet-200 dark:hover:border-violet-800 transition-all duration-300 shadow-sm hover:shadow-md">
                    <div className={cn(
                      "p-3 rounded-xl shrink-0",
                      activity.type === 'student' && "bg-blue-100 text-blue-600",
                      activity.type === 'attendance' && "bg-violet-100 text-violet-600",
                      activity.type === 'exam' && "bg-emerald-100 text-emerald-600",
                      activity.type === 'alert' && "bg-rose-100 text-rose-600",
                    )}>
                      <IconComponent className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0 pt-1">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-semibold text-slate-900 dark:text-white truncate pr-4">
                          {activity.title}
                        </p>
                        <Badge variant="secondary" className={cn(
                          "rounded-full text-[10px] uppercase font-bold tracking-wider",
                          activity.status === 'success' && "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400",
                          activity.status === 'info' && "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400",
                          activity.status === 'warning' && "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400",
                        )}>
                          {activity.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
                        {activity.description}
                      </p>
                      <p className="text-xs text-slate-400">
                        {activity.time}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-8">
            {/* Quick Actions */}
            <div className="rounded-3xl bg-slate-900 text-white p-6 shadow-xl">
              <div className="flex items-center gap-2 mb-6">
                <div className="p-2 bg-orange-500/20 rounded-lg">
                  <Sparkles className="h-5 w-5 text-orange-500" />
                </div>
                <h2 className="text-lg font-bold">Quick Actions</h2>
              </div>
              
              <div className="space-y-3">
                {quickActions.map((action) => (
                  <Link key={action.title} href={action.href}>
                    <Button
                      variant="ghost"
                      className="w-full justify-between h-auto py-4 px-4 bg-white/5 hover:bg-white/10 rounded-xl text-left group border border-white/5 mb-3 last:mb-0"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-slate-800 text-slate-300 group-hover:text-white transition-colors">
                          <action.icon className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium text-white">{action.title}</p>
                          <p className="text-xs text-slate-400">{action.description}</p>
                        </div>
                      </div>
                      <ArrowUpRight className="h-4 w-4 text-slate-500 group-hover:text-white transition-colors" />
                    </Button>
                  </Link>
                ))}
              </div>
            </div>

            {/* Highlights */}
            <div className="space-y-4">
              <h3 className="font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                <span className="p-1.5 rounded-lg bg-rose-100 text-rose-500">
                  <TrendingUp className="h-4 w-4" />
                </span>
                Highlights
              </h3>
              
              {data.highlights.map((highlight, index) => {
                const IconComponent = iconMap[highlight.icon] || TrendingUp
                const colorClass = index === 0 ? 'emerald' : index === 1 ? 'violet' : index === 2 ? 'blue' : 'orange'
                
                return (
                  <div key={index} className={cn(
                    "rounded-2xl p-5 border",
                    colorClass === 'emerald' && "bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-800",
                    colorClass === 'violet' && "bg-violet-50 dark:bg-violet-900/10 border-violet-100 dark:border-violet-800",
                    colorClass === 'blue' && "bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-800",
                    colorClass === 'orange' && "bg-orange-50 dark:bg-orange-900/10 border-orange-100 dark:border-orange-800",
                  )}>
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className={cn(
                          "text-2xl font-bold",
                          colorClass === 'emerald' && "text-emerald-700 dark:text-emerald-400",
                          colorClass === 'violet' && "text-violet-700 dark:text-violet-400",
                          colorClass === 'blue' && "text-blue-700 dark:text-blue-400",
                          colorClass === 'orange' && "text-orange-700 dark:text-orange-400",
                        )}>
                          {highlight.value}
                        </p>
                        <p className={cn(
                          "text-sm font-medium",
                          colorClass === 'emerald' && "text-emerald-600/80 dark:text-emerald-400/80",
                          colorClass === 'violet' && "text-violet-600/80 dark:text-violet-400/80",
                          colorClass === 'blue' && "text-blue-600/80 dark:text-blue-400/80",
                          colorClass === 'orange' && "text-orange-600/80 dark:text-orange-400/80",
                        )}>
                          {highlight.title}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          {highlight.description}
                        </p>
                      </div>
                      <IconComponent className={cn(
                        "h-5 w-5",
                        colorClass === 'emerald' && "text-emerald-500",
                        colorClass === 'violet' && "text-violet-500",
                        colorClass === 'blue' && "text-blue-500",
                        colorClass === 'orange' && "text-orange-500",
                      )} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

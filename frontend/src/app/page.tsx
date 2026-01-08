'use client'

import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  Users,
  GraduationCap,
  ClipboardCheck,
  BookOpen,
  TrendingUp,
  TrendingDown,
  Clock,
  AlertTriangle,
  ArrowUpRight,
  Sparkles,
  Flame,
  Zap,
  Target,
  Award
} from 'lucide-react'

export default function DashboardPage() {
  const stats = [
    {
      title: 'Total Students',
      value: '2,450',
      change: '+12.5%',
      trend: 'up',
      icon: Users,
      gradient: 'from-blue-500 to-cyan-500',
      bgLight: 'bg-blue-50 dark:bg-blue-950/30',
      description: 'vs last semester'
    },
    {
      title: 'Teachers',
      value: '156',
      change: '+3',
      trend: 'up',
      icon: GraduationCap,
      gradient: 'from-violet-500 to-purple-500',
      bgLight: 'bg-violet-50 dark:bg-violet-950/30',
      description: 'new hires this month'
    },
    {
      title: 'Today\'s Attendance',
      value: '96.2%',
      change: '-1.2%',
      trend: 'down',
      icon: ClipboardCheck,
      gradient: 'from-emerald-500 to-teal-500',
      bgLight: 'bg-emerald-50 dark:bg-emerald-950/30',
      description: 'overall attendance'
    },
    {
      title: 'Active Courses',
      value: '89',
      change: '+5',
      trend: 'up',
      icon: BookOpen,
      gradient: 'from-orange-500 to-red-500',
      bgLight: 'bg-orange-50 dark:bg-orange-950/30',
      description: 'courses this semester'
    }
  ]

  const recentActivities = [
    {
      id: 1,
      type: 'student',
      title: 'New student enrolled',
      description: 'Sarah Johnson enrolled in Grade 10-A',
      time: '2h ago',
      status: 'success'
    },
    {
      id: 2,
      type: 'attendance',
      title: 'Attendance report generated',
      description: 'Weekly attendance report for Grade 9',
      time: '3h ago',
      status: 'info'
    },
    {
      id: 3,
      type: 'exam',
      title: 'Exam results published',
      description: 'Mathematics midterm results for Grade 11',
      time: '5h ago',
      status: 'success'
    },
    {
      id: 4,
      type: 'alert',
      title: 'Low attendance alert',
      description: '15 students below 75% attendance',
      time: '6h ago',
      status: 'warning'
    }
  ]

  const quickActions = [
    {
      title: 'Add Student',
      description: 'Register new student',
      icon: Users,
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      title: 'Take Attendance',
      description: 'Mark daily attendance',
      icon: ClipboardCheck,
      gradient: 'from-emerald-500 to-teal-500'
    },
    {
      title: 'Create Lesson',
      description: 'Plan new lesson',
      icon: BookOpen,
      gradient: 'from-violet-500 to-purple-500'
    },
    {
      title: 'View Reports',
      description: 'Analytics & insights',
      icon: Target,
      gradient: 'from-orange-500 to-red-500'
    }
  ]

  return (
    <DashboardLayout>
      <div className="space-y-8 pb-8">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 p-8 md:p-12 shadow-2xl shadow-violet-500/30">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-white rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2" />
          </div>
          
          {/* Content */}
          <div className="relative z-10">
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <Sparkles className="w-8 h-8 text-yellow-300" />
                  <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm text-sm">
                    Spring Semester 2025
                  </Badge>
                </div>
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
                  Welcome Back, <span className="text-yellow-300">John!</span>
                </h1>
                <p className="text-lg text-white/80 max-w-xl">
                  Ready to make today exceptional? Here's what's happening across your campus.
                </p>
              </div>
              <Button 
                className="bg-white text-violet-600 hover:bg-white/90 rounded-2xl px-8 py-3 text-base font-semibold shadow-xl"
              >
                Start New Day
                <ArrowUpRight className="ml-2 w-5 h-5" />
              </Button>
            </div>

            {/* Mini Stats */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-white/20">
              <div>
                <p className="text-3xl font-bold text-white">96.2%</p>
                <p className="text-sm text-white/70">Attendance Rate</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-white">15</p>
                <p className="text-sm text-white/70">New Students</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-white">8</p>
                <p className="text-sm text-white/70">Upcoming Events</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <div 
              key={stat.title}
              className={cn(
                'group relative overflow-hidden rounded-2xl p-6 transition-all duration-500',
                'bg-white dark:bg-slate-900/50',
                'hover:shadow-2xl hover:-translate-y-1',
                stat.bgLight
              )}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Gradient Background */}
              <div className={cn(
                'absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500',
                'bg-gradient-to-br ' + stat.gradient
              )} />
              
              {/* Content */}
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <div className={cn(
                    'w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500',
                    'bg-gradient-to-br ' + stat.gradient + ' shadow-lg',
                    'group-hover:scale-110 group-hover:rotate-3'
                  )}>
                    <stat.icon className="w-7 h-7 text-white" />
                  </div>
                  <Badge 
                    variant={stat.trend === 'up' ? 'default' : 'secondary'}
                    className={cn(
                      'px-3 py-1 rounded-full text-sm font-semibold',
                      stat.trend === 'up' 
                        ? 'bg-emerald-500 text-white' 
                        : 'bg-red-500 text-white'
                    )}
                  >
                    {stat.change}
                  </Badge>
                </div>
                <p className="text-3xl font-bold text-slate-900 dark:text-white mb-1 group-hover:text-white transition-colors">
                  {stat.value}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                  {stat.title}
                </p>
                <div className="flex items-center gap-2">
                  {stat.trend === 'up' ? (
                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-500" />
                  )}
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {stat.description}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Recent Activities */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900/50 rounded-3xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Recent Activities
                </h2>
              </div>
              <Button variant="ghost" size="sm" className="rounded-xl">
                View All
              </Button>
            </div>
            
            <div className="space-y-3">
              {recentActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="group flex items-start gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 hover:bg-gradient-to-r hover:from-slate-100 hover:to-slate-200 dark:hover:from-slate-800 dark:hover:to-slate-700 transition-all duration-300 cursor-pointer"
                >
                  <div className={cn(
                    'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300',
                    activity.status === 'success' && 'bg-gradient-to-br from-emerald-500 to-teal-500',
                    activity.status === 'warning' && 'bg-gradient-to-br from-orange-500 to-red-500',
                    'bg-gradient-to-br from-blue-500 to-cyan-500',
                    'group-hover:scale-110'
                  )}>
                    {activity.status === 'success' && <Award className="w-6 h-6 text-white" />}
                    {activity.status === 'warning' && <AlertTriangle className="w-6 h-6 text-white" />}
                    {activity.status !== 'success' && activity.status !== 'warning' && <Clock className="w-6 h-6 text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 dark:text-white mb-1">
                      {activity.title}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                      {activity.description}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-500">
                      {activity.time}
                    </p>
                  </div>
                  <Badge 
                    variant={activity.status === 'success' ? 'default' : activity.status === 'warning' ? 'destructive' : 'secondary'}
                    className="flex-shrink-0"
                  >
                    {activity.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions & Events */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-950 rounded-3xl p-6 shadow-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-white">
                  Quick Actions
                </h2>
              </div>
              
              <div className="space-y-3">
                {quickActions.map((action, index) => (
                  <button
                    key={action.title}
                    className={cn(
                      'group relative w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 overflow-hidden',
                      'bg-slate-800/50 hover:bg-slate-700/50',
                      'hover:shadow-lg'
                    )}
                  >
                    {/* Gradient Background on Hover */}
                    <div className={cn(
                      'absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300',
                      'bg-gradient-to-r ' + action.gradient
                    )} />
                    
                    {/* Content */}
                    <div className="relative z-10 flex items-center gap-4 w-full">
                      <div className={cn(
                        'w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300',
                        'bg-slate-700 group-hover:bg-white/20',
                        'group-hover:scale-110'
                      )}>
                        <action.icon className="w-5 h-5 text-white group-hover:text-white transition-colors" />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-semibold text-white mb-0.5 group-hover:text-white transition-colors">
                          {action.title}
                        </p>
                        <p className="text-sm text-slate-400 group-hover:text-white/80 transition-colors">
                          {action.description}
                        </p>
                      </div>
                      <ArrowUpRight className={cn(
                        'w-5 h-5 text-slate-500 transition-all duration-300',
                        'group-hover:text-white group-hover:translate-x-1'
                      )} />
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Performance Highlights */}
            <div className="bg-white dark:bg-slate-900/50 rounded-3xl p-6 shadow-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center">
                  <Flame className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Highlights
                </h2>
              </div>
              
              <div className="space-y-3">
                <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border border-emerald-200 dark:border-emerald-800/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                        +15%
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Student Enrollment
                      </p>
                    </div>
                    <TrendingUp className="w-6 h-6 text-emerald-500" />
                  </div>
                </div>
                
                <div className="p-4 rounded-2xl bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30 border border-violet-200 dark:border-violet-800/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-violet-600 dark:text-violet-400">
                        92%
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Exam Pass Rate
                      </p>
                    </div>
                    <Award className="w-6 h-6 text-violet-500" />
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 border border-blue-200 dark:border-blue-800/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        156
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Active Teachers
                      </p>
                    </div>
                    <GraduationCap className="w-6 h-6 text-blue-500" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

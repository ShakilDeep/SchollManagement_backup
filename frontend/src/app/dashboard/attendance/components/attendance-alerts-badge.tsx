'use client'

import { memo } from 'react'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, AlertCircle, Info, CheckCircle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface AbsencePattern {
  studentId: string
  studentName: string
  consecutiveAbsences: number
  patternType: 'consecutive' | 'recurrent' | 'sporadic' | 'none'
  daysAbsent: number[]
  lastAbsentDate: Date
  riskLevel: 'critical' | 'high' | 'medium' | 'low'
  patternDescription: string
  recommendations: string[]
}

export interface AttendanceAlertsBadgeProps {
  pattern?: AbsencePattern
  loading?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export const AttendanceAlertsBadge = memo(({ pattern, loading, size = 'sm' }: AttendanceAlertsBadgeProps) => {
  if (loading) {
    return (
      <div className={cn(
        'flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium',
        'bg-slate-100 dark:bg-slate-800',
        'animate-pulse'
      )}>
        <Loader2 className="w-3 h-3 animate-spin text-slate-400" />
        <span className="text-slate-600 dark:text-slate-400">Analyzing...</span>
      </div>
    )
  }

  if (!pattern || pattern.riskLevel === 'low' || pattern.riskLevel === 'none') {
    return null
  }

  const riskConfig = {
    critical: {
      icon: AlertTriangle,
      color: 'rose',
      bgClass: 'bg-rose-500',
      textClass: 'text-rose-600',
      lightBgClass: 'bg-rose-100',
      darkTextClass: 'dark:text-rose-400',
      message: 'Critical Attendance Alert'
    },
    high: {
      icon: AlertCircle,
      color: 'amber',
      bgClass: 'bg-amber-500',
      textClass: 'text-amber-600',
      lightBgClass: 'bg-amber-100',
      darkTextClass: 'dark:text-amber-400',
      message: 'Attendance Concern'
    },
    medium: {
      icon: Info,
      color: 'blue',
      bgClass: 'bg-blue-500',
      textClass: 'text-blue-600',
      lightBgClass: 'bg-blue-100',
      darkTextClass: 'dark:text-blue-400',
      message: 'Monitor Attendance'
    },
    low: {
      icon: CheckCircle,
      color: 'emerald',
      bgClass: 'bg-emerald-500',
      textClass: 'text-emerald-600',
      lightBgClass: 'bg-emerald-100',
      darkTextClass: 'dark:text-emerald-400',
      message: 'Good Attendance'
    }
  }

  const config = riskConfig[pattern.riskLevel]
  const Icon = config.icon

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  }

  return (
    <Badge
      variant="outline"
      className={cn(
        sizeClasses[size],
        'gap-1.5',
        config.lightBgClass,
        config.textClass,
        'dark:' + config.lightBgClass,
        'dark:' + config.darkTextClass,
        'border-current'
      )}
      title={`${config.message}: ${pattern.patternDescription}`}
    >
      <Icon className="w-3 h-3" />
      <span className="capitalize">{pattern.riskLevel}</span>
      {pattern.consecutiveAbsences > 0 && (
        <span className="opacity-70">({pattern.consecutiveAbsences} days)</span>
      )}
    </Badge>
  )
})

AttendanceAlertsBadge.displayName = 'AttendanceAlertsBadge'

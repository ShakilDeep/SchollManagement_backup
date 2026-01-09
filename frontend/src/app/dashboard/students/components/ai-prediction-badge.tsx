'use client'

import { memo } from 'react'
import { AlertTriangle, TrendingUp, CheckCircle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface StudentPrediction {
  studentId: string
  riskLevel: 'high' | 'medium' | 'low' | 'unknown'
  riskFactors: string[]
  predictedGrade: string
  confidence: number
  recommendations: string[]
}

interface AIPredictionBadgeProps {
  prediction?: StudentPrediction
  loading?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export const AIPredictionBadge = memo(({ prediction, loading, size = 'sm' }: AIPredictionBadgeProps) => {
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

  if (!prediction || prediction.riskLevel === 'unknown') {
    return null
  }

  const config = {
    high: {
      icon: AlertTriangle,
      color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
      label: 'High Risk',
      borderColor: 'border-red-500'
    },
    medium: {
      icon: AlertTriangle,
      color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
      label: 'Medium Risk',
      borderColor: 'border-amber-500'
    },
    low: {
      icon: CheckCircle,
      color: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
      label: 'On Track',
      borderColor: 'border-emerald-500'
    }
  }

  const { icon: Icon, color, label, borderColor } = config[prediction.riskLevel]

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-2.5 text-base'
  }

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  }

  return (
    <div className="space-y-2">
      <div className={cn(
        'inline-flex items-center gap-2 rounded-full font-medium',
        color,
        sizeClasses[size]
      )}>
        <Icon className={iconSizes[size]} />
        <span>{label}</span>
      </div>

      {prediction.confidence > 0 && (
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <TrendingUp className="w-3 h-3" />
          <span>Predicted: {prediction.predictedGrade}</span>
          <span className="text-slate-300">•</span>
          <span>{Math.round(prediction.confidence * 100)}% confidence</span>
        </div>
      )}
    </div>
  )
})

AIPredictionBadge.displayName = 'AIPredictionBadge'

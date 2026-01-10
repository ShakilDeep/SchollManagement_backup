'use client'

import { memo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { UserCheck, UserX, Clock, Timer, TrendingUp, TrendingDown, Activity } from 'lucide-react'

interface StatsCardProps {
  title: string
  value: number
  icon: any
  colorClass: string
  bgClass: string
  trendValue: number
  getTrendIcon: (current: number, previous: number) => React.ReactNode
  getTrendColor: (current: number, previous: number) => string
}

export const StatsCard = memo(({ 
  title, 
  value, 
  icon: Icon, 
  colorClass, 
  bgClass, 
  trendValue,
  getTrendIcon,
  getTrendColor
}: StatsCardProps) => {
  return (
    <Card className={cn(
      "border-none shadow-2xl text-white overflow-hidden group hover:scale-105 transition-all duration-300",
      bgClass
    )}>
      <div className="absolute inset-0 bg-white/10 transform translate-x-full group-hover:translate-x-0 transition-transform duration-500"></div>
      <CardHeader className="relative z-10">
        <div className="flex items-center justify-between">
          <div className={cn(
            "p-3 rounded-2xl bg-white/20 backdrop-blur-sm",
            colorClass
          )}>
            <Icon className="h-8 w-8" />
          </div>
          <div className={cn("flex items-center gap-1", getTrendColor(value, trendValue))}>
            {getTrendIcon(value, trendValue)}
            <span className="text-sm">{trendValue > 0 ? `${Math.round((value - trendValue) / trendValue * 100)}%` : 'N/A'}</span>
          </div>
        </div>
        <CardTitle className="text-3xl font-bold mt-4">{value}</CardTitle>
        <p className="text-sm opacity-90">{title}</p>
      </CardHeader>
      <CardContent className="relative z-10">
        <div className="flex items-center gap-2 text-sm opacity-75">
          <Activity className="h-4 w-4" />
          <span>Updated just now</span>
        </div>
      </CardContent>
    </Card>
  )
})

StatsCard.displayName = 'StatsCard'

import { cn } from '@/lib/utils'

'use client'

import { memo } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BookOpen, FileText, FlaskConical, Palette, Calculator, Globe, Beaker, Music, Dumbbell, Code, GraduationCap } from 'lucide-react'

export interface Period {
  subject: string
  teacher: string
  room: string
  time: string
  conflict?: boolean
}

const subjectConfig: Record<string, {
  icon: any
  color: string
  difficulty: 'basic' | 'intermediate' | 'advanced'
  type: 'lecture' | 'lab' | 'practical'
}> = {
  'Mathematics': {
    icon: Calculator,
    color: 'bg-blue-500',
    difficulty: 'advanced',
    type: 'lecture'
  },
  'Science': {
    icon: FlaskConical,
    color: 'bg-green-500',
    difficulty: 'intermediate',
    type: 'lab'
  },
  'English': {
    icon: BookOpen,
    color: 'bg-purple-500',
    difficulty: 'basic',
    type: 'lecture'
  },
  'Social Studies': {
    icon: Globe,
    color: 'bg-orange-500',
    difficulty: 'basic',
    type: 'lecture'
  },
  'Art': {
    icon: Palette,
    color: 'bg-pink-500',
    difficulty: 'basic',
    type: 'practical'
  },
  'Music': {
    icon: Music,
    color: 'bg-yellow-500',
    difficulty: 'basic',
    type: 'practical'
  },
  'Physical Education': {
    icon: Dumbbell,
    color: 'bg-red-500',
    difficulty: 'intermediate',
    type: 'practical'
  },
  'Computer Science': {
    icon: Code,
    color: 'bg-cyan-500',
    difficulty: 'advanced',
    type: 'lab'
  },
  'Chemistry': {
    icon: Beaker,
    color: 'bg-emerald-500',
    difficulty: 'advanced',
    type: 'lab'
  },
  'Physics': {
    icon: FlaskConical,
    color: 'bg-indigo-500',
    difficulty: 'advanced',
    type: 'lab'
  },
  'Biology': {
    icon: FileText,
    color: 'bg-lime-500',
    difficulty: 'intermediate',
    type: 'lab'
  }
}

export interface SubjectCardProps {
  period: Period
  isCurrent?: boolean
}

export default memo(function SubjectCard({ period, isCurrent = false }: SubjectCardProps) {
  const config = subjectConfig[period.subject] || {
    icon: GraduationCap,
    color: 'bg-gray-500',
    difficulty: 'basic' as const,
    type: 'lecture' as const
  }
  const Icon = config.icon

  return (
    <Card className={`relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-105 ${
      isCurrent ? 'ring-2 ring-blue-500 shadow-lg' : ''
    } ${period.conflict ? 'border-red-300 bg-red-50' : ''}`}>
      <div className={`absolute top-0 right-0 w-16 h-16 ${config.color} opacity-10 rounded-bl-3xl`} />
      
      <div className="p-4 relative">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg ${config.color} bg-opacity-10`}>
              <Icon className={`w-5 h-5 ${config.color.replace('bg-', 'text-')}`} />
            </div>
            <div>
              <h4 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                {period.subject}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {period.teacher}
              </p>
            </div>
          </div>
          <Badge variant="outline" className="text-xs">
            {period.room}
          </Badge>
        </div>
        
        <div className="flex items-center gap-2 mt-3">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {period.time}
          </span>
          {period.conflict && (
            <Badge variant="destructive" className="text-xs">
              Conflict
            </Badge>
          )}
        </div>
      </div>
    </Card>
  )
})

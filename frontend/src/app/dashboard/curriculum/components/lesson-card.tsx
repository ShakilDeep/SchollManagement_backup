'use client'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, Clock, Edit, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Lesson } from '../page'

interface LessonCardProps {
  lesson: Lesson
  getStatusColor: (status: string) => string
  getInitials: (name: string) => string
  formatDate: (date: Date) => string
  onEdit: (lesson: Lesson) => void
  onDelete: (lessonId: string) => void
}

export function LessonCard({ lesson, getStatusColor, getInitials, formatDate, onEdit, onDelete }: LessonCardProps) {
  return (
    <div className="p-4 border border-slate-200 dark:border-slate-700/50 rounded-lg hover:border-slate-300 dark:hover:border-slate-600 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-medium text-slate-900 dark:text-white">
              {lesson.title}
            </h3>
            <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0', getStatusColor(lesson.status))}>
              {lesson.status}
            </Badge>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDate(lesson.date)}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {lesson.duration} min
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Avatar className="h-7 w-7">
            <AvatarFallback className="text-[10px]">
              {getInitials(lesson.teacher.user.name || lesson.teacher.firstName)}
            </AvatarFallback>
          </Avatar>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => onEdit(lesson)}
          >
            <Edit className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-red-600 hover:text-red-700 dark:text-red-400"
            onClick={() => onDelete(lesson.id)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  )
}

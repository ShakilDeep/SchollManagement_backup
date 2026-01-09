'use client'

import { Badge } from '@/components/ui/badge'
import { Circle } from 'lucide-react'
import { Curriculum } from '../page'

interface CurriculumCardProps {
  curriculum: Curriculum
  isSelected: boolean
  onClick: () => void
  getLessonProgress: (lessons: any[]) => number
}

export function CurriculumCard({ curriculum, isSelected, onClick, getLessonProgress }: CurriculumCardProps) {
  const progress = getLessonProgress(curriculum.lessons)

  return (
    <button
      onClick={onClick}
      className={`w-full p-4 text-left transition-colors hover:bg-slate-100 dark:hover:bg-slate-800/50 ${
        isSelected ? 'bg-slate-100 dark:bg-slate-800/50' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
            {curriculum.name}
          </h3>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
              {curriculum.subject.code}
            </Badge>
            <span className="text-xs text-slate-500">{curriculum.grade.name}</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
            {progress}%
          </span>
          <div className="w-16 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
      {curriculum.description && (
        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
          {curriculum.description}
        </p>
      )}
      <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
        <span className="flex items-center gap-1">
          <Circle className="h-3 w-3" />
          {curriculum.lessons.length} lessons
        </span>
      </div>
    </button>
  )
}

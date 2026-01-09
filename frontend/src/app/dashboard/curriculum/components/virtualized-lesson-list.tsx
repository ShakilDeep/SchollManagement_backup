'use client'

import { List } from 'react-window'
import { memo } from 'react'
import { LessonCard } from './lesson-card'
import type { Lesson } from '../page'

interface VirtualizedLessonListProps {
  lessons: Lesson[]
  onEdit: (lesson: Lesson) => void
  onDelete: (lessonId: string) => void
  height: number
}

const LessonRow = memo(({ index, style, ...rest }: any) => {
  const lesson = rest.lessons[index]

  return (
    <div style={style}>
      <LessonCard
        lesson={lesson}
        onEdit={() => rest.onEdit(lesson)}
        onDelete={() => rest.onDelete(lesson.id)}
      />
    </div>
  )
})

LessonRow.displayName = 'LessonRow'

export function VirtualizedLessonList({
  lessons,
  onEdit,
  onDelete,
  height,
}: VirtualizedLessonListProps) {
  if (lessons.length === 0) return null

  return (
    <List
      height={height}
      rowCount={lessons.length}
      rowHeight={100}
      rowComponent={LessonRow}
      rowProps={{
        lessons,
        onEdit,
        onDelete,
      }}
      style={{ width: '100%' }}
      className="divide-y divide-slate-100 dark:divide-slate-800/50"
    />
  )
}

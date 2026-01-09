'use client'

import { List } from 'react-window'
import { memo } from 'react'
import { CurriculumCard } from './curriculum-card'
import type { Curriculum } from '../page'

interface VirtualizedCurriculumListProps {
  curriculums: Curriculum[]
  selectedCurriculum: Curriculum | null
  onSelect: (curriculum: Curriculum) => void
  getLessonProgress: (curriculum: Curriculum) => { completed: number; total: number; percentage: number }
  height: number
}

const CurriculumRow = memo(({ index, style, ...rest }: any) => {
  const curriculum = rest.curriculums[index]

  return (
    <div style={style}>
      <CurriculumCard
        curriculum={curriculum}
        isSelected={rest.selectedCurriculum?.id === curriculum.id}
        onClick={() => rest.onSelect(curriculum)}
        getLessonProgress={rest.getLessonProgress}
      />
    </div>
  )
})

CurriculumRow.displayName = 'CurriculumRow'

export function VirtualizedCurriculumList({
  curriculums,
  selectedCurriculum,
  onSelect,
  getLessonProgress,
  height,
}: VirtualizedCurriculumListProps) {
  if (curriculums.length === 0) return null

  return (
    <List
      height={height}
      rowCount={curriculums.length}
      rowHeight={120}
      rowComponent={CurriculumRow}
      rowProps={{
        curriculums,
        selectedCurriculum,
        onSelect,
        getLessonProgress,
      }}
      style={{ width: '100%' }}
      className="divide-y divide-slate-100 dark:divide-slate-800/50"
    />
  )
}

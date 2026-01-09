'use client'

import { useMemo, useState, useEffect } from 'react'
import { FixedSizeList as List } from 'react-window'
import { StudentCard } from './student-card'
import { type Student } from '@/types/student'

interface StudentListVirtualizedProps {
  students: Student[]
}

const ITEM_HEIGHT = 400

export function StudentListVirtualized({ students }: StudentListVirtualizedProps) {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const itemsPerRow = useMemo(() => {
    if (typeof window === 'undefined') return 3
    const width = window.innerWidth
    if (width < 768) return 1
    if (width < 1280) return 2
    return 3
  }, [])

  const Row = ({ index, style }: any) => {
    const startIndex = index * itemsPerRow
    const rowItems = students.slice(startIndex, startIndex + itemsPerRow)

    return (
      <div style={style} className="grid gap-6 md:grid-cols-2 xl:grid-cols-3 p-2">
        {rowItems.map((student) => (
          <StudentCard key={student.id} student={student} />
        ))}
      </div>
    )
  }

  const rowCount = Math.ceil(students.length / itemsPerRow)

  if (students.length === 0) {
    return (
      <div className="col-span-full py-16 text-center">
        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
          <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <p className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
          No students found
        </p>
        <p className="text-slate-600 dark:text-slate-400">
          Try adjusting your search or filters
        </p>
      </div>
    )
  }

  if (!isMounted) {
    return (
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {students.slice(0, 6).map((student) => (
          <StudentCard key={student.id} student={student} />
        ))}
      </div>
    )
  }

  return (
    <div className="w-full" style={{ height: rowCount * ITEM_HEIGHT + 20 }}>
      <List
        height={rowCount * ITEM_HEIGHT}
        itemCount={rowCount}
        itemSize={ITEM_HEIGHT}
        width="100%"
        className="outline-none"
      >
        {Row}
      </List>
    </div>
  )
}

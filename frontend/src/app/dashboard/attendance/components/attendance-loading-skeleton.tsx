'use client'

import { memo } from 'react'
import { TableCell, TableRow } from '@/components/ui/table'

export const AttendanceLoadingSkeleton = memo(() => {
  return (
    <TableRow>
      <TableCell colSpan={6} className="h-24">
        <div className="flex items-center justify-center w-full h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      </TableCell>
    </TableRow>
  )
})

AttendanceLoadingSkeleton.displayName = 'AttendanceLoadingSkeleton'

'use client'

import { memo } from 'react'

export const StudentsPageSkeleton = memo(() => {
  return (
    <div className="space-y-8 pb-8">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-10 w-48 bg-slate-200 dark:bg-slate-700 rounded-2xl animate-pulse" />
          <div className="h-6 w-64 bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-12 w-32 bg-slate-200 dark:bg-slate-700 rounded-2xl animate-pulse" />
          <div className="h-12 w-40 bg-slate-200 dark:bg-slate-700 rounded-2xl animate-pulse" />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-slate-200 dark:bg-slate-700 rounded-3xl p-6 animate-pulse h-40" />
        ))}
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 h-12 bg-slate-200 dark:bg-slate-700 rounded-2xl animate-pulse" />
        <div className="flex gap-3">
          <div className="h-12 w-[180px] bg-slate-200 dark:bg-slate-700 rounded-2xl animate-pulse" />
          <div className="h-12 w-[180px] bg-slate-200 dark:bg-slate-700 rounded-2xl animate-pulse" />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-slate-200 dark:bg-slate-700 rounded-3xl p-6 animate-pulse h-72" />
        ))}
      </div>
    </div>
  )
})

StudentsPageSkeleton.displayName = 'StudentsPageSkeleton'

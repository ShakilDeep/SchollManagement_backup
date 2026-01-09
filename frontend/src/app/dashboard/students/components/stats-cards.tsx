'use client'

import { memo } from 'react'
import { GraduationCap, Shield, UserPlus, Phone } from 'lucide-react'

interface StatsCardsProps {
  total: number
  active: number
  newThisMonth: number
  inactive: number
}

export const StatsCards = memo(({ total, active, newThisMonth, inactive }: StatsCardsProps) => {
  return (
    <>
      <div className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-3xl p-6 text-white shadow-xl shadow-blue-500/30">
        <div className="flex items-start justify-between mb-4">
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div className="bg-white/20 backdrop-blur px-3 py-1 rounded-full text-sm font-semibold">
            Total
          </div>
        </div>
        <p className="text-4xl font-bold mb-1">{total}</p>
        <p className="text-white/80">Registered students</p>
      </div>
      
      <div className="bg-gradient-to-br from-emerald-500 to-teal-500 rounded-3xl p-6 text-white shadow-xl shadow-emerald-500/30">
        <div className="flex items-start justify-between mb-4">
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
            <Shield className="w-6 h-6" />
          </div>
          <div className="bg-white/20 backdrop-blur px-3 py-1 rounded-full text-sm font-semibold">
            Active
          </div>
        </div>
        <p className="text-4xl font-bold mb-1">{active}</p>
        <p className="text-white/80">Currently enrolled</p>
      </div>

      <div className="bg-gradient-to-br from-violet-500 to-purple-500 rounded-3xl p-6 text-white shadow-xl shadow-violet-500/30">
        <div className="flex items-start justify-between mb-4">
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
            <UserPlus className="w-6 h-6" />
          </div>
          <div className="bg-white/20 backdrop-blur px-3 py-1 rounded-full text-sm font-semibold">
            New
          </div>
        </div>
        <p className="text-4xl font-bold mb-1">{newThisMonth}</p>
        <p className="text-white/80">This month</p>
      </div>

      <div className="bg-gradient-to-br from-slate-800 to-slate-900 dark:from-slate-700 dark:to-slate-800 rounded-3xl p-6 text-white shadow-xl">
        <div className="flex items-start justify-between mb-4">
          <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center">
            <Phone className="w-6 h-6" />
          </div>
          <div className="bg-white/10 backdrop-blur px-3 py-1 rounded-full text-sm font-semibold">
            Info
          </div>
        </div>
        <p className="text-4xl font-bold mb-1">{inactive}</p>
        <p className="text-white/80">Inactive accounts</p>
      </div>
    </>
  )
})

StatsCards.displayName = 'StatsCards'

'use client'

import { useState } from 'react'
import { AppSidebar } from './app-sidebar'
import { DashboardHeader } from './dashboard-header'
import { cn } from '@/lib/utils'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Sidebar */}
      <AppSidebar collapsed={sidebarCollapsed} />
      
      {/* Main Content Area */}
      <div className={cn(
        'relative z-10 overflow-x-hidden',
        'w-full lg:w-[calc(100%-18rem)] lg:ml-72',
        sidebarCollapsed && 'lg:w-[calc(100%-5rem)] lg:ml-20'
      )}>
        <DashboardHeader onMenuClick={() => setSidebarCollapsed(!sidebarCollapsed)} />
        <main className="p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}

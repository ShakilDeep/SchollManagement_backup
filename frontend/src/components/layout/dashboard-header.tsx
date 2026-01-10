'use client'

import { useState } from 'react'
import { Bell, Search, Menu, Sparkles, ChevronDown, Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface DashboardHeaderProps {
  onMenuClick?: () => void
}

export function DashboardHeader({ onMenuClick }: DashboardHeaderProps) {
  const [searchFocused, setSearchFocused] = useState(false)
  const [isDark, setIsDark] = useState(false)

  return (
    <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50 layout-stable h-16">
      <div className="flex h-16 items-center justify-between px-6 lg:px-8">
        {/* Left Section */}
        <div className="flex items-center gap-4 flex-1">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden hover:bg-slate-100 dark:hover:bg-slate-800"
            onClick={onMenuClick}
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Search Bar */}
          <div className={cn(
            'relative flex-1 max-w-xl layout-stable',
            searchFocused ? 'max-w-2xl' : 'max-w-xl'
          )}>
            <Search className={cn(
              'absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 transition-colors duration-300',
              searchFocused ? 'text-violet-500' : 'text-slate-400'
            )} />
            <Input
              id="global-search"
              name="global-search"
              type="search"
              placeholder="Search students, staff, exams..."
              autoComplete="off"
              className={cn(
                'pl-12 pr-4 h-11 rounded-2xl border-2 transition-all duration-300 bg-slate-50 dark:bg-slate-900/50',
                searchFocused 
                  ? 'border-violet-500 shadow-lg shadow-violet-500/10 ring-4 ring-violet-500/5'
                  : 'border-slate-200 dark:border-slate-700/50 hover:border-slate-300 dark:hover:border-slate-600'
              )}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
            />
            {searchFocused && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <kbd className="px-2 py-1 text-xs font-medium text-slate-500 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  ⌘K
                </kbd>
              </div>
            )}
          </div>
        </div>

        {/* Center - Semester Badge */}
        <div className="hidden md:flex items-center gap-2">
          <div className="px-4 py-2 rounded-xl bg-gradient-to-r from-violet-500/10 to-purple-500/10 border border-violet-500/20">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-violet-500" />
              <span className="font-semibold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                Spring 2025
              </span>
            </div>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-3">
          {/* Date Display */}
          <div className="hidden xl:flex items-center gap-3 px-4 py-2 rounded-xl bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900/50 dark:to-slate-800/50 border border-slate-200 dark:border-slate-800/50">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {new Date().toLocaleDateString('en-US', { weekday: 'short' })}
              </p>
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
          </div>

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="h-11 w-11 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800"
            onClick={() => setIsDark(!isDark)}
          >
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>

          {/* Notifications */}
          <Button
            variant="ghost"
            size="icon"
            className="h-11 w-11 rounded-2xl relative hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <Bell className="h-5 w-5" />
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-gradient-to-r from-violet-500 to-purple-500 text-white text-[10px] font-bold border-2 border-white dark:border-slate-900">
              3
            </Badge>
          </Button>

          {/* User Avatar */}
          <Button
            variant="ghost"
            size="icon"
            className="h-11 w-11 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 shadow-lg shadow-violet-500/30 transition-all duration-300"
          >
            <span className="font-bold text-white">JD</span>
          </Button>
        </div>
      </div>
    </header>
  )
}

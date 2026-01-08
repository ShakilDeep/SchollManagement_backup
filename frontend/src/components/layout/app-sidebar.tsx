'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  Calendar,
  FileText,
  Briefcase,
  Package,
  Library,
  Bus,
  Building2,
  MessageSquare,
  BookOpen,
  ScrollText,
  Settings,
  Shield,
  BarChart3,
  User,
  LogOut,
  GraduationCap,
  ChevronRight,
  X,
  ChevronLeft,
  ChevronRight as ChevronRightIcon
} from 'lucide-react'

interface NavItem {
  title: string
  href: string
  icon: React.ReactNode
  gradient: string
  badge?: number
}

interface NavSection {
  title: string
  items: NavItem[]
}

const navigation: NavSection[] = [
  {
    title: null,
    items: [
      { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, gradient: 'from-violet-500 to-purple-500' },
    ]
  },
  {
    title: 'CORE',
    items: [
      { title: 'Students', href: '/dashboard/students', icon: Users, gradient: 'from-blue-500 to-cyan-500' },
      { title: 'Attendance', href: '/dashboard/attendance', icon: ClipboardCheck, gradient: 'from-emerald-500 to-teal-500' },
      { title: 'Timetable', href: '/dashboard/timetable', icon: Calendar, gradient: 'from-orange-500 to-red-500' },
      { title: 'Exams', href: '/dashboard/exams', icon: FileText, gradient: 'from-pink-500 to-rose-500' },
    ]
  },
  {
    title: 'ADMIN',
    items: [
      { title: 'Staff', href: '/dashboard/staff', icon: Briefcase, gradient: 'from-indigo-500 to-blue-500' },
      { title: 'Inventory', href: '/dashboard/inventory', icon: Package, gradient: 'from-amber-500 to-orange-500' },
      { title: 'Library', href: '/dashboard/library', icon: Library, gradient: 'from-purple-500 to-pink-500' },
      { title: 'Transport', href: '/dashboard/transport', icon: Bus, gradient: 'from-cyan-500 to-blue-500' },
      { title: 'Hostel', href: '/dashboard/hostel', icon: Building2, gradient: 'from-rose-500 to-pink-500' },
    ]
  },
  {
    title: 'COMMUNICATION',
    items: [
      { title: 'Messages', href: '/dashboard/messages', icon: MessageSquare, gradient: 'from-violet-500 to-purple-500', badge: 3 },
    ]
  },
  {
    title: 'ACADEMIC',
    items: [
      { title: 'Curriculum', href: '/dashboard/curriculum', icon: ScrollText, gradient: 'from-fuchsia-500 to-pink-500' },
      { title: 'LMS', href: '/dashboard/lms', icon: BookOpen, gradient: 'from-teal-500 to-emerald-500' },
      { title: 'Behavior', href: '/dashboard/behavior', icon: GraduationCap, gradient: 'from-sky-500 to-blue-500' },
    ]
  },
  {
    title: 'SYSTEM',
    items: [
      { title: 'Analytics', href: '/dashboard/analytics', icon: BarChart3, gradient: 'from-indigo-500 to-violet-500' },
      { title: 'Settings', href: '/dashboard/settings', icon: Settings, gradient: 'from-gray-500 to-zinc-500' },
      { title: 'Security', href: '/dashboard/security', icon: Shield, gradient: 'from-red-500 to-rose-500' },
    ]
  }
]

interface AppSidebarProps {
  collapsed?: boolean
}

export function AppSidebar({ collapsed = false }: AppSidebarProps) {
  const pathname = usePathname()
  const [internalCollapsed, setInternalCollapsed] = useState(false)
  const isCollapsed = collapsed || internalCollapsed

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className={cn(
        'hidden lg:flex fixed left-0 top-0 h-screen flex-col bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border-r border-slate-800/50 transition-all duration-300 z-20',
        isCollapsed ? 'w-20' : 'w-72'
      )}>
        {/* Logo Section */}
        <div className={cn(
          'p-6 border-b border-slate-800/30',
          isCollapsed ? 'flex justify-center' : ''
        )}>
          <Link href="/dashboard" className={cn(
            'flex items-center gap-3 group',
            isCollapsed ? 'justify-center' : ''
          )}>
            <div className="relative">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/30 group-hover:scale-110 transition-transform">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-900 animate-pulse" />
            </div>
            {!isCollapsed && (
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                  EduCore
                </h1>
                <p className="text-xs text-slate-500 font-medium tracking-wider">SCHOOL OS</p>
              </div>
            )}
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6 scrollbar-thin">
          {navigation.map((section) => (
            <div key={section.title}>
              {section.title && !isCollapsed && (
                <h3 className="px-3 mb-3 text-xs font-bold text-slate-600 uppercase tracking-widest">
                  {section.title}
                </h3>
              )}
              <div className="space-y-1">
                {section.items.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        'group relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300',
                        isActive
                          ? 'bg-gradient-to-r ' + item.gradient + ' text-white shadow-lg shadow-black/20'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                      )}
                    >
                      <div className={cn(
                        'w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-300',
                        isActive
                          ? 'bg-white/20 backdrop-blur'
                          : 'bg-slate-800/50 group-hover:scale-110'
                      )}>
                        <item.icon className="w-5 h-5" />
                      </div>
                      <span className="flex-1 font-semibold">{item.title}</span>
                      {item.badge && (
                        <span className={cn(
                          'flex h-6 min-w-6 items-center justify-center rounded-full text-xs font-bold transition-all duration-300',
                          isActive
                            ? 'bg-white text-slate-900'
                            : 'bg-gradient-to-r ' + item.gradient + ' text-white'
                        )}>
                          {item.badge}
                        </span>
                      )}
                      <ChevronRight className={cn(
                        'w-4 h-4 transition-transform duration-300',
                        isActive ? 'rotate-90' : 'opacity-0 group-hover:opacity-100'
                      )} />
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User Profile */}
        <div className={cn(
          'p-4 border-t border-slate-800/30',
          isCollapsed ? 'flex justify-center' : ''
        )}>
          <div className={cn(
            'flex items-center gap-3 p-3 rounded-2xl bg-gradient-to-r from-slate-800/50 to-slate-900/50 border border-slate-700/50',
            isCollapsed ? 'flex-col' : ''
          )}>
            <div className="relative">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                JD
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-900" />
            </div>
            {!isCollapsed && (
              <>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white truncate">John Doe</p>
                  <p className="text-xs text-slate-500">Super Admin</p>
                </div>
                <div className="flex items-center gap-1">
                  <button 
              onClick={() => setInternalCollapsed(!internalCollapsed)}
              className="p-2 rounded-xl text-slate-500 hover:text-violet-400 hover:bg-violet-500/10 transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
                  <button className="p-2 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all">
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              </>
            )}
            {isCollapsed && (
            <button 
              onClick={() => setInternalCollapsed(!internalCollapsed)}
              className="p-2 rounded-xl text-slate-500 hover:text-violet-400 hover:bg-violet-500/10 transition-all"
            >
              <ChevronRightIcon className="w-5 h-5" />
            </button>
          )}
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      <div className={cn(
        'fixed inset-0 z-50 lg:hidden transition-all duration-500',
        internalCollapsed ? 'translate-x-full' : 'translate-x-0'
      )}>
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
          onClick={() => setInternalCollapsed(true)}
        />
        
        {/* Mobile Menu */}
        <div className="absolute left-0 top-0 bottom-0 w-80 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border-r border-slate-800/50 overflow-y-auto">
          {/* Mobile Header */}
          <div className="sticky top-0 p-4 border-b border-slate-800/30 bg-slate-950/95 backdrop-blur-xl z-10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">EduCore</h1>
                <p className="text-xs text-slate-500 font-medium tracking-wider">SCHOOL OS</p>
              </div>
            </div>
            <button 
              onClick={() => setInternalCollapsed(true)}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Mobile Navigation */}
          <nav className="py-4 px-3 space-y-6">
            {navigation.map((section) => (
              <div key={section.title}>
                {section.title && (
                  <h3 className="px-3 mb-3 text-xs font-bold text-slate-600 uppercase tracking-widest">
                    {section.title}
                  </h3>
                )}
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const isActive = pathname === item.href
                    return (
                      <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        'group relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300',
                        isCollapsed ? 'justify-center' : '',
                        isActive
                          ? 'bg-gradient-to-r ' + item.gradient + ' text-white shadow-lg shadow-black/20'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                      )}
                    >
                      <div className={cn(
                        'w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-300',
                        isActive
                          ? 'bg-white/20 backdrop-blur'
                          : 'bg-slate-800/50 group-hover:scale-110'
                      )}>
                        <item.icon className="w-5 h-5" />
                      </div>
                      {!isCollapsed && (
                        <>
                          <span className="flex-1 font-semibold">{item.title}</span>
                          {item.badge && (
                            <span className={cn(
                              'flex h-6 min-w-6 items-center justify-center rounded-full text-xs font-bold transition-all duration-300',
                              isActive
                                ? 'bg-white text-slate-900'
                                : 'bg-gradient-to-r ' + item.gradient + ' text-white'
                            )}>
                              {item.badge}
                            </span>
                          )}
                        </>
                      )}
                    </Link>
                    )
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* Mobile User Profile */}
          <div className="sticky bottom-0 p-4 border-t border-slate-800/30 bg-slate-950/95 backdrop-blur-xl">
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-gradient-to-r from-slate-800/50 to-slate-900/50 border border-slate-700/50">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                JD
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white truncate">John Doe</p>
                <p className="text-xs text-slate-500">Super Admin</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

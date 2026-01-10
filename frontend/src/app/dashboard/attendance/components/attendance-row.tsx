'use client'

import { memo, useState, useEffect } from 'react'
import { CheckCircle, XCircle, Clock, Timer, AlertCircle, Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { TableCell, TableRow } from '@/components/ui/table'
import { AttendanceAlertsBadge, AbsencePattern } from './attendance-alerts-badge'

interface StudentAttendance {
  id: string
  rollNumber: string
  name: string
  grade: string
  section: string
  status: 'Present' | 'Absent' | 'Late' | 'HalfDay' | 'Unmarked'
  checkIn?: string
  checkOut?: string
  avatar?: string
}

interface AttendanceRowProps {
  student: StudentAttendance
  onStatusChange: (studentId: string, newStatus: StudentAttendance['status']) => void
  getStatusConfig: (status: string) => {
    icon: any
    color: string
    bgClass: string
    textClass: string
    lightBgClass: string
    darkTextClass: string
  }
}

export const AttendanceRow = memo(({ student, onStatusChange, getStatusConfig }: AttendanceRowProps) => {
  const statusConfig = getStatusConfig(student.status)
  const StatusIcon = statusConfig.icon
  const [pattern, setPattern] = useState<AbsencePattern | undefined>()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchPattern = async () => {
      setLoading(true)
      try {
        const response = await fetch(`/api/ai/attendance-alerts?studentId=${student.id}&days=30`)
        if (response.ok) {
          const data = await response.json()
          setPattern(data)
        }
      } catch (error) {
      } finally {
        setLoading(false)
      }
    }

    fetchPattern()
  }, [student.id])

  return (
    <TableRow 
      className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors duration-200"
    >
      <TableCell>
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-lg",
            statusConfig.bgClass
          )}>
            {student.avatar || student.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div>
            <div className="font-semibold text-slate-900 dark:text-slate-100">
              {student.name}
            </div>
            <div className="text-sm text-slate-500">
              {student.rollNumber}
            </div>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div className="font-medium text-slate-900 dark:text-slate-100">
          {student.grade} - {student.section}
        </div>
      </TableCell>
      <TableCell>
        <Select
          value={student.status}
          onValueChange={(value) => onStatusChange(student.id, value as StudentAttendance['status'])}
        >
          <SelectTrigger className={cn(
            "w-32 font-medium cursor-pointer pointer-events-auto",
            statusConfig.lightBgClass,
            statusConfig.textClass,
            statusConfig.darkTextClass
          )}>
            <div className="flex items-center gap-2">
              <StatusIcon className="h-4 w-4" />
              <SelectValue />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Present">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-500" />
                Present
              </div>
            </SelectItem>
            <SelectItem value="Absent">
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-rose-500" />
                Absent
              </div>
            </SelectItem>
            <SelectItem value="Late">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-500" />
                Late
              </div>
            </SelectItem>
            <SelectItem value="HalfDay">
              <div className="flex items-center gap-2">
                <Timer className="h-4 w-4 text-purple-500" />
                Half Day
              </div>
            </SelectItem>
            <SelectItem value="Unmarked">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-slate-500" />
                Unmarked
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell>
        <div className="text-sm text-slate-600 dark:text-slate-400">
          {student.checkIn || '-'}
        </div>
      </TableCell>
      <TableCell>
        <div className="text-sm text-slate-600 dark:text-slate-400">
          {student.checkOut || '-'}
        </div>
      </TableCell>
      <TableCell>
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
        ) : pattern && pattern.totalAbsences > 0 ? (
          <Badge variant={pattern.riskLevel === 'high' ? 'destructive' : 'secondary'}>
            <AlertCircle className="h-3 w-3 mr-1" />
            {pattern.totalAbsences} absence{pattern.totalAbsences > 1 ? 's' : ''}
          </Badge>
        ) : null}
      </TableCell>
    </TableRow>
  )
})

AttendanceRow.displayName = 'AttendanceRow'

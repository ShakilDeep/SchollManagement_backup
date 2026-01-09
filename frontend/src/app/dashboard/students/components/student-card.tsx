'use client'

import { memo, useState, useEffect } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Phone, Mail, Calendar, MapPin, Eye, Edit } from 'lucide-react'
import { type Student } from '@/types/student'
import { AIPredictionBadge, type StudentPrediction } from './ai-prediction-badge'

interface StudentCardProps {
  student: Student
}

export const StudentCard = memo(({ student }: StudentCardProps) => {
  const [prediction, setPrediction] = useState<StudentPrediction | undefined>()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchPrediction = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/ai/student-prediction?studentId=${student.id}`)
        if (res.ok) {
          const data = await res.json()
          setPrediction(data)
        }
      } catch (error) {
        console.error('Failed to fetch prediction:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPrediction()
  }, [student.id])

  return (
    <div className="group relative overflow-hidden bg-white dark:bg-slate-900/50 rounded-3xl p-6 shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 border-2 border-transparent hover:border-violet-500">
      <div className="absolute top-4 right-4">
        <Badge 
          className={cn(
            'px-4 py-1.5 rounded-full text-sm font-semibold',
            student.status === 'Active'
              ? 'bg-emerald-500 text-white'
              : 'bg-slate-500 text-white'
          )}
        >
          {student.status}
        </Badge>
      </div>

      <div className="mb-4">
        <div className={cn(
          'w-16 h-16 rounded-2xl flex items-center justify-center text-white text-xl font-bold',
          'bg-gradient-to-br from-violet-500 to-purple-600',
          'shadow-lg shadow-violet-500/30'
        )}>
          {student.avatar}
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">
            {student.rollNumber}
          </p>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">
            {student.name}
          </h3>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
          <MapPin className="w-4 h-4" />
          <span>{student.grade} - {student.section}</span>
        </div>

        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
          <Phone className="w-4 h-4" />
          <span>{student.phone}</span>
        </div>

        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
          <Mail className="w-4 h-4" />
          <span>Guardian: {student.guardian}</span>
        </div>

        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
          <Calendar className="w-4 h-4" />
          <span>Joined: {student.admissionDate}</span>
        </div>

        <AIPredictionBadge prediction={prediction} loading={loading} />
      </div>

      <div className="flex gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
        <Link href={`/dashboard/students/${student.id}`} className="flex-1">
          <Button 
            variant="outline" 
            className="w-full rounded-xl h-11"
          >
            <Eye className="mr-2 w-4 h-4" />
            View
          </Button>
        </Link>
        <Link href={`/dashboard/students/${student.id}?action=edit`} className="flex-1">
          <Button 
            className="w-full bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 rounded-xl h-11"
          >
            <Edit className="mr-2 w-4 h-4" />
            Edit
          </Button>
        </Link>
      </div>
    </div>
  )
})

StudentCard.displayName = 'StudentCard'

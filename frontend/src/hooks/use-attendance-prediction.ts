import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'
import { AttendancePrediction, WeeklyAttendancePrediction } from '@/lib/ai/services/attendance-prediction-service'

export function useAttendancePrediction(studentId: string, date?: Date) {
  const queryClient = useQueryClient()
  const dateKey = useMemo(() => {
    if (!date) return undefined
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  }, [date])
  
  return useQuery<AttendancePrediction>({
    queryKey: ['attendance-prediction', studentId, dateKey],
    queryFn: async () => {
      const params = new URLSearchParams({
        studentId,
        date: date ? date.toISOString() : new Date().toISOString()
      })
      
      const response = await fetch(`/api/attendance/prediction?${params}`)
      if (!response.ok) throw new Error('Failed to fetch prediction')
      return response.json()
    },
    enabled: !!studentId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false
  })
}

export function useBatchAttendancePrediction(gradeId?: string, sectionId?: string, date?: Date) {
  return useQuery<{
    predictions: AttendancePrediction[]
    summary: {
      total: number
      highConfidence: number
      predictedPresent: number
      predictedAbsent: number
      averageConfidence: number
    }
  }>({
    queryKey: ['batch-attendance-prediction', gradeId, sectionId, date?.toISOString()],
    queryFn: async () => {
      const params = new URLSearchParams({
        type: 'batch',
        date: date ? date.toISOString() : new Date().toISOString()
      })
      
      if (gradeId) params.append('gradeId', gradeId)
      if (sectionId) params.append('sectionId', sectionId)
      
      const response = await fetch(`/api/attendance/prediction?${params}`)
      if (!response.ok) throw new Error('Failed to fetch batch predictions')
      return response.json()
    },
    enabled: !!gradeId || !!sectionId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false
  })
}

export function useWeeklyAttendancePrediction(studentId: string, startDate?: Date) {
  return useQuery<WeeklyAttendancePrediction>({
    queryKey: ['weekly-attendance-prediction', studentId, startDate?.toISOString()],
    queryFn: async () => {
      const params = new URLSearchParams({
        type: 'weekly',
        studentId,
        startDate: startDate ? startDate.toISOString() : new Date().toISOString()
      })
      
      const response = await fetch(`/api/attendance/prediction?${params}`)
      if (!response.ok) throw new Error('Failed to fetch weekly prediction')
      return response.json()
    },
    enabled: !!studentId,
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false
  })
}

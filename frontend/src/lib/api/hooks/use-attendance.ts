import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchAPI } from '../client'
import type { StudentAttendance, AttendanceTrend } from '@/app/dashboard/attendance/page'

export interface AttendanceFilters {
  date: string
  gradeId?: string
  sectionId?: string
  search?: string
}

export function useAttendance(filters: AttendanceFilters) {
  return useQuery({
    queryKey: ['attendance', filters],
    queryFn: () => fetchAPI<StudentAttendance[]>('/attendance', { query: filters }),
    enabled: !!filters.date,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false
  })
}

export function useAttendanceStats(date: string) {
  return useQuery({
    queryKey: ['attendance-stats', date],
    queryFn: () => fetchAPI<{ trends: AttendanceTrend[] }>(`/attendance/stats?date=${date}`),
    enabled: !!date,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false
  })
}

export function useGrades() {
  return useQuery({
    queryKey: ['grades'],
    queryFn: () => fetchAPI<Array<{ id: string; name: string }>>('/grades'),
    staleTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false
  })
}

export function useSections(gradeId?: string) {
  return useQuery({
    queryKey: ['sections', gradeId],
    queryFn: async () => {
      const data = await fetchAPI<{
        grades: Array<{ id: string; name: string; sections: Array<{ id: string; name: string }> }>
      }>('/sections')
      
      if (!data?.grades || !Array.isArray(data.grades)) {
        return []
      }
      
      if (!gradeId || gradeId === 'all') {
        return data.grades.flatMap(grade => grade.sections || [])
      }
      
      const selectedGrade = data.grades.find(g => g.id === gradeId)
      return selectedGrade?.sections || []
    },
    staleTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false
  })
}

export interface SaveAttendanceParams {
  date: string
  attendanceData: Array<{ id: string; status: string }>
}

export function useSaveAttendance() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (params: SaveAttendanceParams) =>
      fetchAPI('/attendance', {
        method: 'POST',
        body: params
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] })
      queryClient.invalidateQueries({ queryKey: ['attendance-stats', variables.date] })
    }
  })
}

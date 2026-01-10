'use client'

import { useQuery, useMutation, useQueryClient, type UseQueryOptions } from '@tanstack/react-query'
import {
  getAttendance,
  saveAttendance,
  type AttendanceRecord,
  type SaveAttendanceInput,
} from '@/lib/api/attendance'
import { toast } from 'sonner'

export function useAttendance(
  date: string,
  options?: {
    gradeId?: string
    sectionId?: string
    search?: string
  },
  queryOptions?: Omit<UseQueryOptions<AttendanceRecord[]>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: ['attendance', date, options?.gradeId, options?.sectionId, options?.search],
    queryFn: () => getAttendance(date, options),
    enabled: !!date,
    ...queryOptions,
  })
}

export function useSaveAttendance() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: SaveAttendanceInput) => saveAttendance(data),
    onSuccess: (_, { date }) => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] })
      toast.success('Attendance saved successfully')
    },
    onError: (error: Error) => {
      toast.error(`Failed to save attendance: ${error.message}`)
    },
  })
}

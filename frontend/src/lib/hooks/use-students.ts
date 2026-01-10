'use client'

import { useQuery, useMutation, useQueryClient, type UseQueryOptions } from '@tanstack/react-query'
import {
  getStudents,
  getStudent,
  createStudent,
  updateStudent,
  deleteStudent,
  type Student,
  type CreateStudentInput,
  type UpdateStudentInput,
} from '@/lib/api/students'
import { toast } from 'sonner'

export function useStudents(rollNumber?: string, options?: Omit<UseQueryOptions<Student[]>, 'queryKey' | 'queryFn'>) {
  return useQuery({
    queryKey: ['students', rollNumber],
    queryFn: () => getStudents(rollNumber),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    ...options,
  })
}

export function useStudent(id: string, options?: Omit<UseQueryOptions<Student>, 'queryKey' | 'queryFn'>) {
  return useQuery({
    queryKey: ['student', id],
    queryFn: () => getStudent(id),
    enabled: !!id,
    ...options,
  })
}

export function useCreateStudent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateStudentInput) => createStudent(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] })
      toast.success('Student created successfully')
    },
    onError: (error: Error) => {
      toast.error(`Failed to create student: ${error.message}`)
    },
  })
}

export function useUpdateStudent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateStudentInput }) =>
      updateStudent(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['students'] })
      queryClient.invalidateQueries({ queryKey: ['student', id] })
      toast.success('Student updated successfully')
    },
    onError: (error: Error) => {
      toast.error(`Failed to update student: ${error.message}`)
    },
  })
}

export function useDeleteStudent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteStudent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] })
      toast.success('Student deleted successfully')
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete student: ${error.message}`)
    },
  })
}

import { useQuery, useMutation, useQueryClient, type UseQueryOptions, type UseMutationOptions } from '@tanstack/react-query'
import { fetchAPI } from '../client'

interface QueryParams {
  search?: string
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  [key: string]: string | number | undefined
}

interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

interface ApiListResponse<T> {
  success: boolean
  data: T[] | PaginatedResponse<T>
}

interface ApiSingleResponse<T> {
  success: boolean
  data: T
}

export interface ResourceHooks<T, CreateData = Partial<T>, UpdateData = Partial<T>> {
  useList: (params?: QueryParams, options?: Omit<UseQueryOptions<ApiListResponse<T>>, 'queryKey' | 'queryFn'>) => ReturnType<typeof useQuery<ApiListResponse<T>>>
  useGetById: (id: string, options?: Omit<UseQueryOptions<ApiSingleResponse<T>>, 'queryKey' | 'queryFn'>) => ReturnType<typeof useQuery<ApiSingleResponse<T>>>
  useCreate: (options?: UseMutationOptions<ApiSingleResponse<T>, Error, CreateData>) => ReturnType<typeof useMutation<ApiSingleResponse<T>, Error, CreateData>>
  useUpdate: (options?: UseMutationOptions<ApiSingleResponse<T>, Error, { id: string; data: UpdateData }>) => ReturnType<typeof useMutation<ApiSingleResponse<T>, Error, { id: string; data: UpdateData }>>
  useDelete: (options?: UseMutationOptions<void, Error, string>) => ReturnType<typeof useMutation<void, Error, string>>
}

export function createResourceHooks<T = unknown, CreateData = Partial<T>, UpdateData = Partial<T>>(
  resourceName: string,
  pluralName?: string
): ResourceHooks<T, CreateData, UpdateData> {
  const baseKey = pluralName || `${resourceName}s`

  const useList = (
    params?: QueryParams,
    options?: Omit<UseQueryOptions<ApiListResponse<T>>, 'queryKey' | 'queryFn'>
  ) => {
    const queryParams = new URLSearchParams()
    if (params?.search) queryParams.set('search', params.search)
    if (params?.page) queryParams.set('page', String(params.page))
    if (params?.pageSize) queryParams.set('pageSize', String(params.pageSize))
    if (params?.sortBy) queryParams.set('sortBy', params.sortBy)
    if (params?.sortOrder) queryParams.set('sortOrder', params.sortOrder)

    Object.entries(params || {}).forEach(([key, value]) => {
      if (!['search', 'page', 'pageSize', 'sortBy', 'sortOrder'].includes(key) && value !== undefined) {
        queryParams.set(key, String(value))
      }
    })

    return useQuery({
      queryKey: [baseKey, params],
      queryFn: () => fetchAPI<ApiListResponse<T>>(`/api/${resourceName}?${queryParams.toString()}`),
      staleTime: 5 * 60 * 1000,
      ...options,
    })
  }

  const useGetById = (
    id: string,
    options?: Omit<UseQueryOptions<ApiSingleResponse<T>>, 'queryKey' | 'queryFn'>
  ) => {
    return useQuery({
      queryKey: [baseKey, id],
      queryFn: () => fetchAPI<ApiSingleResponse<T>>(`/api/${resourceName}/${id}`),
      enabled: !!id,
      staleTime: 5 * 60 * 1000,
      ...options,
    })
  }

  const useCreate = (
    options?: UseMutationOptions<ApiSingleResponse<T>, Error, CreateData>
  ) => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: (data: CreateData) =>
        fetchAPI<ApiSingleResponse<T>>(`/api/${resourceName}`, {
          method: 'POST',
          body: data as Record<string, unknown>,
        }),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [baseKey] })
      },
      ...options,
    })
  }

  const useUpdate = (
    options?: UseMutationOptions<ApiSingleResponse<T>, Error, { id: string; data: UpdateData }>
  ) => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: ({ id, data }) =>
        fetchAPI<ApiSingleResponse<T>>(`/api/${resourceName}/${id}`, {
          method: 'PATCH',
          body: data as Record<string, unknown>,
        }),
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: [baseKey] })
        queryClient.invalidateQueries({ queryKey: [baseKey, variables.id] })
      },
      ...options,
    })
  }

  const useDelete = (
    options?: UseMutationOptions<void, Error, string>
  ) => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: (id: string) =>
        fetchAPI<void>(`/api/${resourceName}/${id}`, {
          method: 'DELETE',
        }),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [baseKey] })
      },
      ...options,
    })
  }

  return {
    useList,
    useGetById,
    useCreate,
    useUpdate,
    useDelete,
  }
}

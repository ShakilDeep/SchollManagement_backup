import type { ApiError, ApiResponse, ApiRequestOptions } from './types'
import { transformResponse } from './transform'

const BASE_URL = typeof window === 'undefined' 
  ? `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'}/api`
  : ''

class ApiErrorClass extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: Record<string, unknown>
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export async function fetchAPI<T>(
  endpoint: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const { method = 'GET', body, query, headers = {}, cookies, ...rest } = options

  const isBrowser = typeof window !== 'undefined'
  const apiUrl = isBrowser ? '/api' : BASE_URL

  const url = new URL(`${apiUrl}${endpoint}`, isBrowser ? window.location.origin : BASE_URL.replace('/api', ''))

  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.append(key, String(value))
      }
    })
  }

  const requestHeaders: HeadersInit = {
    'Content-Type': 'application/json',
    ...headers,
  }

  // Add cookies to headers for server-side requests to backend
  if (cookies && !isBrowser) {
    requestHeaders['Cookie'] = cookies
  }

  const response = await fetch(url.toString(), {
    method,
    headers: requestHeaders,
    body: body ? JSON.stringify(body) : undefined,
    credentials: isBrowser ? 'include' : undefined,
    ...rest,
  })

  if (!response.ok) {
    let errorMessage = `API Error: ${response.statusText}`
    let errorDetails: Record<string, unknown> = {}

    try {
      const errorData = await response.json()
      errorMessage = errorData.detail || errorData.message || errorMessage
      errorDetails = errorData.details || {}
    } catch {
      throw new ApiErrorClass(errorMessage, String(response.status), errorDetails)
    }

    throw new ApiErrorClass(errorMessage, String(response.status), errorDetails)
  }

  const data = await response.json()
  return transformResponse<T>(data)
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiErrorClass
}

export { ApiErrorClass as ApiError }

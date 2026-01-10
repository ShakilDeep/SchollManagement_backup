import type { ApiError, ApiResponse, ApiRequestOptions } from './types'

const BASE_URL = '/api'

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
  const { method = 'GET', body, query, headers = {}, ...rest } = options

  const url = new URL(`${BASE_URL}${endpoint}`, window.location.origin)

  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.append(key, String(value))
      }
    })
  }

  const response = await fetch(url.toString(), {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
    ...rest,
  })

  if (!response.ok) {
    let errorMessage = `API Error: ${response.statusText}`
    let errorDetails: Record<string, unknown> = {}

    try {
      const errorData = await response.json()
      errorMessage = errorData.message || errorMessage
      errorDetails = errorData.details || {}
    } catch {
      throw new ApiErrorClass(errorMessage, String(response.status), errorDetails)
    }

    throw new ApiErrorClass(errorMessage, String(response.status), errorDetails)
  }

  return response.json()
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiErrorClass
}

export { ApiErrorClass as ApiError }

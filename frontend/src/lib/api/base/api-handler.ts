import { NextResponse } from 'next/server'
import { ZodError } from 'zod'

export type SuccessResponse<T> = {
  success: true
  data: T
}

export type ErrorResponse = {
  success: false
  error: {
    message: string
    code?: string
    details?: Record<string, unknown>
  }
}

export type ApiResponse<T> = SuccessResponse<T> | ErrorResponse

export function success<T>(data: T, status: number = 200): NextResponse {
  const response: SuccessResponse<T> = { success: true, data }
  return NextResponse.json(response, { status })
}

export function error(
  message: string,
  status: number = 500,
  code?: string,
  details?: Record<string, unknown>
): NextResponse {
  const response: ErrorResponse = {
    success: false,
    error: { message, code, details },
  }
  return NextResponse.json(response, { status })
}

export function notFound(resource: string = 'Resource'): NextResponse {
  return error(`${resource} not found`, 404, 'NOT_FOUND')
}

export function badRequest(message: string, details?: Record<string, unknown>): NextResponse {
  return error(message, 400, 'BAD_REQUEST', details)
}

export function unauthorized(message: string = 'Unauthorized'): NextResponse {
  return error(message, 401, 'UNAUTHORIZED')
}

export function forbidden(message: string = 'Forbidden'): NextResponse {
  return error(message, 403, 'FORBIDDEN')
}

export function internalError(
  err: unknown,
  context?: string
): NextResponse {
  console.error(`[INTERNAL_ERROR]${context ? ` ${context}` : ''}`, err)

  if (err instanceof ZodError) {
    return badRequest('Validation failed', {
      issues: err.issues,
    })
  }

  const message = err instanceof Error ? err.message : 'Internal server error'
  return error(message, 500, 'INTERNAL_ERROR')
}

export function created<T>(data: T): NextResponse {
  return success(data, 201)
}

export function noContent(): NextResponse {
  return new NextResponse(null, { status: 204 })
}

export async function handleApiError<T>(
  fn: () => Promise<NextResponse<T>>,
  context?: string
): Promise<NextResponse> {
  try {
    return await fn()
  } catch (err) {
    return internalError(err, context)
  }
}

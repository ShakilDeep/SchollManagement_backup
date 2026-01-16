import { z } from "zod"
import { NextRequest, NextResponse } from "next/server"
import { createAuditLog, AuditAction, AuditEntity } from "@/lib/security/audit"

export interface ValidationMiddlewareOptions {
  allowPartial?: boolean
  stripUnknown?: boolean
  onValidationError?: (error: z.ZodError) => void
}

export function validateRequest<T>(schema: z.ZodSchema<T>, options: ValidationMiddlewareOptions = {}) {
  return async (req: NextRequest): Promise<T | NextResponse> => {
    try {
      const body = await req.json()

      let validatedData: T

      if (options.allowPartial) {
        const partialSchema = schema.partial()
        validatedData = partialSchema.parse(body) as T
      } else {
        validatedData = schema.parse(body)
      }

      return validatedData
    } catch (error) {
      if (error instanceof z.ZodError) {
        const sanitizedError = sanitizeZodError(error)

        options.onValidationError?.(error)

        return NextResponse.json(
          {
            error: "Validation failed",
            details: sanitizedError,
            timestamp: new Date().toISOString()
          },
          { status: 400 }
        )
      }
      throw error
    }
  }
}

export function validateQuery<T>(schema: z.ZodSchema<T>, options: ValidationMiddlewareOptions = {}) {
  return async (req: NextRequest): Promise<T | NextResponse> => {
    try {
      const url = new URL(req.url)
      const query = Object.fromEntries(url.searchParams)

      let validatedData: T

      if (options.allowPartial) {
        const partialSchema = schema.partial()
        validatedData = partialSchema.parse(query) as T
      } else {
        validatedData = schema.parse(query)
      }

      return validatedData
    } catch (error) {
      if (error instanceof z.ZodError) {
        const sanitizedError = sanitizeZodError(error)

        return NextResponse.json(
          {
            error: "Query validation failed",
            details: sanitizedError,
            timestamp: new Date().toISOString()
          },
          { status: 400 }
        )
      }
      throw error
    }
  }
}

function sanitizeZodError(error: z.ZodError) {
  return error.errors.map(err => ({
    path: err.path.join("."),
    message: err.message,
    code: err.code
  }))
}

export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+=/gi, "")
    .replace(/data:/gi, "")
    .replace(/vbscript:/gi, "")
    .replace(/&#/g, "&amp;#")
}

export function sanitizeObject<T extends Record<string, any>>(obj: T, keysToSanitize: (keyof T)[]): T {
  const result = { ...obj }

  for (const key of keysToSanitize) {
    if (result[key] && typeof result[key] === "string") {
      result[key] = sanitizeInput(result[key] as string) as any
    }
  }

  return result
}

export function withValidation<T>(
  schema: z.ZodSchema<T>,
  handler: (req: NextRequest, data: T) => Promise<NextResponse>,
  options?: ValidationMiddlewareOptions & {
    audit?: {
      action: AuditAction
      entity: AuditEntity
    }
  }
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const validationResult = await validateRequest(schema, options)(req)

    if (validationResult instanceof NextResponse) {
      return validationResult
    }

    if (options?.audit) {
      try {
        const session = await (await import("next-auth")).getServerSession(
          (await import("@/lib/auth/config")).authOptions
        )

        await createAuditLog({
          userId: session?.user?.id,
          action: options.audit.action,
          entity: options.audit.entity,
          request: req,
          details: { validatedData: validationResult }
        })
      } catch (auditError) {
        console.error("Audit logging failed:", auditError)
      }
    }

    return handler(req, validationResult)
  }
}

export const commonSchemas = {
  email: z.string().email("Invalid email address").max(255),
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  phone: z.string().regex(/^[+]?[\d\s-()]+$/, "Invalid phone number").max(20),
  date: z.string().or(z.date()),
  url: z.string().url("Invalid URL"),
  uuid: z.string().uuid("Invalid UUID"),
  id: z.string().min(1, "ID is required"),

  pagination: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20)
  }),

  search: z.object({
    query: z.string().optional(),
    filters: z.record(z.string()).optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(["asc", "desc"]).default("desc")
  }),

  dateRange: z.object({
    startDate: z.string().or(z.date()).optional(),
    endDate: z.string().or(z.date()).optional()
  })
}

export function createSanitizedResponse<T>(data: T, status: number = 200): NextResponse {
  return NextResponse.json(data, { status })
}

export function createErrorResponse(message: string, status: number = 500, details?: any): NextResponse {
  return NextResponse.json(
    {
      error: message,
      details,
      timestamp: new Date().toISOString()
    },
    { status }
  )
}

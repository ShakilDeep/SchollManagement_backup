import { z } from "zod"
import { NextResponse } from "next/server"

const sanitizePatterns = [
  { pattern: /<script\b[^>]*>([\s\S]*?)<\/script>/gi, replacement: "" },
  { pattern: /<iframe\b[^>]*>([\s\S]*?)<\/iframe>/gi, replacement: "" },
  { pattern: /javascript:/gi, replacement: "" },
  { pattern: /on\w+\s*=/gi, replacement: "" },
  { pattern: /<\?php/gi, replacement: "" },
  { pattern: /<\!--[\s\S]*?-->/g, replacement: "" },
  { pattern: /<img[^>]+>/gi, replacement: "" },
  { pattern: /<object\b[^>]*>([\s\S]*?)<\/object>/gi, replacement: "" },
  { pattern: /<embed\b[^>]*>/gi, replacement: "" }
]

export function sanitizeInput(input: string): string {
  let sanitized = input

  for (const { pattern, replacement } of sanitizePatterns) {
    sanitized = sanitized.replace(pattern, replacement)
  }

  sanitized = sanitized.trim()

  return sanitized
}

export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const sanitized: any = {}

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string") {
      sanitized[key] = sanitizeInput(value)
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item =>
        typeof item === "string" ? sanitizeInput(item) : item
      )
    } else if (typeof value === "object" && value !== null) {
      sanitized[key] = sanitizeObject(value)
    } else {
      sanitized[key] = value
    }
  }

  return sanitized
}

export function validateRequest<T>(schema: z.ZodSchema<T>) {
  return async (req: Request): Promise<{ data?: T; error?: NextResponse }> => {
    try {
      const body = await req.json()
      const sanitizedBody = sanitizeObject(body)
      const validatedData = schema.parse(sanitizedBody)
      return { data: validatedData }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          error: NextResponse.json(
            {
              error: "Validation failed",
              details: error.errors.map(e => ({
                path: e.path.join("."),
                message: e.message,
                code: e.code
              }))
            },
            { status: 400 }
          )
        }
      }
      return {
        error: NextResponse.json(
          { error: "Invalid request format" },
          { status: 400 }
        )
      }
    }
  }
}

export function validateSearchParams(schema: z.ZodSchema<any>) {
  return (url: URL): { data?: any; error?: NextResponse } => {
    try {
      const params: Record<string, string> = {}
      url.searchParams.forEach((value, key) => {
        params[key] = value
      })

      const sanitizedParams = sanitizeObject(params)
      const validatedData = schema.parse(sanitizedParams)
      return { data: validatedData }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          error: NextResponse.json(
            {
              error: "Invalid query parameters",
              details: error.errors
            },
            { status: 400 }
          )
        }
      }
      return {
        error: NextResponse.json(
          { error: "Invalid query parameters" },
          { status: 400 }
        )
      }
    }
  }
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function validatePassword(password: string): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (password.length < 12) {
    errors.push("Password must be at least 12 characters long")
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter")
  }

  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter")
  }

  if (!/[0-9]/.test(password)) {
    errors.push("Password must contain at least one number")
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push("Password must contain at least one special character")
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

export function validatePhone(phone: string): boolean {
  const phoneRegex = /^\+?[\d\s-()]{10,}$/
  return phoneRegex.test(phone)
}

export function validateUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

export function preventSQLInjection(input: string): string {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|EXEC|EXECUTE|CREATE|TRUNCATE)\b)/gi,
    /(--)|(\/\*)|(\*\/)|(;)/g,
    /(\bOR\b.*?=\s*['"]?.*?['"]?)|(\bAND\b.*?=\s*['"]?.*?['"]?)/gi
  ]

  let sanitized = input

  for (const pattern of sqlPatterns) {
    sanitized = sanitized.replace(pattern, "")
  }

  return sanitized
}

export function validateFileUpload(file: File, maxSize: number = 5 * 1024 * 1024): {
  isValid: boolean
  error?: string
} {
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  ]

  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: "File type not allowed"
    }
  }

  if (file.size > maxSize) {
    return {
      isValid: false,
      error: `File size exceeds ${maxSize / (1024 * 1024)}MB limit`
    }
  }

  return { isValid: true }
}

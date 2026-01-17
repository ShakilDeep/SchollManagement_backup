import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { securityHeaders } from "@/lib/security/headers"
import { rateLimit } from "@/lib/security/rate-limit"

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()

  if (request.nextUrl.pathname.startsWith("/api")) {
    const bypassRateLimit = request.nextUrl.pathname.startsWith("/api/library")
    const rateLimitResult = bypassRateLimit ? { success: true, limit: 1000, remaining: 1000 } : await rateLimit(request)

    if (!rateLimitResult.success) {
      return new NextResponse(
        JSON.stringify({ error: "Too many requests", retryAfter: rateLimitResult.retryAfter }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": rateLimitResult.retryAfter?.toString() || "60",
            "X-RateLimit-Limit": rateLimitResult.limit.toString(),
            "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
            "X-RateLimit-Reset": new Date(Date.now() + 60000).toISOString()
          }
        }
      )
    }

    response.headers.set("X-RateLimit-Limit", rateLimitResult.limit.toString())
    response.headers.set("X-RateLimit-Remaining", rateLimitResult.remaining.toString())
  }

  return securityHeaders(response)
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|public/).*)"
  ]
}

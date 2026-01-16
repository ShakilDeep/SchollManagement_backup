# School Management System - Security & Efficiency Improvements

## Executive Summary

This document outlines comprehensive improvements to transform the School Management System into a highly efficient, military-grade secure application. Recommendations are categorized by priority and implementation complexity.

---

## SECURITY IMPROVEMENTS (MILITARY GRADE)

### 1. Authentication & Authorization

#### 1.1 Implement NextAuth.js with Enhanced Security
- **Priority**: Critical
- **Status**: Referenced in README but not implemented
- **Implementation**:

```typescript
// src/lib/auth/config.ts
import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // Implement strong password validation
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials")
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          select: { id: true, email: true, password: true, role: true }
        })

        if (!user || !user.password) {
          throw new Error("Invalid credentials")
        }

        const isValid = await bcrypt.compare(
          credentials.password,
          user.password
        )

        if (!isValid) {
          throw new Error("Invalid credentials")
        }

        return { id: user.id, email: user.email, role: user.role }
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 15 * 60, // 15 minutes for high security
    updateAge: 5 * 60
  },
  jwt: {
    maxAge: 15 * 60,
    secret: process.env.NEXTAUTH_SECRET
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error"
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
      }
      return session
    }
  }
}
```

#### 1.2 Implement Role-Based Access Control (RBAC)
```typescript
// src/lib/auth/rbac.ts
import { UserRole } from "@prisma/client"

export const PERMISSIONS = {
  // Admin permissions
  ADMIN: [
    "users:read",
    "users:create",
    "users:update",
    "users:delete",
    "system:configure"
  ],
  // Teacher permissions
  TEACHER: [
    "students:read",
    "students:update",
    "grades:create",
    "grades:update",
    "attendance:create",
    "attendance:update"
  ],
  // Parent permissions
  PARENT: [
    "students:read:own",
    "grades:read:own",
    "attendance:read:own"
  ],
  // Student permissions
  STUDENT: [
    "grades:read:own",
    "attendance:read:own"
  ]
}

export function hasPermission(
  userRole: UserRole,
  requiredPermission: string
): boolean {
  return PERMISSIONS[userRole]?.includes(requiredPermission) || false
}

export function requirePermission(requiredPermission: string) {
  return async (req: Request) => {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      throw new Error("Unauthorized")
    }
    
    if (!hasPermission(session.user.role, requiredPermission)) {
      throw new Error("Forbidden")
    }
    
    return session
  }
}
```

### 2. Input Validation & Sanitization

#### 2.1 Implement Request Validation Middleware
```typescript
// src/lib/api/validation-middleware.ts
import { z } from "zod"
import { NextRequest, NextResponse } from "next/server"

export function validateRequest<T>(schema: z.ZodSchema<T>) {
  return async (req: NextRequest) => {
    try {
      const body = await req.json()
      const validatedData = schema.parse(body)
      return validatedData
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: "Validation failed", details: error.errors },
          { status: 400 }
        )
      }
      throw error
    }
  }
}

// Sanitize input to prevent XSS
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+=/gi, "")
}
```

#### 2.2 Implement SQL Injection Prevention
- **Current Status**: Prisma ORM provides basic protection, but need additional layers
- **Improvements**:
  - Implement parameterized queries for raw SQL
  - Add query complexity limits
  - Implement query timeout protection

```typescript
// src/lib/database/query-guard.ts
const MAX_QUERY_TIME = 5000 // 5 seconds
const MAX_RESULTS = 1000

export async function executeGuardedQuery<T>(
  queryFn: () => Promise<T[]>
): Promise<T[]> {
  const timeoutPromise = new Promise<T[]>((_, reject) => {
    setTimeout(() => reject(new Error("Query timeout")), MAX_QUERY_TIME)
  })

  const result = await Promise.race([queryFn(), timeoutPromise]) as T[]

  if (result.length > MAX_RESULTS) {
    throw new Error("Query result exceeds maximum limit")
  }

  return result.slice(0, MAX_RESULTS)
}
```

### 3. Rate Limiting & DDoS Protection

#### 3.1 Implement Redis-based Rate Limiting
```typescript
// src/lib/rate-limiting/redis-limiter.ts
import { Redis } from "ioredis"

const redis = new Redis(process.env.REDIS_URL!)

interface RateLimitConfig {
  windowMs: number
  maxRequests: number
}

export async function rateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const key = `ratelimit:${identifier}`
  const now = Date.now()
  const windowStart = now - config.windowMs

  const pipeline = redis.pipeline()
  pipeline.zremrangebyscore(key, "-inf", windowStart)
  pipeline.zcard(key)
  pipeline.zadd(key, now, `${now}-${Math.random()}`)
  pipeline.expire(key, Math.ceil(config.windowMs / 1000))
  
  const results = await pipeline.exec()
  const count = results?.[1]?.[1] as number
  const remaining = Math.max(0, config.maxRequests - count - 1)
  const resetAt = now + config.windowMs

  return {
    allowed: count < config.maxRequests,
    remaining,
    resetAt
  }
}

// Usage in API routes
export const rateLimitConfigs = {
  auth: { windowMs: 15 * 60 * 1000, maxRequests: 5 }, // 5 attempts per 15 min
  api: { windowMs: 60 * 1000, maxRequests: 100 }, // 100 requests per minute
  ai: { windowMs: 60 * 1000, maxRequests: 20 } // 20 AI requests per minute
}
```

#### 3.2 Implement IP-based Blocking
```typescript
// src/lib/security/ip-blocklist.ts
import { Redis } from "ioredis"

const redis = new Redis(process.env.REDIS_URL!)

export async function blockIP(ip: string, duration: number = 3600) {
  await redis.setex(`blocked:${ip}`, duration, "1")
}

export async function isIPBlocked(ip: string): Promise<boolean> {
  const blocked = await redis.get(`blocked:${ip}`)
  return !!blocked
}

export async function recordFailedAttempt(ip: string): Promise<number> {
  const key = `failed:${ip}`
  const attempts = await redis.incr(key)
  await redis.expire(key, 3600)
  
  // Block after 5 failed attempts
  if (attempts >= 5) {
    await blockIP(ip, 3600)
  }
  
  return attempts
}
```

### 4. Data Encryption

#### 4.1 Implement Field-Level Encryption
```typescript
// src/lib/encryption/field-encryption.ts
import crypto from "crypto"

const ALGORITHM = "aes-256-gcm"
const KEY_LENGTH = 32
const IV_LENGTH = 16
const SALT_LENGTH = 64
const TAG_LENGTH = 16

function getKey(password: string, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(password, salt, 100000, KEY_LENGTH, "sha256")
}

export function encrypt(text: string, password: string): string {
  const salt = crypto.randomBytes(SALT_LENGTH)
  const iv = crypto.randomBytes(IV_LENGTH)
  const key = getKey(password, salt)
  
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
  let encrypted = cipher.update(text, "utf8", "hex")
  encrypted += cipher.final("hex")
  
  const tag = cipher.getAuthTag()
  
  return Buffer.concat([
    salt,
    iv,
    tag,
    Buffer.from(encrypted, "hex")
  ]).toString("base64")
}

export function decrypt(encryptedData: string, password: string): string {
  const buffer = Buffer.from(encryptedData, "base64")
  
  const salt = buffer.slice(0, SALT_LENGTH)
  const iv = buffer.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH)
  const tag = buffer.slice(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + TAG_LENGTH)
  const encrypted = buffer.slice(SALT_LENGTH + IV_LENGTH + TAG_LENGTH)
  
  const key = getKey(password, salt)
  
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(tag)
  
  let decrypted = decipher.update(encrypted.toString("hex"), "hex", "utf8")
  decrypted += decipher.final("utf8")
  
  return decrypted
}
```

#### 4.2 Encrypt Sensitive Data at Rest
```typescript
// prisma/schema.prisma - Add encrypted fields
model Student {
  id        String   @id @default(cuid())
  email     String   @unique
  // Encrypt personal information
  phone     String?
  address   String?
  // ... other fields
}

// Use Prisma middleware for automatic encryption
// prisma/encryption-middleware.ts
prisma.$use(async (params, next) => {
  if (params.action === "create" || params.action === "update") {
    if (params.model === "Student") {
      const data = params.args.data
      if (data.phone) {
        data.phone = encrypt(data.phone, process.env.ENCRYPTION_KEY!)
      }
      if (data.address) {
        data.address = encrypt(data.address, process.env.ENCRYPTION_KEY!)
      }
    }
  }
  return next()
})
```

### 5. Security Headers & CSP

#### 5.1 Implement Strict Security Headers
```typescript
// src/lib/middleware.ts
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const response = NextResponse.next()
  
  // Security headers
  response.headers.set("X-Frame-Options", "DENY")
  response.headers.set("X-Content-Type-Options", "nosniff")
  response.headers.set("X-XSS-Protection", "1; mode=block")
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
  response.headers.set("Permissions-Policy", "geolocation=(), microphone=(), camera=()")
  
  // Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self'",
    "connect-src 'self' https://generativelanguage.googleapis.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join("; ")
  
  response.headers.set("Content-Security-Policy", csp)
  
  // HSTS
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains; preload"
  )
  
  return response
}
```

### 6. Audit Logging

#### 6.1 Implement Comprehensive Audit Logs
```typescript
// src/lib/audit/audit-logger.ts
import { prisma } from "@/lib/db/prisma"

export interface AuditLogEntry {
  userId: string
  action: string
  resource: string
  resourceId?: string
  details?: Record<string, any>
  ipAddress?: string
  userAgent?: string
  success: boolean
}

export async function createAuditLog(entry: AuditLogEntry) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: entry.userId,
        action: entry.action,
        resource: entry.resource,
        resourceId: entry.resourceId,
        details: entry.details as any,
        ipAddress: entry.ipAddress,
        userAgent: entry.userAgent,
        success: entry.success,
        timestamp: new Date()
      }
    })
  } catch (error) {
    console.error("Failed to create audit log:", error)
  }
}

// Middleware for automatic logging
export function withAuditLogging(action: string, resource: string) {
  return async (handler: Function) => {
    return async (req: Request, ...args: any[]) => {
      const session = await getServerSession(authOptions)
      const startTime = Date.now()
      
      try {
        const result = await handler(req, ...args)
        
        await createAuditLog({
          userId: session?.user?.id || "anonymous",
          action,
          resource,
          resourceId: extractResourceId(req),
          details: {
            method: req.method,
            url: req.url,
            duration: Date.now() - startTime
          },
          ipAddress: extractIP(req),
          userAgent: req.headers.get("user-agent") || undefined,
          success: true
        })
        
        return result
      } catch (error) {
        await createAuditLog({
          userId: session?.user?.id || "anonymous",
          action,
          resource,
          details: {
            error: error instanceof Error ? error.message : "Unknown error",
            duration: Date.now() - startTime
          },
          ipAddress: extractIP(req),
          userAgent: req.headers.get("user-agent") || undefined,
          success: false
        })
        
        throw error
      }
    }
  }
}
```

### 7. API Security

#### 7.1 Implement API Key Management
```typescript
// src/lib/api/api-keys.ts
import { prisma } from "@/lib/db/prisma"
import { randomBytes } from "crypto"

export async function generateAPIKey(userId: string, name: string) {
  const key = `sk_${randomBytes(32).toString("hex")}`
  const hashedKey = await hashAPIKey(key)
  
  await prisma.apiKey.create({
    data: {
      userId,
      name,
      hashedKey,
      scopes: ["read", "write"],
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days
    }
  })
  
  return key
}

export async function validateAPIKey(key: string) {
  const hashedKey = await hashAPIKey(key)
  
  const apiKey = await prisma.apiKey.findUnique({
    where: { hashedKey },
    include: { user: true }
  })
  
  if (!apiKey || apiKey.expiresAt < new Date() || apiKey.revoked) {
    return null
  }
  
  return apiKey.user
}

async function hashAPIKey(key: string): Promise<string> {
  return await bcrypt.hash(key, 12)
}
```

#### 7.2 Implement API Versioning
```typescript
// src/app/api/v1/students/route.ts
// src/app/api/v2/students/route.ts

// Use API versioning for backward compatibility
export const runtime = "edge"

export async function GET(request: Request) {
  const headers = new Headers({
    "API-Version": "v2",
    "X-RateLimit-Limit": "100",
    "X-RateLimit-Remaining": "95"
  })
  
  return NextResponse.json(data, { headers })
}
```

### 8. Password Security

#### 8.1 Implement Strong Password Policy
```typescript
// src/lib/auth/password-policy.ts
import { z } from "zod"

export const passwordSchema = z
  .string()
  .min(12, "Password must be at least 12 characters")
  .max(128, "Password must not exceed 128 characters")
  .refine(
    (password) => /[A-Z]/.test(password),
    "Password must contain at least one uppercase letter"
  )
  .refine(
    (password) => /[a-z]/.test(password),
    "Password must contain at least one lowercase letter"
  )
  .refine(
    (password) => /[0-9]/.test(password),
    "Password must contain at least one number"
  )
  .refine(
    (password) => /[^A-Za-z0-9]/.test(password),
    "Password must contain at least one special character"
  )
  .refine(
    (password) => !/(.)\1{2,}/.test(password),
    "Password must not contain repeating characters"
  )
  .refine(
    (password) => !password.toLowerCase().includes("password"),
    "Password must not contain common words"
  )

export function checkPasswordStrength(password: string): {
  score: number
  feedback: string[]
} {
  const feedback: string[] = []
  let score = 0
  
  if (password.length >= 12) score += 20
  else feedback.push("Password should be at least 12 characters")
  
  if (/[A-Z]/.test(password)) score += 20
  else feedback.push("Add uppercase letters")
  
  if (/[a-z]/.test(password)) score += 20
  else feedback.push("Add lowercase letters")
  
  if (/[0-9]/.test(password)) score += 20
  else feedback.push("Add numbers")
  
  if (/[^A-Za-z0-9]/.test(password)) score += 20
  else feedback.push("Add special characters")
  
  return { score, feedback }
}
```

#### 8.2 Implement Password Rotation & History
```typescript
// src/lib/auth/password-history.ts
import { prisma } from "@/lib/db/prisma"

export async function checkPasswordHistory(
  userId: string,
  newPassword: string
): Promise<boolean> {
  const passwordHistory = await prisma.passwordHistory.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 5 // Last 5 passwords
  })
  
  for (const entry of passwordHistory) {
    const matches = await bcrypt.compare(newPassword, entry.hashedPassword)
    if (matches) {
      return false
    }
  }
  
  return true
}

export async function savePasswordHistory(
  userId: string,
  hashedPassword: string
) {
  await prisma.passwordHistory.create({
    data: {
      userId,
      hashedPassword,
      createdAt: new Date()
    }
  })
  
  // Clean up old history (keep last 5)
  const oldEntries = await prisma.passwordHistory.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    skip: 5
  })
  
  if (oldEntries.length > 0) {
    await prisma.passwordHistory.deleteMany({
      where: {
        id: { in: oldEntries.map((e) => e.id) }
      }
    })
  }
}
```

### 9. Session Security

#### 9.1 Implement Session Management
```typescript
// src/lib/auth/session-manager.ts
import { Redis } from "ioredis"
import { SignJWT, jwtVerify } from "jose"

const redis = new Redis(process.env.REDIS_URL!)
const SESSION_TTL = 15 * 60 // 15 minutes

export interface SessionData {
  userId: string
  role: string
  ip: string
  userAgent: string
  createdAt: number
}

export async function createSession(
  userId: string,
  role: string,
  ip: string,
  userAgent: string
): Promise<string> {
  const sessionId = crypto.randomUUID()
  const sessionData: SessionData = {
    userId,
    role,
    ip,
    userAgent,
    createdAt: Date.now()
  }
  
  await redis.setex(
    `session:${sessionId}`,
    SESSION_TTL,
    JSON.stringify(sessionData)
  )
  
  const token = await new SignJWT({ sessionId, ...sessionData })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL}s`)
    .sign(new TextEncoder().encode(process.env.SESSION_SECRET!))
  
  return token
}

export async function validateSession(
  token: string,
  ip: string,
  userAgent: string
): Promise<SessionData | null> {
  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(process.env.SESSION_SECRET!)
    )
    
    const sessionKey = `session:${payload.sessionId}`
    const sessionData = await redis.get(sessionKey)
    
    if (!sessionData) {
      return null
    }
    
    const session = JSON.parse(sessionData) as SessionData
    
    // Validate IP and user agent
    if (session.ip !== ip || session.userAgent !== userAgent) {
      await redis.del(sessionKey)
      return null
    }
    
    // Refresh session TTL
    await redis.expire(sessionKey, SESSION_TTL)
    
    return session
  } catch {
    return null
  }
}

export async function revokeSession(sessionId: string) {
  await redis.del(`session:${sessionId}`)
}

export async function revokeAllUserSessions(userId: string) {
  const keys = await redis.keys(`session:*`)
  
  for (const key of keys) {
    const sessionData = await redis.get(key)
    if (sessionData) {
      const session = JSON.parse(sessionData) as SessionData
      if (session.userId === userId) {
        await redis.del(key)
      }
    }
  }
}
```

#### 9.2 Implement Concurrent Session Limits
```typescript
// src/lib/auth/concurrent-sessions.ts
import { Redis } from "ioredis"

const redis = new Redis(process.env.REDIS_URL!)
const MAX_CONCURRENT_SESSIONS = 3

export async function checkConcurrentSessions(userId: string): Promise<boolean> {
  const keys = await redis.keys(`session:*`)
  let activeSessions = 0
  
  for (const key of keys) {
    const sessionData = await redis.get(key)
    if (sessionData) {
      const session = JSON.parse(sessionData) as SessionData
      if (session.userId === userId) {
        activeSessions++
      }
    }
  }
  
  return activeSessions < MAX_CONCURRENT_SESSIONS
}

export async function cleanupOldSessions(userId: string) {
  const keys = await redis.keys(`session:*`)
  const userSessions: { key: string; createdAt: number }[] = []
  
  for (const key of keys) {
    const sessionData = await redis.get(key)
    if (sessionData) {
      const session = JSON.parse(sessionData) as SessionData
      if (session.userId === userId) {
        userSessions.push({ key, createdAt: session.createdAt })
      }
    }
  }
  
  // Sort by creation time (oldest first)
  userSessions.sort((a, b) => a.createdAt - b.createdAt)
  
  // Keep only the newest MAX_CONCURRENT_SESSIONS sessions
  const sessionsToRemove = userSessions.slice(0, -MAX_CONCURRENT_SESSIONS)
  
  for (const { key } of sessionsToRemove) {
    await redis.del(key)
  }
}
```

### 10. CSRF Protection

#### 10.1 Implement CSRF Token System
```typescript
// src/lib/security/csrf.ts
import { Redis } from "ioredis"
import { randomBytes } from "crypto"

const redis = new Redis(process.env.REDIS_URL!)

export async function generateCSRFToken(sessionId: string): Promise<string> {
  const token = randomBytes(32).toString("hex")
  await redis.setex(`csrf:${sessionId}`, 3600, token) // 1 hour
  return token
}

export async function validateCSRFToken(
  sessionId: string,
  token: string
): Promise<boolean> {
  const storedToken = await redis.get(`csrf:${sessionId}`)
  return storedToken === token
}

export function setCSRFCookie(response: Response, token: string) {
  response.headers.set(
    "Set-Cookie",
    `csrf_token=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=3600`
  )
}
```

---

## EFFICIENCY IMPROVEMENTS

### 1. Caching Strategy

#### 1.1 Implement Multi-Layer Caching
```typescript
// src/lib/cache/multi-layer-cache.ts
import { Redis } from "ioredis"
import LRUCache from "lru-cache"

const redis = new Redis(process.env.REDIS_URL!)

// L1: In-memory cache (fastest, limited size)
const l1Cache = new LRUCache<string, any>({
  max: 500,
  ttl: 1000 * 60 * 5, // 5 minutes
  updateAgeOnGet: true
})

// L2: Redis cache (distributed, larger)
async function getFromL2<T>(key: string): Promise<T | null> {
  const data = await redis.get(key)
  return data ? JSON.parse(data) : null
}

async function setL2<T>(key: string, value: T, ttl: number = 3600) {
  await redis.setex(key, ttl, JSON.stringify(value))
}

// Multi-layer cache with cache-aside pattern
export async function get<T>(
  key: string,
  fetchFn: () => Promise<T>,
  options: {
    l1TTL?: number
    l2TTL?: number
    forceRefresh?: boolean
  } = {}
): Promise<T> {
  const { l1TTL = 5 * 60 * 1000, l2TTL = 3600, forceRefresh = false } = options
  
  // Check L1 cache
  if (!forceRefresh) {
    const l1Value = l1Cache.get(key) as T | undefined
    if (l1Value) {
      return l1Value
    }
  }
  
  // Check L2 cache
  if (!forceRefresh) {
    const l2Value = await getFromL2<T>(key)
    if (l2Value) {
      l1Cache.set(key, l2Value, { ttl: l1TTL })
      return l2Value
    }
  }
  
  // Fetch from source
  const value = await fetchFn()
  
  // Set L1 and L2
  l1Cache.set(key, value, { ttl: l1TTL })
  await setL2(key, value, l2TTL)
  
  return value
}

export async function invalidate(key: string) {
  l1Cache.delete(key)
  await redis.del(key)
}

export async function invalidatePattern(pattern: string) {
  const keys = await redis.keys(pattern)
  if (keys.length > 0) {
    await redis.del(...keys)
  }
  l1Cache.clear()
}
```

#### 1.2 Implement Cache Invalidation Strategy
```typescript
// src/lib/cache/cache-invalidation.ts
import { prisma } from "@/lib/db/prisma"

// Tag-based cache invalidation
export async function invalidateByTags(tags: string[]) {
  const pattern = `cache:${tags.join(":")}:*`
  await invalidatePattern(pattern)
}

// Prisma middleware for automatic cache invalidation
prisma.$use(async (params, next) => {
  const result = await next(params)
  
  // Invalidate caches based on model changes
  const invalidations: Record<string, string[]> = {
    Student: ["students", "dashboard"],
    Attendance: ["attendance", "dashboard"],
    Grade: ["grades", "dashboard"],
    User: ["users", "admin"]
  }
  
  const tags = invalidations[params.model]
  if (tags) {
    await invalidateByTags(tags)
  }
  
  return result
})
```

### 2. Database Optimization

#### 2.1 Implement Database Connection Pooling
```typescript
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  
  // Connection pool settings
  pool_timeout = 10
  connection_limit = 20
}
```

#### 2.2 Add Database Indexes
```typescript
// prisma/schema.prisma
model Student {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String
  // Add indexes for frequently queried fields
  @@index([email])
  @@index([name])
  @@index([gradeId])
}

model Attendance {
  id        String   @id @default(cuid())
  studentId String
  date      DateTime
  status    String
  // Composite index for common queries
  @@index([studentId, date])
  @@index([date, status])
}
```

#### 2.3 Implement Query Optimization
```typescript
// src/lib/db/query-optimizer.ts
import { PrismaClient } from "@prisma/client"

// Use select to limit returned fields
export async function getStudentsList() {
  return prisma.student.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      grade: {
        select: {
          name: true
        }
      }
    },
    orderBy: {
      name: "asc"
    }
  })
}

// Use cursor-based pagination for large datasets
export async function getPaginatedStudents(cursor?: string, limit = 20) {
  return prisma.student.findMany({
    take: limit,
    ...(cursor && { skip: 1, cursor: { id: cursor } }),
    orderBy: { id: "asc" }
  })
}

// Batch operations for better performance
export async function createManyStudents(students: CreateStudentInput[]) {
  return prisma.student.createMany({
    data: students,
    skipDuplicates: true
  })
}
```

### 3. API Optimization

#### 3.1 Implement Response Compression
```typescript
// next.config.ts
import type { NextConfig } from "next"

const config: NextConfig = {
  compress: true,
  // Enable gzip compression
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ["@radix-ui/react-icons"]
  }
}

export default config
```

#### 3.2 Implement GraphQL for Efficient Data Fetching
```typescript
// Consider migrating from REST to GraphQL
// src/app/api/graphql/route.ts
import { createSchema } from "@/lib/graphql/schema"

const schema = createSchema()

export async function POST(request: Request) {
  const { query, variables } = await request.json()
  const result = await graphql({
    schema,
    source: query,
    variableValues: variables
  })
  
  return NextResponse.json(result)
}
```

### 4. Frontend Performance

#### 4.1 Implement Code Splitting & Lazy Loading
```typescript
// src/app/dashboard/page.tsx
import dynamic from "next/dynamic"

// Lazy load heavy components
const StudentChart = dynamic(
  () => import("@/components/dashboard/student-chart"),
  { 
    loading: () => <ChartSkeleton />,
    ssr: false // Only load on client
  }
)

const AnalyticsPanel = dynamic(
  () => import("@/components/dashboard/analytics-panel"),
  { loading: () => <div>Loading analytics...</div> }
)
```

#### 4.2 Implement Virtual Scrolling
```typescript
// src/components/virtualized-list.tsx
import { useVirtualizer } from "@tanstack/react-virtual"

export function VirtualizedList({ items }: { items: any[] }) {
  const parentRef = useRef<HTMLDivElement>(null)
  
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50,
    overscan: 5
  })
  
  return (
    <div ref={parentRef} style={{ height: "600px", overflow: "auto" }}>
      <div style={{ height: `${virtualizer.getTotalSize()}px` }}>
        {virtualizer.getVirtualItems().map((virtualRow) => (
          <div
            key={virtualRow.key}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: `${virtualRow.size}px`,
              transform: `translateY(${virtualRow.start}px)`
            }}
          >
            {items[virtualRow.index]}
          </div>
        ))}
      </div>
    </div>
  )
}
```

#### 4.3 Implement Image Optimization
```typescript
// Use Next.js Image component
import Image from "next/image"

<Image
  src="/student-avatar.jpg"
  alt="Student Avatar"
  width={200}
  height={200}
  loading="lazy"
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRg..."
/>
```

### 5. Bundle Optimization

#### 5.1 Implement Tree Shaking
```typescript
// Use specific imports instead of entire libraries
// Bad
import * as Icons from "lucide-react"

// Good
import { User, Lock, Settings } from "lucide-react"
```

#### 5.2 Configure Webpack for Optimal Bundling
```typescript
// next.config.ts
const config: NextConfig = {
  webpack: (config) => {
    // Optimize bundle splitting
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        chunks: "all",
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: "vendors",
            priority: 10
          },
          ui: {
            test: /[\\/]node_modules[\\/](@radix-ui|@shadcn)[\\/]/,
            name: "ui",
            priority: 20
          }
        }
      }
    }
    return config
  }
}
```

### 6. Performance Monitoring

#### 6.1 Implement APM Integration
```typescript
// src/lib/monitoring/apm.ts
import * as Apm from "@elastic/apm-rum"

export function initAPM() {
  Apm.init({
    serviceName: "school-management",
    serverUrl: process.env.APM_SERVER_URL,
    environment: process.env.NODE_ENV,
    distributedTracing: true,
    transactionSampleRate: 0.1
  })
}

// Track custom transactions
export async function trackTransaction<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  const transaction = Apm.startTransaction(name, "custom")
  
  try {
    const result = await fn()
    transaction?.end()
    return result
  } catch (error) {
    transaction?.setOutcome("failure")
    transaction?.end()
    throw error
  }
}
```

#### 6.2 Implement Error Tracking
```typescript
// src/lib/monitoring/error-tracking.ts
import * as Sentry from "@sentry/nextjs"

export function initSentry() {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 0.1,
    beforeSend(event) {
      // Filter out sensitive data
      if (event.request?.headers) {
        delete event.request.headers["authorization"]
        delete event.request.headers["cookie"]
      }
      return event
    }
  })
}
```

---

## INFRASTRUCTURE IMPROVEMENTS

### 1. CI/CD Pipeline

#### 1.1 GitHub Actions Workflow
```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: "20"
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check
      - run: npm run test
      
  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: securego/gosec@master
      - uses: snyk/actions/golang@master
      
  deploy:
    needs: [test, security-scan]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: "--prod"
```

### 2. Database Backup & Disaster Recovery

#### 2.1 Automated Backup Script
```typescript
// scripts/backup.ts
import { PrismaClient } from "@prisma/client"
import { exec } from "child_process"
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
  }
})

export async function backupDatabase() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
  const filename = `backup-${timestamp}.sql`
  
  // Create backup
  await new Promise((resolve, reject) => {
    exec(
      `pg_dump ${process.env.DATABASE_URL} > /tmp/${filename}`,
      (error) => {
        if (error) reject(error)
        else resolve(null)
      }
    )
  })
  
  // Upload to S3
  const fs = require("fs")
  const backupData = fs.readFileSync(`/tmp/${filename}`)
  
  await s3.send(
    new PutObjectCommand({
      Bucket: process.env.S3_BACKUP_BUCKET,
      Key: `backups/${filename}`,
      Body: backupData,
      ServerSideEncryption: "AES256"
    })
  )
  
  console.log(`Backup completed: ${filename}`)
}
```

### 3. Monitoring & Alerting

#### 3.1 Implement Health Checks
```typescript
// src/app/api/health/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { redis } from "@/lib/cache/redis"

export async function GET() {
  const health = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    checks: {
      database: "unknown",
      redis: "unknown",
      api: "unknown"
    }
  }
  
  try {
    await prisma.$queryRaw`SELECT 1`
    health.checks.database = "ok"
  } catch {
    health.checks.database = "error"
    health.status = "degraded"
  }
  
  try {
    await redis.ping()
    health.checks.redis = "ok"
  } catch {
    health.checks.redis = "error"
    health.status = "degraded"
  }
  
  const statusCode = health.status === "healthy" ? 200 : 503
  return NextResponse.json(health, { status: statusCode })
}
```

---

## ADDITIONAL SECURITY MEASURES

### 1. Data Retention Policy
```typescript
// Implement automatic data cleanup
cron.schedule("0 2 * * *", async () => {
  // Delete audit logs older than 1 year
  await prisma.auditLog.deleteMany({
    where: {
      timestamp: {
        lt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
      }
    }
  })
})
```

### 2. API Documentation with Security Best Practices
```typescript
// Document all endpoints with OpenAPI/Swagger
// Include security schemes, rate limits, and examples
```

### 3. Regular Security Audits
```typescript
// Schedule automated security scans
// npm audit
// snyk test
// dependency-check
```

---

## IMPLEMENTATION PRIORITY

### Phase 1 (Critical - 1-2 weeks)
1. Implement NextAuth.js with RBAC
2. Add security headers middleware
3. Implement rate limiting
4. Add input validation middleware
5. Set up Redis for caching

### Phase 2 (High - 2-4 weeks)
1. Implement audit logging
2. Add API key management
3. Implement session management
4. Add database indexes
5. Set up CI/CD pipeline

### Phase 3 (Medium - 1-2 months)
1. Implement field-level encryption
2. Add APM integration
3. Set up database backups
4. Implement GraphQL (optional)
5. Add performance monitoring

### Phase 4 (Long-term - 2-3 months)
1. Implement advanced caching strategies
2. Add comprehensive testing
3. Set up disaster recovery
4. Regular security audits
5. Performance optimization

---

## ENVIRONMENT VARIABLES REQUIRED

```env
# Security
NEXTAUTH_SECRET=your-super-secret-key-here
ENCRYPTION_KEY=your-encryption-key-here
SESSION_SECRET=your-session-secret-here

# Database
DATABASE_URL=postgresql://user:password@host:5432/dbname

# Redis
REDIS_URL=redis://host:6379

# AI Services
GEMINI_API_KEY=your-gemini-api-key

# Monitoring
SENTRY_DSN=your-sentry-dsn
APM_SERVER_URL=your-apm-server-url

# AWS (for backups)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
S3_BACKUP_BUCKET=your-backup-bucket

# Vercel
VERCEL_TOKEN=your-vercel-token
ORG_ID=your-org-id
PROJECT_ID=your-project-id
```

---

## CONCLUSION

This comprehensive improvement plan addresses both efficiency and military-grade security requirements. Implementation should follow the phased approach, prioritizing critical security measures first while ensuring minimal disruption to existing functionality.

Regular security audits, penetration testing, and performance monitoring should be conducted quarterly to maintain the highest standards of security and efficiency.

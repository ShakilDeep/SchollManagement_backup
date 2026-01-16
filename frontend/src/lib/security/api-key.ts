import { prisma } from "@/lib/db"
import { generateApiKey, verifyApiKey, hashData, compareHashedData } from "./encryption"
import { createAuditLog, AuditAction, AuditEntity } from "./audit"

export enum ApiKeyScope {
  READ = "read",
  WRITE = "write",
  ADMIN = "admin",
  STUDENT_MANAGEMENT = "student_management",
  TEACHER_MANAGEMENT = "teacher_management",
  GRADE_MANAGEMENT = "grade_management",
  ATTENDANCE_MANAGEMENT = "attendance_management",
  LIBRARY_MANAGEMENT = "library_management",
  TRANSPORT_MANAGEMENT = "transport_management",
  HOSTEL_MANAGEMENT = "hostel_management",
  REPORTS = "reports"
}

export enum ApiKeyStatus {
  ACTIVE = "ACTIVE",
  REVOKED = "REVOKED",
  EXPIRED = "EXPIRED",
  PENDING = "PENDING"
}

export async function createApiKey(options: {
  userId: string
  name: string
  scopes: ApiKeyScope[]
  expiresIn?: number
  ipAddress?: string
  userAgent?: string
}): Promise<{ apiKey: string; keyId: string }> {
  const { userId, name, scopes, expiresIn } = options

  const apiKey = generateApiKey()
  const keyId = hashData(apiKey)
  const expiresAt = expiresIn ? new Date(Date.now() + expiresIn) : null

  await prisma.apiKey.create({
    data: {
      userId,
      name,
      keyId,
      hashedKey: keyId,
      scopes,
      status: ApiKeyStatus.ACTIVE,
      expiresAt
    }
  })

  await createAuditLog({
    userId,
    action: AuditAction.API_KEY_GENERATED,
    entity: AuditEntity.API_KEY,
    details: {
      keyId,
      name,
      scopes,
      expiresAt
    },
    ipAddress: options.ipAddress,
    userAgent: options.userAgent
  })

  return { apiKey, keyId }
}

export async function validateApiKey(
  apiKey: string,
  requiredScope?: ApiKeyScope
): Promise<{ valid: boolean; userId?: string; scopes?: ApiKeyScope[]; error?: string }> {
  if (!verifyApiKey(apiKey)) {
    return { valid: false, error: "Invalid API key format" }
  }

  const keyId = hashData(apiKey)

  const storedKey = await prisma.apiKey.findUnique({
    where: { keyId },
    include: { user: true }
  })

  if (!storedKey) {
    return { valid: false, error: "API key not found" }
  }

  if (storedKey.status !== ApiKeyStatus.ACTIVE) {
    return { valid: false, error: `API key is ${storedKey.status}` }
  }

  if (storedKey.expiresAt && new Date() > storedKey.expiresAt) {
    await prisma.apiKey.update({
      where: { id: storedKey.id },
      data: { status: ApiKeyStatus.EXPIRED }
    })

    return { valid: false, error: "API key has expired" }
  }

  if (requiredScope && !storedKey.scopes.includes(requiredScope)) {
    return { valid: false, error: "Insufficient API key permissions" }
  }

  await prisma.apiKey.update({
    where: { id: storedKey.id },
    data: { lastUsedAt: new Date() }
  })

  return {
    valid: true,
    userId: storedKey.userId,
    scopes: storedKey.scopes as ApiKeyScope[]
  }
}

export async function revokeApiKey(
  keyId: string,
  revokedByUserId: string,
  ipAddress?: string,
  userAgent?: string
): Promise<boolean> {
  const apiKey = await prisma.apiKey.findUnique({
    where: { keyId },
    include: { user: true }
  })

  if (!apiKey) {
    return false
  }

  await prisma.apiKey.update({
    where: { keyId },
    data: {
      status: ApiKeyStatus.REVOKED,
      revokedAt: new Date(),
      revokedBy: revokedByUserId
    }
  })

  await createAuditLog({
    userId: revokedByUserId,
    action: AuditAction.API_KEY_REVOKED,
    entity: AuditEntity.API_KEY,
    entityId: apiKey.id,
    details: {
      keyId,
      revokedUserId: apiKey.userId,
      revokedByName: apiKey.name
    },
    ipAddress,
    userAgent
  })

  return true
}

export async function revokeAllUserApiKeys(
  userId: string,
  revokedByUserId: string,
  exceptKeyId?: string
): Promise<number> {
  const whereClause = {
    userId,
    status: ApiKeyStatus.ACTIVE,
    ...(exceptKeyId && { keyId: { not: exceptKeyId } })
  }

  const apiKeys = await prisma.apiKey.findMany({
    where: whereClause
  })

  const now = new Date()

  await prisma.apiKey.updateMany({
    where: whereClause,
    data: {
      status: ApiKeyStatus.REVOKED,
      revokedAt: now,
      revokedBy: revokedByUserId
    }
  })

  for (const apiKey of apiKeys) {
    await createAuditLog({
      userId: revokedByUserId,
      action: AuditAction.API_KEY_REVOKED,
      entity: AuditEntity.API_KEY,
      entityId: apiKey.id,
      details: {
        keyId: apiKey.keyId,
        revokedUserId: userId,
        revokedByName: apiKey.name,
        reason: "USER_BULK_REVOKE"
      }
    })
  }

  return apiKeys.length
}

export async function rotateApiKey(
  keyId: string,
  rotatedByUserId: string,
  ipAddress?: string,
  userAgent?: string
): Promise<{ newApiKey: string; newKeyId: string }> {
  const existingKey = await prisma.apiKey.findUnique({
    where: { keyId }
  })

  if (!existingKey) {
    throw new Error("API key not found")
  }

  await revokeApiKey(keyId, rotatedByUserId, ipAddress, userAgent)

  const { apiKey, keyId: newKeyId } = await createApiKey({
    userId: existingKey.userId,
    name: `${existingKey.name} (Rotated)`,
    scopes: existingKey.scopes as ApiKeyScope[],
    expiresIn: existingKey.expiresAt
      ? existingKey.expiresAt.getTime() - Date.now()
      : undefined,
    ipAddress,
    userAgent
  })

  await createAuditLog({
    userId: rotatedByUserId,
    action: AuditAction.API_KEY_GENERATED,
    entity: AuditEntity.API_KEY,
    details: {
      originalKeyId: keyId,
      newKeyId,
      reason: "ROTATION"
    },
    ipAddress,
    userAgent
  })

  return { newApiKey: apiKey, newKeyId }
}

export async function getUserApiKeys(userId: string) {
  return prisma.apiKey.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" }
  })
}

export async function getApiKeyUsageStats(keyId: string, days: number = 30) {
  const apiKey = await prisma.apiKey.findUnique({
    where: { keyId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  })

  if (!apiKey) {
    return null
  }

  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const usageLogs = await prisma.auditLog.findMany({
    where: {
      entity: AuditEntity.API_KEY,
      entityId: apiKey.id,
      createdAt: { gte: startDate }
    },
    orderBy: { createdAt: "desc" }
  })

  const actionCounts = usageLogs.reduce((acc, log) => {
    acc[log.action] = (acc[log.action] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return {
    apiKey: {
      id: apiKey.id,
      name: apiKey.name,
      status: apiKey.status,
      scopes: apiKey.scopes,
      createdAt: apiKey.createdAt,
      expiresAt: apiKey.expiresAt,
      lastUsedAt: apiKey.lastUsedAt,
      user: apiKey.user
    },
    stats: {
      totalUsage: usageLogs.length,
      actionCounts,
      periodDays: days
    },
    recentLogs: usageLogs.slice(0, 10)
  }
}

export async function cleanupExpiredApiKeys(): Promise<number> {
  const expiredKeys = await prisma.apiKey.updateMany({
    where: {
      status: ApiKeyStatus.ACTIVE,
      expiresAt: {
        lt: new Date()
      }
    },
    data: {
      status: ApiKeyStatus.EXPIRED
    }
  })

  return expiredKeys.count
}

export function hasScope(scopes: ApiKeyScope[], requiredScope: ApiKeyScope): boolean {
  return scopes.includes(requiredScope) || scopes.includes(ApiKeyScope.ADMIN)
}

export function hasAnyScope(scopes: ApiKeyScope[], requiredScopes: ApiKeyScope[]): boolean {
  return requiredScopes.some(scope => hasScope(scopes, scope))
}

export function hasAllScopes(scopes: ApiKeyScope[], requiredScopes: ApiKeyScope[]): boolean {
  return requiredScopes.every(scope => hasScope(scopes, scope))
}

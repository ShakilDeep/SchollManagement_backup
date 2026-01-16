import { prisma } from "@/lib/db"
import { createAuditLog, AuditAction, AuditEntity } from "@/lib/security/audit"

interface APIKeyConfig {
  keyPrefix: string
  keyLength: number
  defaultExpirationDays: number
  maxKeysPerUser: number
}

interface APIKeyInfo {
  id: string
  keyPrefix: string
  name: string
  scopes: string[]
  userId: string
  createdAt: Date
  expiresAt: Date | null
  lastUsedAt: Date | null
  isActive: boolean
}

const DEFAULT_CONFIG: APIKeyConfig = {
  keyPrefix: "ec",
  keyLength: 32,
  defaultExpirationDays: 365,
  maxKeysPerUser: 10
}

class APIKeyManager {
  private config: APIKeyConfig

  constructor(config: Partial<APIKeyConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  async createAPIKey(
    userId: string,
    name: string,
    scopes: string[],
    expirationDays?: number
  ): Promise<{ apiKey: string; apiKeyId: string }> {
    const existingKeys = await prisma.apiKey.count({
      where: { userId, isActive: true }
    })

    if (existingKeys >= this.config.maxKeysPerUser) {
      throw new Error(`Maximum of ${this.config.maxKeysPerUser} API keys allowed per user`)
    }

    const keyId = this.generateKeyId()
    const keySecret = this.generateKeySecret()
    const apiKey = `${this.config.keyPrefix}_${keyId}_${keySecret}`

    const hashedKey = await this.hashAPIKey(apiKey)

    const expiresAt = expirationDays
      ? new Date(Date.now() + expirationDays * 24 * 60 * 60 * 1000)
      : null

    const apiKeyRecord = await prisma.apiKey.create({
      data: {
        keyId,
        name,
        hashedKey,
        scopes,
        userId,
        expiresAt,
        isActive: true
      }
    })

    await createAuditLog({
      userId,
      action: AuditAction.API_KEY_CREATED,
      entity: AuditEntity.API_KEY,
      details: {
        apiKeyId: apiKeyRecord.id,
        keyId,
        name,
        scopes,
        expiresAt
      }
    })

    return { apiKey, apiKeyId: apiKeyRecord.id }
  }

  async validateAPIKey(apiKey: string): Promise<{ valid: boolean; apiKeyInfo?: APIKeyInfo }> {
    const parts = apiKey.split("_")

    if (parts.length !== 3 || parts[0] !== this.config.keyPrefix) {
      return { valid: false }
    }

    const keyId = parts[1]

    const apiKeyRecord = await prisma.apiKey.findUnique({
      where: { keyId }
    })

    if (!apiKeyRecord || !apiKeyRecord.isActive) {
      return { valid: false }
    }

    if (apiKeyRecord.expiresAt && apiKeyRecord.expiresAt < new Date()) {
      await this.revokeAPIKey(apiKeyRecord.id, "Expired")
      return { valid: false }
    }

    const isValid = await this.verifyAPIKey(apiKey, apiKeyRecord.hashedKey)

    if (!isValid) {
      return { valid: false }
    }

    await prisma.apiKey.update({
      where: { id: apiKeyRecord.id },
      data: { lastUsedAt: new Date() }
    })

    return {
      valid: true,
      apiKeyInfo: {
        id: apiKeyRecord.id,
        keyPrefix: this.config.keyPrefix,
        name: apiKeyRecord.name,
        scopes: apiKeyRecord.scopes as string[],
        userId: apiKeyRecord.userId,
        createdAt: apiKeyRecord.createdAt,
        expiresAt: apiKeyRecord.expiresAt,
        lastUsedAt: apiKeyRecord.lastUsedAt,
        isActive: apiKeyRecord.isActive
      }
    }
  }

  async hasScope(apiKey: string, requiredScope: string): Promise<boolean> {
    const result = await this.validateAPIKey(apiKey)

    if (!result.valid || !result.apiKeyInfo) {
      return false
    }

    return result.apiKeyInfo.scopes.includes(requiredScope)
  }

  async getUserAPIKeys(userId: string): Promise<APIKeyInfo[]> {
    const apiKeys = await prisma.apiKey.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" }
    })

    return apiKeys.map(apiKey => ({
      id: apiKey.id,
      keyPrefix: this.config.keyPrefix,
      name: apiKey.name,
      scopes: apiKey.scopes as string[],
      userId: apiKey.userId,
      createdAt: apiKey.createdAt,
      expiresAt: apiKey.expiresAt,
      lastUsedAt: apiKey.lastUsedAt,
      isActive: apiKey.isActive
    }))
  }

  async revokeAPIKey(apiKeyId: string, reason: string = "User requested"): Promise<void> {
    const apiKeyRecord = await prisma.apiKey.findUnique({
      where: { id: apiKeyId }
    })

    if (!apiKeyRecord) {
      throw new Error("API key not found")
    }

    await prisma.apiKey.update({
      where: { id: apiKeyId },
      data: { isActive: false }
    })

    await createAuditLog({
      userId: apiKeyRecord.userId,
      action: AuditAction.API_KEY_REVOKED,
      entity: AuditEntity.API_KEY,
      details: {
        apiKeyId,
        keyId: apiKeyRecord.keyId,
        name: apiKeyRecord.name,
        reason
      }
    })
  }

  async revokeAllUserAPIKeys(userId: string, exceptKeyId?: string): Promise<void> {
    const apiKeys = await prisma.apiKey.findMany({
      where: {
        userId,
        isActive: true,
        ...(exceptKeyId ? { id: { not: exceptKeyId } } : {})
      }
    })

    for (const apiKey of apiKeys) {
      await this.revokeAPIKey(apiKey.id, "All API keys revoked")
    }
  }

  async updateAPIKey(
    apiKeyId: string,
    updates: { name?: string; scopes?: string[]; expiresAt?: Date | null }
  ): Promise<void> {
    const apiKeyRecord = await prisma.apiKey.findUnique({
      where: { id: apiKeyId }
    })

    if (!apiKeyRecord) {
      throw new Error("API key not found")
    }

    await prisma.apiKey.update({
      where: { id: apiKeyId },
      data: updates
    })

    await createAuditLog({
      userId: apiKeyRecord.userId,
      action: AuditAction.API_KEY_UPDATED,
      entity: AuditEntity.API_KEY,
      details: {
        apiKeyId,
        updates
      }
    })
  }

  async cleanupExpiredAPIKeys(): Promise<number> {
    const result = await prisma.apiKey.updateMany({
      where: {
        isActive: true,
        expiresAt: { lte: new Date() }
      },
      data: { isActive: false }
    })

    return result.count
  }

  private generateKeyId(): string {
    return Array.from(crypto.getRandomValues(new Uint8Array(8)))
      .map(b => b.toString(16).padStart(2, "0"))
      .join("")
  }

  private generateKeySecret(): string {
    return Array.from(crypto.getRandomValues(new Uint8Array(this.config.keyLength)))
      .map(b => b.toString(16).padStart(2, "0"))
      .join("")
  }

  private async hashAPIKey(apiKey: string): Promise<string> {
    const encoder = new TextEncoder()
    const data = encoder.encode(apiKey)
    const hashBuffer = await crypto.subtle.digest("SHA-256", data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, "0")).join("")
  }

  private async verifyAPIKey(apiKey: string, hashedKey: string): Promise<boolean> {
    const computedHash = await this.hashAPIKey(apiKey)
    return computedHash === hashedKey
  }

  getConfig(): APIKeyConfig {
    return { ...this.config }
  }
}

const apiKeyManager = new APIKeyManager()

export function createAPIKeyManager(config?: Partial<APIKeyConfig>): APIKeyManager {
  return new APIKeyManager(config)
}

export async function createAPIKey(
  userId: string,
  name: string,
  scopes: string[],
  expirationDays?: number
) {
  return apiKeyManager.createAPIKey(userId, name, scopes, expirationDays)
}

export async function validateAPIKey(apiKey: string) {
  return apiKeyManager.validateAPIKey(apiKey)
}

export async function hasScope(apiKey: string, requiredScope: string) {
  return apiKeyManager.hasScope(apiKey, requiredScope)
}

export async function getUserAPIKeys(userId: string) {
  return apiKeyManager.getUserAPIKeys(userId)
}

export async function revokeAPIKey(apiKeyId: string, reason?: string) {
  return apiKeyManager.revokeAPIKey(apiKeyId, reason)
}

export async function revokeAllUserAPIKeys(userId: string, exceptKeyId?: string) {
  return apiKeyManager.revokeAllUserAPIKeys(userId, exceptKeyId)
}

export async function updateAPIKey(
  apiKeyId: string,
  updates: { name?: string; scopes?: string[]; expiresAt?: Date | null }
) {
  return apiKeyManager.updateAPIKey(apiKeyId, updates)
}

export async function cleanupExpiredAPIKeys() {
  return apiKeyManager.cleanupExpiredAPIKeys()
}

export { APIKeyManager, apiKeyManager }

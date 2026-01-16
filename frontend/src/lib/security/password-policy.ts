import { prisma } from "@/lib/db"
import { hashPassword, verifyPassword } from "./encryption"
import { validatePassword } from "./validation"
import { createAuditLog, AuditAction, AuditEntity } from "./audit"

export interface PasswordPolicy {
  minLength: number
  requireUppercase: boolean
  requireLowercase: boolean
  requireNumbers: boolean
  requireSpecialChars: boolean
  maxAge: number
  preventReuse: number
  preventCommonPasswords: boolean
  preventPersonalInfo: boolean
}

export const DEFAULT_PASSWORD_POLICY: PasswordPolicy = {
  minLength: 12,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  maxAge: 90,
  preventReuse: 5,
  preventCommonPasswords: true,
  preventPersonalInfo: true
}

const COMMON_PASSWORDS = [
  "password", "123456", "12345678", "qwerty", "abc123", "password123",
  "admin", "welcome", "monkey", "letmein", "dragon", "master",
  "hello", "login", "passw0rd", "football", "sunshine", "princess"
]

export async function validatePasswordPolicy(
  userId: string,
  password: string,
  policy: PasswordPolicy = DEFAULT_PASSWORD_POLICY
): Promise<{ isValid: boolean; errors: string[] }> {
  const errors: string[] = []

  const validation = validatePassword(password)
  if (!validation.isValid) {
    errors.push(...validation.errors)
  }

  if (policy.minLength > 0 && password.length < policy.minLength) {
    errors.push(`Password must be at least ${policy.minLength} characters long`)
  }

  if (policy.preventCommonPasswords) {
    const lowerPassword = password.toLowerCase()
    if (COMMON_PASSWORDS.some(common => lowerPassword.includes(common))) {
      errors.push("Password contains common words and is not allowed")
    }
  }

  if (policy.preventPersonalInfo) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true }
    })

    if (user) {
      const emailParts = user.email.split("@")[0].toLowerCase().split(/[^a-z0-9]+/)
      const nameParts = user.name.toLowerCase().split(/\s+/)

      const personalInfo = [...emailParts, ...nameParts].filter(part => part.length > 2)

      for (const part of personalInfo) {
        if (password.toLowerCase().includes(part)) {
          errors.push("Password cannot contain personal information")
          break
        }
      }
    }
  }

  if (policy.preventReuse > 0) {
    const previousPasswords = await prisma.passwordHistory.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: policy.preventReuse
    })

    for (const previousPassword of previousPasswords) {
      if (verifyPassword(password, previousPassword.hashedPassword)) {
        errors.push(`You cannot reuse your last ${policy.preventReuse} passwords`)
        break
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

export async function setPassword(
  userId: string,
  newPassword: string,
  forceChange: boolean = false,
  ipAddress?: string,
  userAgent?: string
): Promise<{ success: boolean; error?: string }> {
  const user = await prisma.user.findUnique({
    where: { id: userId }
  })

  if (!user) {
    return { success: false, error: "User not found" }
  }

  const validation = await validatePasswordPolicy(userId, newPassword)

  if (!validation.isValid) {
    return {
      success: false,
      error: validation.errors.join("; ")
    }
  }

  const hashedPassword = hashPassword(newPassword)

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        passwordUpdatedAt: new Date(),
        forcePasswordChange: forceChange
      }
    })

    await tx.passwordHistory.create({
      data: {
        userId,
        hashedPassword
      }
    })

    await tx.passwordHistory.deleteMany({
      where: {
        userId,
        createdAt: {
          lt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
        }
      }
    })
  })

  await createAuditLog({
    userId,
    action: AuditAction.PASSWORD_CHANGE,
    entity: AuditEntity.USER,
    entityId: userId,
    details: { forced: forceChange },
    ipAddress,
    userAgent
  })

  return { success: true }
}

export async function checkPasswordExpiration(userId: string): Promise<{
  isExpired: boolean
  daysUntilExpiration: number
  shouldWarn: boolean
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { passwordUpdatedAt: true }
  })

  if (!user || !user.passwordUpdatedAt) {
    return {
      isExpired: false,
      daysUntilExpiration: Infinity,
      shouldWarn: false
    }
  }

  const now = new Date()
  const passwordAge = now.getTime() - user.passwordUpdatedAt.getTime()
  const maxAge = DEFAULT_PASSWORD_POLICY.maxAge * 24 * 60 * 60 * 1000

  const daysUntilExpiration = Math.floor((maxAge - passwordAge) / (24 * 60 * 60 * 1000))
  const warningThreshold = 14 * 24 * 60 * 60 * 1000

  return {
    isExpired: passwordAge > maxAge,
    daysUntilExpiration: Math.max(0, daysUntilExpiration),
    shouldWarn: passwordAge > (maxAge - warningThreshold)
  }
}

export async function requirePasswordChange(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { forcePasswordChange: true }
  })

  await createAuditLog({
    userId,
    action: AuditAction.PASSWORD_CHANGE,
    entity: AuditEntity.USER,
    entityId: userId,
    details: { forced: true, reason: "ADMIN_REQUIRED" }
  })
}

export async function checkPasswordStrength(password: string): Promise<{
  score: number
  strength: "very weak" | "weak" | "fair" | "good" | "strong" | "very strong"
  suggestions: string[]
}> {
  let score = 0
  const suggestions: string[] = []

  if (password.length < 8) {
    suggestions.push("Use at least 8 characters")
  } else if (password.length < 12) {
    score += 1
    suggestions.push("Use at least 12 characters for better security")
  } else if (password.length >= 12) {
    score += 2
  }

  if (/[A-Z]/.test(password)) {
    score += 1
  } else {
    suggestions.push("Include uppercase letters")
  }

  if (/[a-z]/.test(password)) {
    score += 1
  } else {
    suggestions.push("Include lowercase letters")
  }

  if (/[0-9]/.test(password)) {
    score += 1
  } else {
    suggestions.push("Include numbers")
  }

  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    score += 1
  } else {
    suggestions.push("Include special characters")
  }

  const hasSequential = /(abc|bcd|cde|012|123|234|345)/i.test(password)
  const hasRepeating = /(.)\1{2,}/.test(password)

  if (hasSequential || hasRepeating) {
    score -= 1
    suggestions.push("Avoid sequential or repeated characters")
  }

  const strengthMap: Record<number, "very weak" | "weak" | "fair" | "good" | "strong" | "very strong"> = {
    0: "very weak",
    1: "weak",
    2: "fair",
    3: "good",
    4: "strong",
    5: "very strong",
    6: "very strong"
  }

  return {
    score: Math.max(0, Math.min(6, score)),
    strength: strengthMap[score],
    suggestions
  }
}

export async function validateCurrentPassword(
  userId: string,
  currentPassword: string
): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { password: true }
  })

  if (!user || !user.password) {
    return false
  }

  return verifyPassword(currentPassword, user.password)
}

export async function resetPassword(
  userId: string,
  newPassword: string,
  resetByUserId: string,
  ipAddress?: string,
  userAgent?: string
): Promise<{ success: boolean; error?: string }> {
  const user = await prisma.user.findUnique({
    where: { id: userId }
  })

  if (!user) {
    return { success: false, error: "User not found" }
  }

  const validation = await validatePasswordPolicy(userId, newPassword)

  if (!validation.isValid) {
    return {
      success: false,
      error: validation.errors.join("; ")
    }
  }

  const hashedPassword = hashPassword(newPassword)

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        passwordUpdatedAt: new Date(),
        forcePasswordChange: true
      }
    })

    await tx.passwordHistory.create({
      data: {
        userId,
        hashedPassword
      }
    })
  })

  await createAuditLog({
    userId: resetByUserId,
    action: AuditAction.PASSWORD_RESET,
    entity: AuditEntity.USER,
    entityId: userId,
    details: { resetUserId: userId },
    ipAddress,
    userAgent
  })

  return { success: true }
}

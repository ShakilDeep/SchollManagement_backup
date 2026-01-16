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
    "Password must not contain repeating characters (3 or more in a row)"
  )
  .refine(
    (password) => !/12345|54321|abcde|edcba|qwerty|asdfgh|zxcvbn/i.test(password),
    "Password must not contain common keyboard patterns"
  )
  .refine(
    (password) => !/password|admin|root|letmein|welcome|login|monkey/i.test(password),
    "Password must not contain common words"
  )

export const commonPasswords = new Set([
  "password", "123456", "12345678", "qwerty", "abc123", "monkey", "master",
  "dragon", "111111", "baseball", "iloveyou", "trustno1", "sunshine", "princess",
  "admin", "welcome", "shadow", "ashley", "football", "jesus", "michael",
  "ninja", "mustang", "password1", "password123"
])

export function checkPasswordStrength(password: string): {
  score: number
  feedback: string[]
  strength: "weak" | "fair" | "good" | "strong"
} {
  const feedback: string[] = []
  let score = 0

  if (password.length >= 12) score += 20
  else feedback.push("Password should be at least 12 characters")

  if (password.length >= 16) score += 5

  if (/[A-Z]/.test(password)) score += 20
  else feedback.push("Add uppercase letters")

  if (/[a-z]/.test(password)) score += 20
  else feedback.push("Add lowercase letters")

  if (/[0-9]/.test(password)) score += 20
  else feedback.push("Add numbers")

  if (/[^A-Za-z0-9]/.test(password)) score += 20
  else feedback.push("Add special characters")

  if (/!|@|#|\$|%|\^|&|\*|\(|\)/.test(password)) score += 5

  if (password.length >= 20 && score >= 80) score += 5

  if (commonPasswords.has(password.toLowerCase())) {
    score = 0
    feedback.push("Password is too common")
  }

  let strength: "weak" | "fair" | "good" | "strong" = "weak"
  if (score >= 90) strength = "strong"
  else if (score >= 70) strength = "good"
  else if (score >= 50) strength = "fair"

  return { score, feedback, strength }
}

export async function checkPasswordHistory(
  userId: string,
  newPassword: string,
  prisma: any
): Promise<{ valid: boolean; error?: string }> {
  const passwordHistory = await prisma.passwordHistory.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 5
  })

  const bcrypt = await import("bcryptjs")

  for (const entry of passwordHistory) {
    const matches = await bcrypt.compare(newPassword, entry.hashedPassword)
    if (matches) {
      return {
        valid: false,
        error: "Password has been used recently. Please choose a different password."
      }
    }
  }

  return { valid: true }
}

export async function savePasswordHistory(
  userId: string,
  hashedPassword: string,
  prisma: any
): Promise<void> {
  await prisma.passwordHistory.create({
    data: {
      userId,
      hashedPassword,
      createdAt: new Date()
    }
  })

  const oldEntries = await prisma.passwordHistory.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    skip: 5
  })

  if (oldEntries.length > 0) {
    await prisma.passwordHistory.deleteMany({
      where: {
        id: { in: oldEntries.map((e: any) => e.id) }
      }
    })
  }
}

export async function enforcePasswordExpiry(
  userId: string,
  prisma: any
): Promise<{ mustChange: boolean; daysRemaining?: number }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { passwordChangedAt: true }
  })

  if (!user?.passwordChangedAt) {
    return { mustChange: true }
  }

  const PASSWORD_EXPIRY_DAYS = 90
  const passwordAge = Date.now() - user.passwordChangedAt.getTime()
  const daysRemaining = Math.max(0, PASSWORD_EXPIRY_DAYS - (passwordAge / (1000 * 60 * 60 * 24)))

  return {
    mustChange: daysRemaining === 0,
    daysRemaining: Math.floor(daysRemaining)
  }
}

export function isPasswordComplexEnough(password: string): boolean {
  const result = passwordSchema.safeParse(password)
  return result.success
}

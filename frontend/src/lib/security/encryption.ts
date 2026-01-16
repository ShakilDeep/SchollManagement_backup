import crypto from "crypto"

const ALGORITHM = "aes-256-gcm"
const IV_LENGTH = 16
const SALT_LENGTH = 64
const TAG_LENGTH = 16
const KEY_LENGTH = 32

let encryptionKey: Buffer | null = null

function getKey(): Buffer {
  if (!encryptionKey) {
    const secret = process.env.ENCRYPTION_SECRET || ""

    if (secret.length < 32) {
      throw new Error("ENCRYPTION_SECRET must be at least 32 characters")
    }

    encryptionKey = crypto.scryptSync(secret, "salt", KEY_LENGTH)
  }

  return encryptionKey
}

export function encrypt(text: string): string {
  const key = getKey()
  const iv = crypto.randomBytes(IV_LENGTH)

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)

  let encrypted = cipher.update(text, "utf8", "hex")
  encrypted += cipher.final("hex")

  const authTag = cipher.getAuthTag()

  const combined = Buffer.concat([
    iv,
    authTag,
    Buffer.from(encrypted, "hex")
  ])

  return combined.toString("base64")
}

export function decrypt(encryptedText: string): string {
  try {
    const key = getKey()
    const combined = Buffer.from(encryptedText, "base64")

    const iv = combined.subarray(0, IV_LENGTH)
    const authTag = combined.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH)
    const encrypted = combined.subarray(IV_LENGTH + TAG_LENGTH)

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(authTag)

    let decrypted = decipher.update(encrypted.toString("hex"), "hex", "utf8")
    decrypted += decipher.final("utf8")

    return decrypted
  } catch (error) {
    throw new Error("Decryption failed")
  }
}

export function encryptObject<T extends Record<string, any>>(
  obj: T,
  fieldsToEncrypt: (keyof T)[]
): T {
  const encrypted = { ...obj }

  for (const field of fieldsToEncrypt) {
    if (typeof encrypted[field] === "string") {
      encrypted[field] = encrypt(encrypted[field] as string) as T[keyof T]
    }
  }

  return encrypted
}

export function decryptObject<T extends Record<string, any>>(
  obj: T,
  fieldsToDecrypt: (keyof T)[]
): T {
  const decrypted = { ...obj }

  for (const field of fieldsToDecrypt) {
    if (typeof decrypted[field] === "string") {
      try {
        decrypted[field] = decrypt(decrypted[field] as string) as T[keyof T]
      } catch {
      }
    }
  }

  return decrypted
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(SALT_LENGTH).toString("hex")
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex")
  return `${salt}:${hash}`
}

export function verifyPassword(password: string, hashedPassword: string): boolean {
  const [salt, hash] = hashedPassword.split(":")

  if (!salt || !hash) {
    return false
  }

  const verifyHash = crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex")

  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(verifyHash))
}

export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString("hex")
}

export function generateApiKey(): string {
  const timestamp = Date.now().toString(36)
  const randomPart = crypto.randomBytes(20).toString("hex")
  return `sk_${timestamp}_${randomPart}`
}

export function verifyApiKey(apiKey: string): boolean {
  const apiKeyRegex = /^sk_[a-z0-9]+_[a-f0-9]{40}$/
  return apiKeyRegex.test(apiKey)
}

export function generateTOTPSecret(): string {
  return crypto.randomBytes(20).toString("base32")
}

export function hashData(data: string): string {
  return crypto.createHash("sha256").update(data).digest("hex")
}

export function compareHashedData(data: string, hash: string): boolean {
  const dataHash = hashData(data)
  return crypto.timingSafeEqual(Buffer.from(dataHash), Buffer.from(hash))
}

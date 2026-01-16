import crypto from "crypto"

const ALGORITHM = "aes-256-gcm"
const KEY_LENGTH = 32
const IV_LENGTH = 16
const SALT_LENGTH = 64
const TAG_LENGTH = 16
const ITERATIONS = 100000

interface EncryptedData {
  salt: string
  iv: string
  tag: string
  data: string
}

function getKey(password: string, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, "sha256")
}

export function encrypt(text: string, password: string): string {
  if (!text) return text

  const salt = crypto.randomBytes(SALT_LENGTH)
  const iv = crypto.randomBytes(IV_LENGTH)
  const key = getKey(password, salt)

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)

  let encrypted = cipher.update(text, "utf8", "hex")
  encrypted += cipher.final("hex")

  const tag = cipher.getAuthTag()

  const result: EncryptedData = {
    salt: salt.toString("base64"),
    iv: iv.toString("base64"),
    tag: tag.toString("base64"),
    data: encrypted
  }

  return Buffer.from(JSON.stringify(result)).toString("base64")
}

export function decrypt(encryptedData: string, password: string): string {
  if (!encryptedData) return encryptedData

  try {
    const buffer = Buffer.from(encryptedData, "base64")
    const parsed = JSON.parse(buffer.toString("utf8")) as EncryptedData

    const salt = Buffer.from(parsed.salt, "base64")
    const iv = Buffer.from(parsed.iv, "base64")
    const tag = Buffer.from(parsed.tag, "base64")
    const encrypted = parsed.data

    const key = getKey(password, salt)

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(tag)

    let decrypted = decipher.update(encrypted, "hex", "utf8")
    decrypted += decipher.final("utf8")

    return decrypted
  } catch (error) {
    console.error("Decryption failed:", error)
    throw new Error("Failed to decrypt data")
  }
}

export function encryptFields<T extends Record<string, any>>(
  data: T,
  fieldsToEncrypt: (keyof T)[],
  encryptionKey: string
): T {
  const result = { ...data }

  for (const field of fieldsToEncrypt) {
    if (result[field] && typeof result[field] === "string") {
      result[field] = encrypt(result[field] as string, encryptionKey) as any
    }
  }

  return result
}

export function decryptFields<T extends Record<string, any>>(
  data: T,
  fieldsToDecrypt: (keyof T)[],
  encryptionKey: string
): T {
  const result = { ...data }

  for (const field of fieldsToDecrypt) {
    if (result[field] && typeof result[field] === "string") {
      try {
        result[field] = decrypt(result[field] as string, encryptionKey) as any
      } catch {
        result[field] = result[field]
      }
    }
  }

  return result
}

export function generateEncryptionKey(): string {
  return crypto.randomBytes(KEY_LENGTH).toString("hex")
}

export function validateEncryptionKey(key: string): boolean {
  try {
    const keyBuffer = Buffer.from(key, "hex")
    return keyBuffer.length === KEY_LENGTH
  } catch {
    return false
  }
}

export function hashSensitiveData(data: string): string {
  return crypto
    .createHash("sha256")
    .update(data)
    .digest("hex")
}

export function compareHashedData(data: string, hash: string): boolean {
  return hashSensitiveData(data) === hash
}

import { Prisma } from "@prisma/client"
import { encrypt, decrypt, encryptFields, decryptFields } from "../src/lib/encryption/field-encryption"

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || ""

const SENSITIVE_FIELDS_BY_MODEL: Record<string, string[]> = {
  User: ["phone", "address", "emergencyContact", "emergencyPhone"],
  Student: ["phone", "address", "medicalInfo", "bloodGroup", "allergies"],
  Teacher: ["phone", "address", "emergencyContact", "emergencyPhone"],
  Staff: ["phone", "address", "emergencyContact", "emergencyPhone"],
  Parent: ["phone", "address", "occupation", "workPhone"]
}

export function encryptionMiddleware() {
  return async (params: Prisma.MiddlewareParams, next: (params: Prisma.MiddlewareParams) => Promise<any>) => {
    if (!ENCRYPTION_KEY) {
      return next(params)
    }

    const model = params.model
    const action = params.action
    const sensitiveFields = SENSITIVE_FIELDS_BY_MODEL[model]

    if (!sensitiveFields) {
      return next(params)
    }

    if (action === "create" || action === "createMany" || action === "update" || action === "updateMany") {
      const data = params.args.data

      if (action === "create" || action === "update") {
        const encryptedData = encryptFields(data, sensitiveFields as any, ENCRYPTION_KEY)
        params.args.data = encryptedData
      } else if (action === "createMany" || action === "updateMany") {
        if (Array.isArray(data)) {
          params.args.data = data.map(item =>
            encryptFields(item, sensitiveFields as any, ENCRYPTION_KEY)
          )
        }
      }
    }

    const result = await next(params)

    if (action === "findUnique" || action === "findFirst" || action === "findMany") {
      if (Array.isArray(result)) {
        return result.map(item =>
          decryptFields(item, sensitiveFields as any, ENCRYPTION_KEY)
        )
      } else if (result) {
        return decryptFields(result, sensitiveFields as any, ENCRYPTION_KEY)
      }
    }

    return result
  }
}

import { UserRole } from "@prisma/client"

export const PERMISSIONS = {
  ADMIN: [
    "users:read",
    "users:create",
    "users:update",
    "users:delete",
    "students:read",
    "students:create",
    "students:update",
    "students:delete",
    "teachers:read",
    "teachers:create",
    "teachers:update",
    "teachers:delete",
    "staff:read",
    "staff:create",
    "staff:update",
    "staff:delete",
    "parents:read",
    "parents:create",
    "parents:update",
    "parents:delete",
    "grades:read",
    "grades:create",
    "grades:update",
    "grades:delete",
    "attendance:read",
    "attendance:create",
    "attendance:update",
    "attendance:delete",
    "exams:read",
    "exams:create",
    "exams:update",
    "exams:delete",
    "exams:results:read",
    "exams:results:create",
    "exams:results:update",
    "exams:results:delete",
    "library:read",
    "library:create",
    "library:update",
    "library:delete",
    "inventory:read",
    "inventory:create",
    "inventory:update",
    "inventory:delete",
    "transport:read",
    "transport:create",
    "transport:update",
    "transport:delete",
    "hostel:read",
    "hostel:create",
    "hostel:update",
    "hostel:delete",
    "finance:read",
    "finance:create",
    "finance:update",
    "finance:delete",
    "reports:read",
    "reports:export",
    "reports:import",
    "system:configure",
    "system:audit",
    "api:keys:read",
    "api:keys:create",
    "api:keys:revoke",
    "messages:read",
    "messages:create",
    "messages:delete",
    "announcements:read",
    "announcements:create",
    "announcements:update",
    "announcements:delete"
  ] as const,
  PRINCIPAL: [
    "users:read",
    "students:read",
    "students:create",
    "students:update",
    "teachers:read",
    "teachers:create",
    "teachers:update",
    "staff:read",
    "parents:read",
    "grades:read",
    "grades:update",
    "attendance:read",
    "attendance:create",
    "attendance:update",
    "exams:read",
    "exams:create",
    "exams:update",
    "exams:results:read",
    "library:read",
    "library:update",
    "inventory:read",
    "transport:read",
    "transport:update",
    "hostel:read",
    "finance:read",
    "finance:create",
    "finance:update",
    "reports:read",
    "reports:export",
    "messages:read",
    "messages:create",
    "announcements:read",
    "announcements:create",
    "announcements:update"
  ] as const,
  TEACHER: [
    "students:read",
    "students:update",
    "grades:read",
    "grades:create",
    "grades:update",
    "attendance:read",
    "attendance:create",
    "attendance:update",
    "exams:read",
    "exams:results:read",
    "exams:results:create",
    "exams:results:update",
    "library:read",
    "messages:read",
    "messages:create",
    "announcements:read"
  ] as const,
  PARENT: [
    "students:read:own",
    "grades:read:own",
    "attendance:read:own",
    "exams:read:own",
    "exams:results:read:own",
    "library:read",
    "messages:read",
    "messages:create",
    "announcements:read",
    "finance:read:own"
  ] as const,
  STUDENT: [
    "grades:read:own",
    "attendance:read:own",
    "exams:read:own",
    "exams:results:read:own",
    "library:read",
    "messages:read",
    "messages:create",
    "announcements:read"
  ] as const,
  ACCOUNTANT: [
    "finance:read",
    "finance:create",
    "finance:update",
    "students:read",
    "reports:read",
    "reports:export"
  ] as const,
  LIBRARIAN: [
    "library:read",
    "library:create",
    "library:update",
    "students:read"
  ] as const
}

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS][number]

export function hasPermission(
  userRole: UserRole,
  requiredPermission: string
): boolean {
  const rolePermissions = PERMISSIONS[userRole as keyof typeof PERMISSIONS]
  if (!rolePermissions) return false

  return rolePermissions.includes(requiredPermission as Permission)
}

export function hasAnyPermission(
  userRole: UserRole,
  requiredPermissions: string[]
): boolean {
  return requiredPermissions.some(permission =>
    hasPermission(userRole, permission)
  )
}

export function hasAllPermissions(
  userRole: UserRole,
  requiredPermissions: string[]
): boolean {
  return requiredPermissions.every(permission =>
    hasPermission(userRole, permission)
  )
}

export function canAccessResource(
  userRole: UserRole,
  userResourceIds: string[],
  targetResourceId: string
): boolean {
  if (hasPermission(userRole, "students:read")) {
    return true
  }

  if (hasPermission(userRole, "students:read:own")) {
    return userResourceIds.includes(targetResourceId)
  }

  return false
}

export function requirePermission(requiredPermission: string) {
  return async (req: Request, context?: { params?: any }) => {
    const { authOptions } = await import("./config")
    const { getServerSession } = await import("next-auth")
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

export function requireAnyPermission(requiredPermissions: string[]) {
  return async (req: Request) => {
    const { authOptions } = await import("./config")
    const { getServerSession } = await import("next-auth")
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      throw new Error("Unauthorized")
    }

    if (!hasAnyPermission(session.user.role, requiredPermissions)) {
      throw new Error("Forbidden")
    }

    return session
  }
}

export function getRoleHierarchy(): Record<UserRole, number> {
  return {
    ADMIN: 100,
    PRINCIPAL: 90,
    TEACHER: 60,
    ACCOUNTANT: 50,
    LIBRARIAN: 40,
    PARENT: 20,
    STUDENT: 10
  }
}

export function hasHigherOrEqualRole(
  userRole: UserRole,
  targetRole: UserRole
): boolean {
  const hierarchy = getRoleHierarchy()
  return hierarchy[userRole] >= hierarchy[targetRole]
}

export function canModifyUser(
  currentUserRole: UserRole,
  targetUserRole: UserRole
): boolean {
  if (currentUserRole === "ADMIN") return true

  const hierarchy = getRoleHierarchy()
  return hierarchy[currentUserRole] > hierarchy[targetUserRole]
}

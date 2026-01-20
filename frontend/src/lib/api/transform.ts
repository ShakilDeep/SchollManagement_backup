export function snakeToCamel(str: string): string {
  return str.replace(/([-_][a-z])/g, (group) =>
    group.toUpperCase().replace('-', '').replace('_', '')
  )
}

export function camelToSnake(str: string): string {
  return str.replace(/([A-Z])/g, '_$1').toLowerCase()
}

export function transformObject<T = Record<string, unknown>>(
  obj: Record<string, unknown>
): T {
  const transformed: Record<string, unknown> = {}

  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const camelKey = snakeToCamel(key)
      const value = obj[key]

      if (value === null || value === undefined) {
        transformed[camelKey] = value
      } else if (Array.isArray(value)) {
        transformed[camelKey] = value.map((item) =>
          typeof item === 'object' && item !== null
            ? transformObject(item as Record<string, unknown>)
            : item
        )
      } else if (typeof value === 'object' && value instanceof Date) {
        transformed[camelKey] = value
      } else if (typeof value === 'object') {
        transformed[camelKey] = transformObject(value as Record<string, unknown>)
      } else {
        transformed[camelKey] = value
      }
    }
  }

  return transformed as T
}

export function reverseTransformObject<T = Record<string, unknown>>(
  obj: Record<string, unknown>
): T {
  const transformed: Record<string, unknown> = {}

  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const snakeKey = camelToSnake(key)
      const value = obj[key]

      if (value === null || value === undefined) {
        transformed[snakeKey] = value
      } else if (Array.isArray(value)) {
        transformed[snakeKey] = value.map((item) =>
          typeof item === 'object' && item !== null
            ? reverseTransformObject(item as Record<string, unknown>)
            : item
        )
      } else if (typeof value === 'object' && value instanceof Date) {
        transformed[snakeKey] = value.toISOString()
      } else if (typeof value === 'object') {
        transformed[snakeKey] = reverseTransformObject(value as Record<string, unknown>)
      } else {
        transformed[snakeKey] = value
      }
    }
  }

  return transformed as T
}

export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export function transformPaginatedResponse<T = unknown>(
  response: PaginatedResponse<Record<string, unknown>>
): { count: number; next: string | null; previous: string | null; results: T[] } {
  return {
    count: response.count,
    next: response.next,
    previous: response.previous,
    results: response.results.map((item) => transformObject<T>(item)),
  }
}

export function transformResponse<T = unknown>(data: unknown): T {
  if (data === null || data === undefined) {
    return data as T
  }

  if (Array.isArray(data)) {
    return data.map((item) =>
      typeof item === 'object' && item !== null
        ? transformObject(item as Record<string, unknown>)
        : item
    ) as T
  }

  if (typeof data === 'object') {
    const transformed = transformObject(data as Record<string, unknown>)
    // Special handling for student data: create derived fields
    const obj = data as Record<string, unknown>
    if ('full_name' in obj || 'fullName' in obj || 'firstName' in obj) {
      const t = transformed as Record<string, unknown>
      // Create name field from fullName for display purposes
      if (t.fullName && !t.name) {
        t.name = t.fullName
      }
      // Create avatar from photo or first letter
      if (!t.avatar && t.name) {
        t.avatar = (t.name as string).charAt(0).toUpperCase()
      }
      // Map grade_name to gradeDisplay for backward compatibility
      if (t.gradeName && !t.gradeDisplay) {
        t.gradeDisplay = t.gradeName
      }
      // Map section_name to sectionDisplay for backward compatibility
      if (t.sectionName && !t.sectionDisplay) {
        t.sectionDisplay = t.sectionName
      }
    }
    return transformed as T
  }

  return data as T
}

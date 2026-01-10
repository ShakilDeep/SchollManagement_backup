export interface ValidationResult {
  isValid: boolean
  issues: string[]
  warnings: string[]
  score: number
}

export interface ValidationConfig {
  requiredFields: string[]
  minLength?: number
  maxLength?: number
  allowedValues?: any[]
  numericRange?: { min?: number; max?: number }
  dateRange?: { start?: Date; end?: Date }
  customValidation?: (data: any) => string[]
}

export class DataValidator {
  static validateRequiredFields(data: any, requiredFields: string[]): string[] {
    const issues: string[] = []

    requiredFields.forEach(field => {
      if (data[field] === undefined || data[field] === null || data[field] === '') {
        issues.push(`Missing required field: ${field}`)
      }
    })

    return issues
  }

  static validateStringField(data: any, field: string, config: { minLength?: number; maxLength?: number }): string[] {
    const issues: string[] = []
    const value = data[field]

    if (value === undefined || value === null || value === '') {
      return issues
    }

    if (typeof value !== 'string') {
      issues.push(`${field} must be a string`)
      return issues
    }

    if (config.minLength && value.length < config.minLength) {
      issues.push(`${field} must be at least ${config.minLength} characters`)
    }

    if (config.maxLength && value.length > config.maxLength) {
      issues.push(`${field} must not exceed ${config.maxLength} characters`)
    }

    return issues
  }

  static validateNumericField(data: any, field: string, config: { min?: number; max?: number }): string[] {
    const issues: string[] = []
    const value = data[field]

    if (value === undefined || value === null) {
      return issues
    }

    if (typeof value !== 'number' || isNaN(value)) {
      issues.push(`${field} must be a valid number`)
      return issues
    }

    if (config.min !== undefined && value < config.min) {
      issues.push(`${field} must be at least ${config.min}`)
    }

    if (config.max !== undefined && value > config.max) {
      issues.push(`${field} must not exceed ${config.max}`)
    }

    return issues
  }

  static validateDateField(data: any, field: string, config: { start?: Date; end?: Date }): string[] {
    const issues: string[] = []
    const value = data[field]

    if (value === undefined || value === null) {
      return issues
    }

    const date = new Date(value)
    if (isNaN(date.getTime())) {
      issues.push(`${field} must be a valid date`)
      return issues
    }

    if (config.start && date < config.start) {
      issues.push(`${field} must be after ${config.start.toISOString()}`)
    }

    if (config.end && date > config.end) {
      issues.push(`${field} must be before ${config.end.toISOString()}`)
    }

    return issues
  }

  static validateEnumField(data: any, field: string, allowedValues: any[]): string[] {
    const issues: string[] = []
    const value = data[field]

    if (value === undefined || value === null) {
      return issues
    }

    if (!allowedValues.includes(value)) {
      issues.push(`${field} must be one of: ${allowedValues.join(', ')}`)
    }

    return issues
  }

  static validateArrayField(data: any, field: string, config: { minLength?: number; maxLength?: number }): string[] {
    const issues: string[] = []
    const value = data[field]

    if (value === undefined || value === null) {
      return issues
    }

    if (!Array.isArray(value)) {
      issues.push(`${field} must be an array`)
      return issues
    }

    if (config.minLength && value.length < config.minLength) {
      issues.push(`${field} must contain at least ${config.minLength} items`)
    }

    if (config.maxLength && value.length > config.maxLength) {
      issues.push(`${field} must not exceed ${config.maxLength} items`)
    }

    return issues
  }

  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  static validatePhoneNumber(phone: string): boolean {
    const phoneRegex = /^[\d\s\-\+\(\)]+$/
    return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10
  }

  static validateId(id: string): boolean {
    return typeof id === 'string' && id.length > 0 && id !== 'undefined' && id !== 'null'
  }

  static validateObject(data: any, config: ValidationConfig): ValidationResult {
    const issues: string[] = []
    const warnings: string[] = []

    issues.push(...this.validateRequiredFields(data, config.requiredFields))

    Object.keys(data).forEach(field => {
      const value = data[field]

      if (typeof value === 'string') {
        issues.push(...this.validateStringField(data, field, {
          minLength: config.minLength,
          maxLength: config.maxLength
        }))
      }

      if (typeof value === 'number') {
        issues.push(...this.validateNumericField(data, field, config.numericRange || {}))
      }

      if (value instanceof Date || (typeof value === 'string' && !isNaN(new Date(value).getTime()))) {
        issues.push(...this.validateDateField(data, field, config.dateRange || {}))
      }

      if (config.allowedValues && config.allowedValues.length > 0) {
        issues.push(...this.validateEnumField(data, field, config.allowedValues))
      }

      if (Array.isArray(value)) {
        issues.push(...this.validateArrayField(data, field, {}))
      }
    })

    if (config.customValidation) {
      warnings.push(...config.customValidation(data))
    }

    const score = this.calculateScore(issues.length, warnings.length, config.requiredFields.length)

    return {
      isValid: issues.length === 0,
      issues,
      warnings,
      score
    }
  }

  static calculateScore(issuesCount: number, warningsCount: number, totalFields: number): number {
    const maxScore = 100
    const issuePenalty = 20
    const warningPenalty = 5

    const deduction = (issuesCount * issuePenalty) + (warningsCount * warningPenalty)
    return Math.max(0, maxScore - deduction)
  }

  static validateAttendanceRecords(records: any[]): ValidationResult {
    const issues: string[] = []
    const warnings: string[] = []

    if (!Array.isArray(records)) {
      return {
        isValid: false,
        issues: ['Attendance records must be an array'],
        warnings: [],
        score: 0
      }
    }

    if (records.length === 0) {
      return {
        isValid: false,
        issues: ['No attendance records provided'],
        warnings: [],
        score: 0
      }
    }

    const requiredFields = ['id', 'studentId', 'studentName', 'date', 'status']
    const validStatuses = ['Present', 'Absent', 'Late', 'HalfDay']

    records.forEach((record, index) => {
      issues.push(...this.validateRequiredFields(record, requiredFields))

      if (record.status && !validStatuses.includes(record.status)) {
        issues.push(`Record ${index}: Invalid status '${record.status}'`)
      }

      if (record.date) {
        const date = new Date(record.date)
        if (isNaN(date.getTime())) {
          issues.push(`Record ${index}: Invalid date`)
        }
      }
    })

    const uniqueStudents = new Set(records.map(r => r.studentId))
    if (uniqueStudents.size < records.length / 2) {
      warnings.push('Low student diversity in records')
    }

    const score = this.calculateScore(issues.length, warnings.length, requiredFields.length)

    return {
      isValid: issues.length === 0,
      issues,
      warnings,
      score
    }
  }

  static validateExamResults(results: any[]): ValidationResult {
    const issues: string[] = []
    const warnings: string[] = []

    if (!Array.isArray(results)) {
      return {
        isValid: false,
        issues: ['Exam results must be an array'],
        warnings: [],
        score: 0
      }
    }

    if (results.length === 0) {
      return {
        isValid: false,
        issues: ['No exam results provided'],
        warnings: [],
        score: 0
      }
    }

    const requiredFields = ['studentId', 'subject', 'obtainedMarks', 'totalMarks']

    results.forEach((result, index) => {
      issues.push(...this.validateRequiredFields(result, requiredFields))

      issues.push(...this.validateNumericField(result, 'obtainedMarks', { min: 0 }))
      issues.push(...this.validateNumericField(result, 'totalMarks', { min: 1 }))

      if (result.obtainedMarks > result.totalMarks) {
        issues.push(`Result ${index}: Obtained marks cannot exceed total marks`)
      }

      if (result.obtainedMarks !== undefined && result.totalMarks !== undefined) {
        const percentage = (result.obtainedMarks / result.totalMarks) * 100
        if (percentage < 0 || percentage > 100) {
          issues.push(`Result ${index}: Invalid percentage calculation`)
        }
      }
    })

    const score = this.calculateScore(issues.length, warnings.length, requiredFields.length)

    return {
      isValid: issues.length === 0,
      issues,
      warnings,
      score
    }
  }

  static validateStudentData(data: any): ValidationResult {
    const issues: string[] = []
    const warnings: string[] = []

    const requiredFields = ['id', 'firstName', 'lastName', 'grade']
    issues.push(...this.validateRequiredFields(data, requiredFields))

    issues.push(...this.validateStringField(data, 'firstName', { minLength: 2, maxLength: 50 }))
    issues.push(...this.validateStringField(data, 'lastName', { minLength: 2, maxLength: 50 }))

    if (data.email && !this.validateEmail(data.email)) {
      issues.push('Invalid email format')
    }

    if (data.phone && !this.validatePhoneNumber(data.phone)) {
      issues.push('Invalid phone number format')
    }

    if (data.status && !['Active', 'Inactive', 'Graduated', 'Withdrawn'].includes(data.status)) {
      issues.push('Invalid student status')
    }

    const score = this.calculateScore(issues.length, warnings.length, requiredFields.length)

    return {
      isValid: issues.length === 0,
      issues,
      warnings,
      score
    }
  }

  static validateDashboardData(data: any): ValidationResult {
    const issues: string[] = []
    const warnings: string[] = []

    const requiredFields = ['totalStudents', 'totalTeachers', 'totalGrades']
    issues.push(...this.validateRequiredFields(data, requiredFields))

    issues.push(...this.validateNumericField(data, 'totalStudents', { min: 0 }))
    issues.push(...this.validateNumericField(data, 'totalTeachers', { min: 0 }))
    issues.push(...this.validateNumericField(data, 'totalGrades', { min: 1 }))

    if (data.attendanceRate !== undefined) {
      issues.push(...this.validateNumericField(data, 'attendanceRate', { min: 0, max: 100 }))
    }

    if (data.enrollmentTrends && !Array.isArray(data.enrollmentTrends)) {
      issues.push('Enrollment trends must be an array')
    }

    const score = this.calculateScore(issues.length, warnings.length, requiredFields.length)

    return {
      isValid: issues.length === 0,
      issues,
      warnings,
      score
    }
  }

  static validateLibraryData(data: any): ValidationResult {
    const issues: string[] = []
    const warnings: string[] = []

    if (data.books && !Array.isArray(data.books)) {
      issues.push('Books must be an array')
    }

    if (data.borrowingHistory && !Array.isArray(data.borrowingHistory)) {
      issues.push('Borrowing history must be an array')
    }

    if (data.books && Array.isArray(data.books)) {
      data.books.forEach((book: any, index: number) => {
        if (!book.id || !book.title || !book.author) {
          issues.push(`Book ${index}: Missing required fields (id, title, author)`)
        }
      })
    }

    const score = this.calculateScore(issues.length, warnings.length, 3)

    return {
      isValid: issues.length === 0,
      issues,
      warnings,
      score
    }
  }

  static validateMessageData(data: any): ValidationResult {
    const issues: string[] = []
    const warnings: string[] = []

    const requiredFields = ['senderId', 'receiverId', 'content']
    issues.push(...this.validateRequiredFields(data, requiredFields))

    issues.push(...this.validateStringField(data, 'content', { minLength: 1, maxLength: 5000 }))

    if (data.type && !['Inquiry', 'Complaint', 'Request', 'Announcement', 'General'].includes(data.type)) {
      issues.push('Invalid message type')
    }

    if (data.priority && !['Normal', 'High', 'Urgent'].includes(data.priority)) {
      issues.push('Invalid message priority')
    }

    const score = this.calculateScore(issues.length, warnings.length, requiredFields.length)

    return {
      isValid: issues.length === 0,
      issues,
      warnings,
      score
    }
  }

  static validateBatchData<T>(items: T[], validator: (item: T) => ValidationResult): ValidationResult {
    const allIssues: string[] = []
    const allWarnings: string[] = []
    let totalScore = 0

    items.forEach((item, index) => {
      const result = validator(item)
      allIssues.push(...result.issues.map(i => `[${index}] ${i}`))
      allWarnings.push(...result.warnings.map(w => `[${index}] ${w}`))
      totalScore += result.score
    })

    const avgScore = items.length > 0 ? totalScore / items.length : 0

    return {
      isValid: allIssues.length === 0,
      issues: allIssues,
      warnings: allWarnings,
      score: Math.round(avgScore)
    }
  }
}

export const validateAttendanceRecords = (records: any[]) => DataValidator.validateAttendanceRecords(records)
export const validateExamResults = (results: any[]) => DataValidator.validateExamResults(results)
export const validateStudentData = (data: any) => DataValidator.validateStudentData(data)
export const validateDashboardData = (data: any) => DataValidator.validateDashboardData(data)
export const validateLibraryData = (data: any) => DataValidator.validateLibraryData(data)
export const validateMessageData = (data: any) => DataValidator.validateMessageData(data)

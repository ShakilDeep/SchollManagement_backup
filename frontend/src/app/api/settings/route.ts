import { NextRequest, NextResponse } from 'next/server'

interface SystemSettings {
  schoolName: string
  schoolCode: string
  address: string
  phone: string
  email: string
  website: string
  academicYearId: string
  timezone: string
  dateFormat: string
  currency: string
  enableNotifications: boolean
  enableSMS: boolean
  enableEmail: boolean
  maxFileSize: number
  allowedFileTypes: string[]
  sessionTimeout: number
  passwordMinLength: number
  passwordRequireUppercase: boolean
  passwordRequireLowercase: boolean
  passwordRequireNumbers: boolean
  passwordRequireSpecialChars: boolean
  loginAttempts: number
  lockoutDuration: number
}

const defaultSettings: SystemSettings = {
  schoolName: 'School Management System',
  schoolCode: 'SMS001',
  address: '',
  phone: '',
  email: '',
  website: '',
  academicYearId: '',
  timezone: 'UTC',
  dateFormat: 'DD/MM/YYYY',
  currency: 'BDT',
  enableNotifications: true,
  enableSMS: false,
  enableEmail: true,
  maxFileSize: 5242880,
  allowedFileTypes: ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png'],
  sessionTimeout: 3600,
  passwordMinLength: 8,
  passwordRequireUppercase: true,
  passwordRequireLowercase: true,
  passwordRequireNumbers: true,
  passwordRequireSpecialChars: true,
  loginAttempts: 5,
  lockoutDuration: 900,
}

// In-memory settings storage (for demo purposes - in production, this should use the backend API)
let settingsStorage: SystemSettings | null = null

async function getSettings(): Promise<SystemSettings> {
  // Try to get from backend first
  try {
    // For now, use in-memory storage with defaults
    // In a real implementation, this would call the backend API
    return settingsStorage || defaultSettings
  } catch (error) {
    console.error('Error fetching settings:', error)
    return defaultSettings
  }
}

async function updateSettings(
  newSettings: Partial<SystemSettings>,
  userId?: string
): Promise<SystemSettings> {
  try {
    const currentSettings = await getSettings()
    const updatedSettings = { ...currentSettings, ...newSettings }
    settingsStorage = updatedSettings

    // In a real implementation, this would call the backend API to persist settings
    // and create an audit log entry

    return updatedSettings
  } catch (error) {
    console.error('Error updating settings:', error)
    throw error
  }
}

export async function GET(req: NextRequest) {
  try {
    const settings = await getSettings()
    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { userId, ...settings } = body

    const updatedSettings = await updateSettings(settings, userId)

    return NextResponse.json(updatedSettings)
  } catch (error) {
    console.error('Error updating settings:', error)
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}

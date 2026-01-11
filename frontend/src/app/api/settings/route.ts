import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

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

async function getSettings(): Promise<SystemSettings> {
  try {
    const settingsKey = 'system_settings'
    const setting = await db.systemSettings.findUnique({
      where: { key: settingsKey },
    })

    if (setting) {
      return JSON.parse(setting.value) as SystemSettings
    }

    return defaultSettings
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
    const settingsKey = 'system_settings'
    const currentSettings = await getSettings()
    const updatedSettings = { ...currentSettings, ...newSettings }

    const setting = await db.systemSettings.upsert({
      where: { key: settingsKey },
      update: { value: JSON.stringify(updatedSettings) },
      create: {
        key: settingsKey,
        value: JSON.stringify(updatedSettings),
      },
    })

    await db.auditLog.create({
      data: {
        userId,
        action: 'UPDATE',
        entity: 'Settings',
        details: JSON.stringify({ updatedSettings }),
      },
    })

    return JSON.parse(setting.value) as SystemSettings
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

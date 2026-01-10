'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Save,
  RefreshCw,
  School,
  Bell,
  Shield,
  Lock,
  Upload,
  FileText,
  Clock
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'

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

export default function SettingsPage() {
  const [settings, setSettings] = useState<SystemSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [academicYears, setAcademicYears] = useState<any[]>([])

  useEffect(() => {
    fetchSettings()
    fetchAcademicYears()
  }, [])

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings')
      if (!res.ok) throw new Error('Failed to fetch settings')
      const data = await res.json()
      setSettings(data)
    } catch (error) {
      console.error(error)
      toast({ title: 'Error', description: 'Failed to load settings', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const fetchAcademicYears = async () => {
    try {
      const res = await fetch('/api/academic-years')
      if (!res.ok) return
      const data = await res.json()
      setAcademicYears(data)
    } catch (error) {
      console.error(error)
    }
  }

  const handleSave = async (updatedSettings: Partial<SystemSettings>) => {
    if (!settings) return
    
    setSaving(true)
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedSettings),
      })

      if (!res.ok) throw new Error('Failed to save settings')

      const data = await res.json()
      setSettings(data)
      toast({ title: 'Success', description: 'Settings saved successfully' })
    } catch (error) {
      console.error(error)
      toast({ title: 'Error', description: 'Failed to save settings', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const updateSetting = (key: keyof SystemSettings, value: any) => {
    if (!settings) return
    const updatedSettings = { ...settings, [key]: value }
    setSettings(updatedSettings)
    handleSave({ [key]: value })
  }

  if (loading || !settings) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">System Settings</h1>
            <p className="text-muted-foreground">Configure your school management system</p>
          </div>
          <Button onClick={fetchSettings} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        <Tabs defaultValue="general" className="space-y-4">
          <TabsList>
            <TabsTrigger value="general">
              <School className="h-4 w-4 mr-2" />
              General
            </TabsTrigger>
            <TabsTrigger value="notifications">
              <Bell className="h-4 w-4 mr-2" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="security">
              <Shield className="h-4 w-4 mr-2" />
              Security
            </TabsTrigger>
            <TabsTrigger value="files">
              <Upload className="h-4 w-4 mr-2" />
              Files
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
                <CardDescription>Basic school information and configuration</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="schoolName">School Name</Label>
                    <Input
                      id="schoolName"
                      value={settings.schoolName}
                      onChange={(e) => updateSetting('schoolName', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="schoolCode">School Code</Label>
                    <Input
                      id="schoolCode"
                      value={settings.schoolCode}
                      onChange={(e) => updateSetting('schoolCode', e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    value={settings.address}
                    onChange={(e) => updateSetting('address', e.target.value)}
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={settings.phone}
                      onChange={(e) => updateSetting('phone', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={settings.email}
                      onChange={(e) => updateSetting('email', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      value={settings.website}
                      onChange={(e) => updateSetting('website', e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="academicYear">Current Academic Year</Label>
                    <Select
                      value={settings.academicYearId}
                      onValueChange={(value) => updateSetting('academicYearId', value)}
                    >
                      <SelectTrigger id="academicYear">
                        <SelectValue placeholder="Select academic year" />
                      </SelectTrigger>
                      <SelectContent>
                        {academicYears.map((year) => (
                          <SelectItem key={year.id} value={year.id}>
                            {year.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select
                      value={settings.timezone}
                      onValueChange={(value) => updateSetting('timezone', value)}
                    >
                      <SelectTrigger id="timezone">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UTC">UTC</SelectItem>
                        <SelectItem value="America/New_York">Eastern Time</SelectItem>
                        <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                        <SelectItem value="Europe/London">London</SelectItem>
                        <SelectItem value="Asia/Kolkata">India</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency</Label>
                    <Select
                      value={settings.currency}
                      onValueChange={(value) => updateSetting('currency', value)}
                    >
                      <SelectTrigger id="currency">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="EUR">EUR (€)</SelectItem>
                        <SelectItem value="GBP">GBP (£)</SelectItem>
                        <SelectItem value="INR">INR (₹)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
                <CardDescription>Configure system notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Enable Notifications</Label>
                    <p className="text-sm text-muted-foreground">Send notifications to users</p>
                  </div>
                  <Switch
                    checked={settings.enableNotifications}
                    onCheckedChange={(checked) => updateSetting('enableNotifications', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Enable SMS Notifications</Label>
                    <p className="text-sm text-muted-foreground">Send SMS alerts</p>
                  </div>
                  <Switch
                    checked={settings.enableSMS}
                    onCheckedChange={(checked) => updateSetting('enableSMS', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Enable Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">Send email alerts</p>
                  </div>
                  <Switch
                    checked={settings.enableEmail}
                    onCheckedChange={(checked) => updateSetting('enableEmail', checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>Configure security policies</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-medium mb-4 flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    Session Settings
                  </h4>
                  <div className="space-y-2">
                    <Label htmlFor="sessionTimeout">Session Timeout (seconds)</Label>
                    <Input
                      id="sessionTimeout"
                      type="number"
                      value={settings.sessionTimeout}
                      onChange={(e) => updateSetting('sessionTimeout', parseInt(e.target.value))}
                    />
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-4 flex items-center">
                    <Lock className="h-4 w-4 mr-2" />
                    Password Policy
                  </h4>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="passwordMinLength">Minimum Password Length</Label>
                      <Input
                        id="passwordMinLength"
                        type="number"
                        min="6"
                        max="20"
                        value={settings.passwordMinLength}
                        onChange={(e) => updateSetting('passwordMinLength', parseInt(e.target.value))}
                      />
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>Require Uppercase</Label>
                        <Switch
                          checked={settings.passwordRequireUppercase}
                          onCheckedChange={(checked) => updateSetting('passwordRequireUppercase', checked)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>Require Lowercase</Label>
                        <Switch
                          checked={settings.passwordRequireLowercase}
                          onCheckedChange={(checked) => updateSetting('passwordRequireLowercase', checked)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>Require Numbers</Label>
                        <Switch
                          checked={settings.passwordRequireNumbers}
                          onCheckedChange={(checked) => updateSetting('passwordRequireNumbers', checked)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>Require Special Characters</Label>
                        <Switch
                          checked={settings.passwordRequireSpecialChars}
                          onCheckedChange={(checked) => updateSetting('passwordRequireSpecialChars', checked)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-4">Login Attempts</h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="loginAttempts">Max Login Attempts</Label>
                      <Input
                        id="loginAttempts"
                        type="number"
                        min="3"
                        max="10"
                        value={settings.loginAttempts}
                        onChange={(e) => updateSetting('loginAttempts', parseInt(e.target.value))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lockoutDuration">Lockout Duration (seconds)</Label>
                      <Input
                        id="lockoutDuration"
                        type="number"
                        min="60"
                        max="3600"
                        value={settings.lockoutDuration}
                        onChange={(e) => updateSetting('lockoutDuration', parseInt(e.target.value))}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="files">
            <Card>
              <CardHeader>
                <CardTitle>File Settings</CardTitle>
                <CardDescription>Configure file upload settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="maxFileSize">Maximum File Size (bytes)</Label>
                  <Input
                    id="maxFileSize"
                    type="number"
                    value={settings.maxFileSize}
                    onChange={(e) => updateSetting('maxFileSize', parseInt(e.target.value))}
                  />
                  <p className="text-sm text-muted-foreground">
                    Current: {(settings.maxFileSize / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Allowed File Types</Label>
                  <div className="flex flex-wrap gap-2">
                    {settings.allowedFileTypes.map((type) => (
                      <span
                        key={type}
                        className="px-3 py-1 bg-secondary rounded-full text-sm font-medium"
                      >
                        {type.toUpperCase()}
                      </span>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}

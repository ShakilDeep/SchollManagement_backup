import ComingSoonPage from '@/components/coming-soon-page'
import { Settings } from 'lucide-react'

export default function SettingsPage() {
  return (
    <ComingSoonPage
      title="System Settings"
      description="Configure system settings, preferences, and customizations"
      icon={<Settings className="h-12 w-12 text-primary" />}
    />
  )
}

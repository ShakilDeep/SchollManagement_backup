import ComingSoonPage from '@/components/coming-soon-page'
import { Shield } from 'lucide-react'

export default function SecurityPage() {
  return (
    <ComingSoonPage
      title="Security & Privacy"
      description="Manage security settings, user permissions, and data privacy controls"
      icon={<Shield className="h-12 w-12 text-primary" />}
    />
  )
}

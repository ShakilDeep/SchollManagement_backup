import ComingSoonPage from '@/components/coming-soon-page'
import { BarChart3 } from 'lucide-react'

export default function AnalyticsPage() {
  return (
    <ComingSoonPage
      title="Analytics & Reporting"
      description="Comprehensive analytics dashboard with detailed reports and insights"
      icon={<BarChart3 className="h-12 w-12 text-primary" />}
    />
  )
}

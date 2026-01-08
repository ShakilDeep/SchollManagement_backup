import ComingSoonPage from '@/components/coming-soon-page'
import { GraduationCap } from 'lucide-react'

export default function BehaviorPage() {
  return (
    <ComingSoonPage
      title="Discipline & Behavior Tracking"
      description="Track student behavior, disciplinary actions, and achievements"
      icon={<GraduationCap className="h-12 w-12 text-primary" />}
    />
  )
}

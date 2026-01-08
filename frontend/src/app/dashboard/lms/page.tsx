import ComingSoonPage from '@/components/coming-soon-page'
import { BookOpen } from 'lucide-react'

export default function LMSPage() {
  return (
    <ComingSoonPage
      title="Learning Management System (LMS)"
      description="Online learning platform with courses, lessons, and assessments"
      icon={<BookOpen className="h-12 w-12 text-primary" />}
    />
  )
}

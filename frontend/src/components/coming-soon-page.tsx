'use client'

import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertCircle, Wrench } from 'lucide-react'

interface ComingSoonPageProps {
  title: string
  description: string
  icon?: React.ReactNode
}

export default function ComingSoonPage({ title, description, icon }: ComingSoonPageProps) {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          <p className="text-muted-foreground mt-1">
            {description}
          </p>
        </div>

        {/* Coming Soon Card */}
        <Card className="max-w-2xl mx-auto">
          <CardContent className="flex flex-col items-center justify-center py-16 px-6">
            <div className="p-4 rounded-full bg-primary/10 mb-6">
              {icon || <Wrench className="h-12 w-12 text-primary" />}
            </div>
            <h2 className="text-2xl font-bold mb-2">Coming Soon</h2>
            <p className="text-muted-foreground text-center mb-6">
              This module is currently under development. We're working hard to bring you this feature soon.
            </p>
            <div className="flex gap-4">
              <Button variant="outline">Contact Support</Button>
              <Button>Back to Dashboard</Button>
            </div>
          </CardContent>
        </Card>

        {/* Feature Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              What to Expect
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">Comprehensive Management</h3>
                <p className="text-sm text-muted-foreground">
                  Full-featured tools to manage all aspects of this module with ease and efficiency.
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">Real-time Updates</h3>
                <p className="text-sm text-muted-foreground">
                  Get instant notifications and real-time updates for all activities and changes.
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">Advanced Reporting</h3>
                <p className="text-sm text-muted-foreground">
                  Generate detailed reports and analytics to track performance and trends.
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">Seamless Integration</h3>
                <p className="text-sm text-muted-foreground">
                  Perfect integration with other modules for a unified school management experience.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

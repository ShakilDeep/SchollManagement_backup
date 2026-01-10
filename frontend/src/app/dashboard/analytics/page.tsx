'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
  BarChart3,
  Users,
  GraduationCap,
  TrendingUp,
  TrendingDown,
  Book,
  Truck,
  Package,
  RefreshCw,
  Calendar,
  Activity,
  AlertCircle,
  CheckCircle
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface AnalyticsData {
  overview?: any
  students?: any
  academics?: any
  behavior?: any
  library?: any
  transport?: any
  inventory?: any
}

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<AnalyticsData>({})
  const [academicYears, setAcademicYears] = useState<any[]>([])
  const [selectedYear, setSelectedYear] = useState<string>('')
  const [selectedSection, setSelectedSection] = useState<string>('')

  useEffect(() => {
    fetchAllData()
    fetchAcademicYears()
  }, [selectedYear, selectedSection])

  const fetchAllData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (selectedYear) params.append('academicYearId', selectedYear)
      if (selectedSection) params.append('sectionId', selectedSection)

      const [overview, students, academics, behavior, library, transport, inventory] = await Promise.all([
        fetch(`/api/analytics?type=overview&${params}`).then(r => r.json()),
        fetch(`/api/analytics?type=students&${params}`).then(r => r.json()),
        fetch(`/api/analytics?type=academics&${params}`).then(r => r.json()),
        fetch(`/api/analytics?type=behavior&${params}`).then(r => r.json()),
        fetch(`/api/analytics?type=library&${params}`).then(r => r.json()),
        fetch(`/api/analytics?type=transport&${params}`).then(r => r.json()),
        fetch(`/api/analytics?type=inventory&${params}`).then(r => r.json()),
      ])

      setData({ overview, students, academics, behavior, library, transport, inventory })
    } catch (error) {
      console.error(error)
      toast({ title: 'Error', description: 'Failed to load analytics data', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const fetchAcademicYears = async () => {
    try {
      const res = await fetch('/api/academic-years')
      if (!res.ok) return
      const years = await res.json()
      setAcademicYears(years)
      const current = years.find((y: any) => y.isCurrent)
      if (current) setSelectedYear(current.id)
    } catch (error) {
      console.error(error)
    }
  }

  const getAttendanceRate = (rate: number) => {
    if (rate >= 0.9) return { label: 'Excellent', color: 'text-green-500' }
    if (rate >= 0.75) return { label: 'Good', color: 'text-yellow-500' }
    return { label: 'Needs Attention', color: 'text-red-500' }
  }

  if (loading) {
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
            <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
            <p className="text-muted-foreground">Comprehensive school performance analytics</p>
          </div>
          <div className="flex gap-2">
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Academic Year" />
              </SelectTrigger>
              <SelectContent>
                {academicYears.map((year) => (
                  <SelectItem key={year.id} value={year.id}>
                    {year.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={fetchAllData}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">
              <BarChart3 className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="students">
              <Users className="h-4 w-4 mr-2" />
              Students
            </TabsTrigger>
            <TabsTrigger value="academics">
              <GraduationCap className="h-4 w-4 mr-2" />
              Academics
            </TabsTrigger>
            <TabsTrigger value="behavior">
              <Activity className="h-4 w-4 mr-2" />
              Behavior
            </TabsTrigger>
            <TabsTrigger value="library">
              <Book className="h-4 w-4 mr-2" />
              Library
            </TabsTrigger>
            <TabsTrigger value="transport">
              <Truck className="h-4 w-4 mr-2" />
              Transport
            </TabsTrigger>
            <TabsTrigger value="inventory">
              <Package className="h-4 w-4 mr-2" />
              Inventory
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{data.overview?.studentCount || 0}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Teachers</CardTitle>
                  <GraduationCap className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{data.overview?.teacherCount || 0}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Staff</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{data.overview?.staffCount || 0}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${getAttendanceRate(data.overview?.attendanceRate || 0).color}`}>
                    {((data.overview?.attendanceRate || 0) * 100).toFixed(1)}%
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Behavior Records Summary</CardTitle>
                <CardDescription>Positive and negative behavior incidents</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {data.overview?.behaviorRecords?.map((record: any) => (
                    <div key={record.type} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {record.type === 'POSITIVE' ? (
                          <TrendingUp className="h-5 w-5 text-green-500" />
                        ) : (
                          <TrendingDown className="h-5 w-5 text-red-500" />
                        )}
                        <span className="font-medium">{record.type}</span>
                      </div>
                      <Badge variant={record.type === 'POSITIVE' ? 'default' : 'destructive'}>
                        {record._count}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="students">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle>Students by Grade</CardTitle>
                  <CardDescription>Distribution across grades</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {data.students?.studentsByGrade?.map((grade: any) => (
                      <div key={grade.gradeId} className="flex items-center justify-between">
                        <span>{grade.grade?.name || 'Unknown'}</span>
                        <Badge>{grade._count}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Students by Section</CardTitle>
                  <CardDescription>Distribution across sections</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {data.students?.studentsBySection?.map((section: any) => (
                      <div key={section.sectionId} className="flex items-center justify-between">
                        <span>{section.section?.name || 'Unknown'}</span>
                        <Badge>{section._count}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Attendance Summary</CardTitle>
                  <CardDescription>Present vs Absent</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Present
                      </span>
                      <Badge className="bg-green-500">{data.students?.presentCount || 0}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-red-500" />
                        Absent
                      </span>
                      <Badge variant="destructive">{data.students?.absentCount || 0}</Badge>
                    </div>
                    <div className="pt-4 border-t">
                      <div className="text-sm text-muted-foreground mb-1">Overall Rate</div>
                      <div className="text-2xl font-bold">
                        {((data.students?.attendanceRate || 0) * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="academics">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Exam Performance</CardTitle>
                  <CardDescription>Average scores across exams</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {data.academics?.examResults?.map((exam: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded">
                        <span>Exam {index + 1}</span>
                        <div className="text-right">
                          <div className="font-medium">
                            {((exam._avg.obtainedMarks / exam._avg.totalMarks) * 100).toFixed(1)}%
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {exam._avg.obtainedMarks.toFixed(1)}/{exam._avg.totalMarks.toFixed(1)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Subject Performance</CardTitle>
                  <CardDescription>Average scores by subject</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {data.academics?.subjectPerformance?.map((subject: any) => (
                      <div key={subject.subjectId} className="flex items-center justify-between p-3 border rounded">
                        <span>{subject.subject?.name || 'Unknown'}</span>
                        <div className="text-right">
                          <div className="font-medium">
                            {((subject._avg.obtainedMarks / subject._avg.totalMarks) * 100).toFixed(1)}%
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {subject._avg.obtainedMarks.toFixed(1)}/{subject._avg.totalMarks.toFixed(1)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Overall Academic Performance</CardTitle>
                <CardDescription>School-wide academic metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-4xl font-bold">
                    {(data.academics?.averagePerformance || 0).toFixed(1)}%
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">Average performance across all subjects</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="behavior">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Behavior by Type</CardTitle>
                  <CardDescription>Positive vs Negative incidents</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {data.behavior?.behaviorByType?.map((type: any) => (
                      <div key={type.type} className="flex items-center justify-between p-3 border rounded">
                        <div className="flex items-center gap-2">
                          {type.type === 'POSITIVE' ? (
                            <TrendingUp className="h-4 w-4 text-green-500" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-red-500" />
                          )}
                          <span>{type.type}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={type.type === 'POSITIVE' ? 'default' : 'destructive'}>
                            {type._count}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {type._sum.points || 0} pts
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Behavior by Category</CardTitle>
                  <CardDescription>Incidents by category</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {data.behavior?.behaviorByCategory?.map((category: any) => (
                      <div key={category.category} className="flex items-center justify-between p-3 border rounded">
                        <span>{category.category}</span>
                        <Badge>{category._count}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Recent Behavior Incidents</CardTitle>
                <CardDescription>Latest behavior records</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.behavior?.recentIncidents?.map((incident: any) => (
                    <div key={incident.id} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center gap-3">
                        {incident.type === 'POSITIVE' ? (
                          <TrendingUp className="h-4 w-4 text-green-500" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-500" />
                        )}
                        <div>
                          <p className="font-medium">{incident.Student?.name || 'Unknown'}</p>
                          <p className="text-sm text-muted-foreground">{incident.category}</p>
                        </div>
                      </div>
                      <Badge variant={incident.type === 'POSITIVE' ? 'default' : 'destructive'}>
                        {incident.points > 0 ? '+' : ''}{incident.points}
                      </Badge>
                    </div>
                  ))}
                  {(!data.behavior?.recentIncidents || data.behavior.recentIncidents.length === 0) && (
                    <p className="text-center text-muted-foreground py-8">No recent incidents</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="library">
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Books</CardTitle>
                  <Book className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{data.library?.totalBooks || 0}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Borrowed</CardTitle>
                  <Activity className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{data.library?.borrowedBooks || 0}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Overdue</CardTitle>
                  <AlertCircle className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-500">{data.library?.overdueBooks || 0}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Popular</CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{data.library?.popularBooks?.length || 0}</div>
                  <p className="text-xs text-muted-foreground">Top books</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="transport">
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Vehicles</CardTitle>
                  <Truck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{data.transport?.totalVehicles || 0}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Allocations</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{data.transport?.activeAllocations || 0}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Route Statistics</CardTitle>
                  <CardDescription>Students per route</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {data.transport?.routeStats?.map((route: any, index: number) => (
                      <div key={index} className="flex items-center justify-between">
                        <span>Route {index + 1}</span>
                        <Badge>{route._count}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="inventory">
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{data.inventory?.totalAssets || 0}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Assets by Category</CardTitle>
                  <CardDescription>Distribution</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {data.inventory?.assetByCategory?.map((cat: any) => (
                      <div key={cat.category} className="flex items-center justify-between">
                        <span>{cat.category}</span>
                        <Badge>{cat._count}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Assets by Status</CardTitle>
                  <CardDescription>Current status</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {data.inventory?.assetByStatus?.map((status: any) => (
                      <div key={status.status} className="flex items-center justify-between">
                        <span>{status.status}</span>
                        <Badge
                          variant={
                            status.status === 'Available' ? 'default' :
                            status.status === 'InUse' ? 'secondary' :
                            status.status === 'Maintenance' ? 'warning' :
                            'destructive'
                          }
                        >
                          {status._count}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}

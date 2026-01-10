'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { AddBehaviorDialog } from './components/add-behavior-dialog'
import {
  Search,
  Plus,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Filter,
  User,
  Calendar,
  Award,
  AlertCircle
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { formatDistanceToNow } from 'date-fns'

interface BehaviorRecord {
  id: string
  type: 'POSITIVE' | 'NEGATIVE'
  category: string
  description: string
  points: number
  date: string
  actionTaken?: string
  parentNotified: boolean
  Student: {
    id: string
    firstName: string
    lastName: string
    rollNumber: string
    grade: { id: string; name: string }
    section: { id: string; name: string }
  }
  User: {
    id: string
    name: string
    email: string
  }
}

interface Student {
  id: string
  firstName: string
  lastName: string
  rollNumber: string
}

export default function BehaviorPage() {
  const [records, setRecords] = useState<BehaviorRecord[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)

  useEffect(() => {
    fetchData()
  }, [searchTerm, typeFilter, categoryFilter])

  const fetchData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (searchTerm) params.append('studentId', searchTerm)
      if (typeFilter !== 'all') params.append('type', typeFilter)
      if (categoryFilter !== 'all') params.append('category', categoryFilter)

      const [recordsRes, studentsRes] = await Promise.all([
        fetch(`/api/behavior?${params}`),
        fetch('/api/students'),
      ])

      if (!recordsRes.ok || !studentsRes.ok) throw new Error('Failed to fetch data')

      const [recordsData, studentsData] = await Promise.all([recordsRes.json(), studentsRes.json()])
      setRecords(recordsData)
      setStudents(studentsData)
    } catch (error) {
      console.error(error)
      toast({ title: 'Error', description: 'Failed to load data', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const stats = {
    total: records.length,
    positive: records.filter(r => r.type === 'POSITIVE').length,
    negative: records.filter(r => r.type === 'NEGATIVE').length,
    totalPoints: records.reduce((acc, r) => acc + r.points, 0),
  }

  const categories = [...new Set(records.map(r => r.category))]

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Behavior Records</h1>
            <p className="text-muted-foreground">Track and manage student behavior</p>
          </div>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Record
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Records</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Positive</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">{stats.positive}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Negative</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">{stats.negative}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Points</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalPoints}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Behavior Records</CardTitle>
                <CardDescription>All behavior records across the school</CardDescription>
              </div>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by roll number..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 w-64"
                  />
                </div>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="POSITIVE">Positive</SelectItem>
                    <SelectItem value="NEGATIVE">Negative</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" size="icon" onClick={fetchData}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : records.length === 0 ? (
              <div className="text-center py-12">
                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No behavior records found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {records.map((record) => (
                  <div key={record.id} className="flex items-start justify-between border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-start gap-4">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                        record.type === 'POSITIVE' ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        {record.type === 'POSITIVE' ? (
                          <TrendingUp className="h-5 w-5 text-green-500" />
                        ) : (
                          <TrendingDown className="h-5 w-5 text-red-500" />
                        )}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{record.Student.firstName} {record.Student.lastName}</p>
                          <span className="text-sm text-muted-foreground">({record.Student.rollNumber})</span>
                          <Badge variant={record.type === 'POSITIVE' ? 'default' : 'destructive'}>
                            {record.type}
                          </Badge>
                          <Badge variant="outline">{record.category}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {record.Student.grade.name} - {record.Student.section.name}
                        </p>
                        <p className="text-sm">{record.description}</p>
                        {record.actionTaken && (
                          <p className="text-sm text-muted-foreground">
                            <span className="font-medium">Action:</span> {record.actionTaken}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {record.User.name}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDistanceToNow(new Date(record.date), { addSuffix: true })}
                          </span>
                          {record.parentNotified && (
                            <span className="flex items-center gap-1 text-blue-500">
                              <CheckCircle className="h-3 w-3" />
                              Parent Notified
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-2xl font-bold ${record.points >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {record.points > 0 ? '+' : ''}{record.points}
                      </div>
                      <p className="text-xs text-muted-foreground">points</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <AddBehaviorDialog
          open={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
          students={students}
          onSuccess={fetchData}
        />
      </div>
    </DashboardLayout>
  )
}

'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Plus,
  Search,
  MoreVertical,
  Building2,
  Users,
  Bed,
  MapPin,
  Phone,
  AlertCircle,
  CheckCircle2,
  User,
  Calendar,
  CreditCard,
  Home,
  Layers,
  Activity,
  TrendingUp,
  Bell,
  Edit,
  Trash2,
  Eye,
  LogOut
} from 'lucide-react'

interface Hostel {
  id: string
  name: string
  type: 'Boys' | 'Girls' | 'Staff'
  capacity: number
  currentOccupancy: number
  wardenName?: string
  wardenPhone?: string
  address?: string
  rooms?: Room[]
}

interface Room {
  id: string
  hostelId: string
  roomNumber: string
  floor: number
  capacity: number
  currentOccupancy: number
  type?: string
  hostel?: Hostel
  allocations?: Allocation[]
}

interface Allocation {
  id: string
  hostelId: string
  roomId: string
  studentId: string
  academicYearId: string
  allocationDate: string
  checkoutDate?: string
  fees?: number
  status: 'Active' | 'CheckedOut'
  hostel?: Hostel
  room?: Room
  student?: {
    id: string
    firstName: string
    lastName: string
    rollNumber: string
    gradeId: string
  }
}

interface HostelStats {
  totalHostels: number
  totalRooms: number
  totalCapacity: number
  currentOccupancy: number
  occupancyRate: number
  totalStudents: number
  maleStudents: number
  femaleStudents: number
  monthlyRevenue: number
  availableRooms: number
  pendingFees: number
}

export default function HostelPage() {
  const [hostels, setHostels] = useState<Hostel[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [allocations, setAllocations] = useState<Allocation[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | 'Boys' | 'Girls' | 'Staff'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'Active' | 'CheckedOut'>('all')
  const [selectedHostel, setSelectedHostel] = useState<Hostel | null>(null)
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)
  const [selectedAllocation, setSelectedAllocation] = useState<Allocation | null>(null)
  const [isAddHostelOpen, setIsAddHostelOpen] = useState(false)
  const [isAddRoomOpen, setIsAddRoomOpen] = useState(false)
  const [isAddAllocationOpen, setIsAddAllocationOpen] = useState(false)
  const [isViewDetailsOpen, setIsViewDetailsOpen] = useState(false)
  const [isCheckoutDialogOpen, setIsCheckoutDialogOpen] = useState(false)
  const [stats, setStats] = useState<HostelStats>({
    totalHostels: 0,
    totalRooms: 0,
    totalCapacity: 0,
    currentOccupancy: 0,
    occupancyRate: 0,
    totalStudents: 0,
    maleStudents: 0,
    femaleStudents: 0,
    monthlyRevenue: 0,
    availableRooms: 0,
    pendingFees: 0,
  })
  const [loading, setLoading] = useState(true)

  const fetchHostels = useCallback(async () => {
    try {
      const response = await fetch('/api/hostels')
      const data = await response.json()
      setHostels(data)
    } catch (error) {
      console.error('Error fetching hostels:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchRooms = useCallback(async () => {
    try {
      const response = await fetch('/api/hostels/rooms')
      const data = await response.json()
      setRooms(data)
    } catch (error) {
      console.error('Error fetching rooms:', error)
    }
  }, [])

  const fetchAllocations = useCallback(async () => {
    try {
      const response = await fetch('/api/hostels/allocations')
      const data = await response.json()
      setAllocations(data)
    } catch (error) {
      console.error('Error fetching allocations:', error)
    }
  }, [])

  useEffect(() => {
    fetchHostels()
    fetchRooms()
    fetchAllocations()
  }, [fetchHostels, fetchRooms, fetchAllocations])

  const calculateStats = useCallback(() => {
    const totalHostels = hostels.length
    const totalRooms = rooms.length
    const totalCapacity = hostels.reduce((acc, h) => acc + h.capacity, 0)
    const currentOccupancy = hostels.reduce((acc, h) => acc + h.currentOccupancy, 0)
    const occupancyRate = totalCapacity > 0 ? Math.round((currentOccupancy / totalCapacity) * 100) : 0
    const totalStudents = allocations.filter(a => a.status === 'Active').length
    const maleStudents = allocations.filter(a => a.status === 'Active' && a.hostel?.type === 'BOYS').length
    const femaleStudents = allocations.filter(a => a.status === 'Active' && a.hostel?.type === 'GIRLS').length
    const monthlyRevenue = allocations.reduce((acc, a) => acc + (a.fees || 0), 0)
    const availableRooms = rooms.filter(r => r.currentOccupancy < r.capacity).length
    const pendingFees = allocations.filter(a => !a.fees && a.status === 'Active').length

    return {
      totalHostels,
      totalRooms,
      totalCapacity,
      currentOccupancy,
      occupancyRate,
      totalStudents,
      maleStudents,
      femaleStudents,
      monthlyRevenue,
      availableRooms,
      pendingFees,
    }
  }, [hostels, rooms, allocations])

  useEffect(() => {
    const calculatedStats = calculateStats()
    setStats(calculatedStats)
  }, [calculateStats])

  const handleAddHostel = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const data = {
      name: formData.get('name') as string,
      type: formData.get('type') as string,
      capacity: formData.get('capacity') as string,
      wardenName: formData.get('wardenName') as string,
      wardenPhone: formData.get('wardenPhone') as string,
      address: formData.get('address') as string,
    }

    try {
      await fetch('/api/hostels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      setIsAddHostelOpen(false)
      await fetchHostels()
    } catch (error) {
      console.error('Error adding hostel:', error)
    }
  }, [fetchHostels])

  const handleAddRoom = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const data = {
      hostelId: formData.get('hostelId') as string,
      roomNumber: formData.get('roomNumber') as string,
      floor: formData.get('floor') as string,
      capacity: formData.get('capacity') as string,
      type: formData.get('type') as string,
      facilities: formData.get('facilities') as string,
    }

    try {
      await fetch('/api/hostels/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      setIsAddRoomOpen(false)
      await fetchRooms()
      await fetchHostels()
    } catch (error) {
      console.error('Error adding room:', error)
    }
  }, [fetchRooms, fetchHostels])

  const handleAddAllocation = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const data = {
      hostelId: formData.get('hostelId') as string,
      roomId: formData.get('roomId') as string,
      studentId: formData.get('studentId') as string,
      academicYearId: formData.get('academicYearId') as string,
      fees: formData.get('fees') as string,
    }

    try {
      await fetch('/api/hostels/allocations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      setIsAddAllocationOpen(false)
      await fetchAllocations()
      await fetchRooms()
      await fetchHostels()
    } catch (error) {
      console.error('Error adding allocation:', error)
    }
  }, [fetchAllocations, fetchRooms, fetchHostels])

  const handleCheckout = useCallback(async (allocationId: string) => {
    try {
      const allocation = allocations.find(a => a.id === allocationId)
      if (!allocation) return

      await fetch(`/api/hostels/allocations/${allocationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CheckedOut', checkoutDate: new Date() }),
      })

      setIsCheckoutDialogOpen(false)
      await fetchAllocations()
      await fetchRooms()
      await fetchHostels()
    } catch (error) {
      console.error('Error checking out student:', error)
    }
  }, [allocations, fetchAllocations, fetchRooms, fetchHostels])

  const filteredRooms = useMemo(() => rooms.filter(room => {
    const matchesSearch = room.roomNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         room.hostel?.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = typeFilter === 'all' || room.hostel?.type === typeFilter
    return matchesSearch && matchesType
  }), [rooms, searchTerm, typeFilter])

  const filteredAllocations = useMemo(() => allocations.filter(allocation => {
    const matchesSearch = allocation.student?.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         allocation.student?.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         allocation.student?.rollNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         allocation.room?.roomNumber.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || allocation.status === statusFilter
    return matchesSearch && matchesStatus
  }), [allocations, searchTerm, statusFilter])

  const getOccupancyColor = useCallback((current: number, total: number) => {
    const percentage = (current / total) * 100
    if (percentage >= 90) return 'bg-red-500'
    if (percentage >= 70) return 'bg-amber-500'
    return 'bg-emerald-500'
  }, [])

  const getHostelTypeColor = useCallback((type: string) => {
    switch (type) {
      case 'Boys': return 'from-blue-500 to-blue-600'
      case 'Girls': return 'from-pink-500 to-pink-600'
      case 'Staff': return 'from-purple-500 to-purple-600'
      default: return 'from-slate-500 to-slate-600'
    }
  }, [])

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4 animate-pulse" />
            <p className="text-muted-foreground">Loading hostel data...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">Hostel Management</h1>
            <p className="text-muted-foreground">Dormitory accommodation and student allocation system</p>
          </div>
          <div className="flex gap-2">
            <Dialog open={isAddHostelOpen} onOpenChange={setIsAddHostelOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Hostel
                </Button>
              </DialogTrigger>
              <DialogContent showCloseButton={false}>
                <DialogHeader>
                  <DialogTitle>Add New Hostel</DialogTitle>
                  <DialogDescription>Create a new hostel building</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddHostel} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Hostel Name</Label>
                    <Input id="name" name="name" placeholder="Main Building" required />
                  </div>
                  <div>
                    <Label htmlFor="type">Type</Label>
                    <Select name="type" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Boys">Boys</SelectItem>
                        <SelectItem value="Girls">Girls</SelectItem>
                        <SelectItem value="Staff">Staff</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="capacity">Total Capacity</Label>
                    <Input id="capacity" name="capacity" type="number" placeholder="100" required />
                  </div>
                  <div>
                    <Label htmlFor="wardenName">Warden Name</Label>
                    <Input id="wardenName" name="wardenName" placeholder="John Doe" />
                  </div>
                  <div>
                    <Label htmlFor="wardenPhone">Warden Phone</Label>
                    <Input id="wardenPhone" name="wardenPhone" placeholder="+91 9876543210" />
                  </div>
                  <div>
                    <Label htmlFor="address">Address</Label>
                    <Textarea id="address" name="address" placeholder="Campus Building 1" />
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsAddHostelOpen(false)}>
                      Close
                    </Button>
                    <Button type="submit">Create Hostel</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
            <Dialog open={isAddRoomOpen} onOpenChange={setIsAddRoomOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Room
                </Button>
              </DialogTrigger>
              <DialogContent showCloseButton={false}>
                <DialogHeader>
                  <DialogTitle>Add New Room</DialogTitle>
                  <DialogDescription>Create a new room in a hostel</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddRoom} className="space-y-4">
                  <div>
                    <Label htmlFor="hostelId">Hostel</Label>
                    <Select name="hostelId" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select hostel" />
                      </SelectTrigger>
                      <SelectContent>
                        {hostels.map(hostel => (
                          <SelectItem key={hostel.id} value={hostel.id}>{hostel.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="roomNumber">Room Number</Label>
                    <Input id="roomNumber" name="roomNumber" placeholder="101" required />
                  </div>
                  <div>
                    <Label htmlFor="floor">Floor</Label>
                    <Input id="floor" name="floor" type="number" placeholder="1" required />
                  </div>
                  <div>
                    <Label htmlFor="capacity">Capacity</Label>
                    <Input id="capacity" name="capacity" type="number" placeholder="4" required />
                  </div>
                  <div>
                    <Label htmlFor="type">Room Type</Label>
                    <Select name="type">
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Single">Single</SelectItem>
                        <SelectItem value="Double">Double</SelectItem>
                        <SelectItem value="Triple">Triple</SelectItem>
                        <SelectItem value="Dormitory">Dormitory</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="facilities">Facilities</Label>
                    <Textarea id="facilities" name="facilities" placeholder="AC, Bathroom, Study Table" />
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsAddRoomOpen(false)}>
                      Close
                    </Button>
                    <Button type="submit">Create Room</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
            <Dialog open={isAddAllocationOpen} onOpenChange={setIsAddAllocationOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Allocate Student
                </Button>
              </DialogTrigger>
              <DialogContent showCloseButton={false}>
                <DialogHeader>
                  <DialogTitle>Allocate Student</DialogTitle>
                  <DialogDescription>Assign a student to a room</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddAllocation} className="space-y-4">
                  <div>
                    <Label htmlFor="hostelId">Hostel</Label>
                    <Select name="hostelId" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select hostel" />
                      </SelectTrigger>
                      <SelectContent>
                        {hostels.map(hostel => (
                          <SelectItem key={hostel.id} value={hostel.id}>{hostel.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="roomId">Room</Label>
                    <Select name="roomId" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select room" />
                      </SelectTrigger>
                      <SelectContent>
                        {rooms.filter(r => r.currentOccupancy < r.capacity).map(room => (
                          <SelectItem key={room.id} value={room.id}>
                            {room.hostel?.name} - Room {room.roomNumber} ({room.currentOccupancy}/{room.capacity})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="studentId">Student Roll Number</Label>
                    <Input id="studentId" name="studentId" placeholder="2024001" required />
                  </div>
                  <div>
                    <Label htmlFor="academicYearId">Academic Year</Label>
                    <Input id="academicYearId" name="academicYearId" placeholder="2024-2025" required />
                  </div>
                  <div>
                    <Label htmlFor="fees">Monthly Fees</Label>
                    <Input id="fees" name="fees" type="number" placeholder="5000" />
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsAddAllocationOpen(false)}>
                      Close
                    </Button>
                    <Button type="submit">Allocate</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700 text-white">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-slate-400 text-sm font-medium">Total Students</p>
                  <p className="text-3xl font-bold mt-2">{stats.totalStudents}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      <span className="text-xs text-slate-400">Boys: {stats.maleStudents}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-pink-500" />
                      <span className="text-xs text-slate-400">Girls: {stats.femaleStudents}</span>
                    </div>
                  </div>
                </div>
                <div className="p-3 bg-slate-700/50 rounded-xl">
                  <Users className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-600 to-blue-700 border-blue-500 text-white">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Occupancy Rate</p>
                  <p className="text-3xl font-bold mt-2">{stats.occupancyRate}%</p>
                  <p className="text-xs text-blue-200 mt-2">
                    {stats.currentOccupancy} / {stats.totalCapacity} beds occupied
                  </p>
                </div>
                <div className="p-3 bg-white/10 rounded-xl">
                  <Activity className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-600 to-emerald-700 border-emerald-500 text-white">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-emerald-100 text-sm font-medium">Available Rooms</p>
                  <p className="text-3xl font-bold mt-2">{stats.availableRooms}</p>
                  <p className="text-xs text-emerald-200 mt-2">
                    {stats.totalRooms} total rooms
                  </p>
                </div>
                <div className="p-3 bg-white/10 rounded-xl">
                  <Bed className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-600 to-purple-700 border-purple-500 text-white">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Monthly Revenue</p>
                  <p className="text-3xl font-bold mt-2">₹{stats.monthlyRevenue.toLocaleString()}</p>
                  <p className="text-xs text-purple-200 mt-2">
                    From {stats.totalStudents} students
                  </p>
                </div>
                <div className="p-3 bg-white/10 rounded-xl">
                  <CreditCard className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Floor Plans & Rooms</h2>
              <div className="flex gap-2">
                <Input
                  id="room-search"
                  name="room-search"
                  placeholder="Search rooms..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  autoComplete="off"
                  className="w-64"
                />
                <Select value={typeFilter} onValueChange={(value: any) => setTypeFilter(value)}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="Boys">Boys</SelectItem>
                    <SelectItem value="Girls">Girls</SelectItem>
                    <SelectItem value="Staff">Staff</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-6">
              {hostels.map(hostel => (
                <Card key={hostel.id} className="overflow-hidden">
                  <CardHeader className={`bg-gradient-to-r ${getHostelTypeColor(hostel.type)} text-white`}>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-white">{hostel.name}</CardTitle>
                        <p className="text-white/80 text-sm flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          {hostel.address || 'Location not specified'}
                        </p>
                      </div>
                      <Badge variant="secondary" className="bg-white/20 text-white border-0">
                        {hostel.type}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Users className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm text-slate-600">Warden</p>
                          <p className="font-semibold text-slate-900">{hostel.wardenName || 'Not assigned'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <Phone className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm text-slate-600">Contact</p>
                          <p className="font-semibold text-slate-900">{hostel.wardenPhone || 'N/A'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-700">Occupancy</span>
                        <span className="text-sm text-slate-600">
                          {hostel.currentOccupancy} / {hostel.capacity}
                        </span>
                      </div>
                      <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${getOccupancyColor(hostel.currentOccupancy, hostel.capacity)} transition-all duration-500`}
                          style={{ width: `${(hostel.currentOccupancy / hostel.capacity) * 100}%` }}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-medium text-slate-700 flex items-center gap-2">
                        <Layers className="w-4 h-4" />
                        Rooms by Floor
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {rooms
                          .filter(room => room.hostelId === hostel.id)
                          .sort((a, b) => a.floor - b.floor || a.roomNumber.localeCompare(b.roomNumber))
                          .map(room => (
                            <button
                              key={room.id}
                              onClick={() => { setSelectedRoom(room); setIsViewDetailsOpen(true) }}
                              className={`p-3 rounded-xl border-2 transition-all ${
                                room.currentOccupancy >= room.capacity
                                  ? 'border-red-300 bg-red-50 hover:border-red-400'
                                  : room.currentOccupancy > 0
                                  ? 'border-amber-300 bg-amber-50 hover:border-amber-400'
                                  : 'border-slate-200 bg-white hover:border-slate-300'
                              }`}
                            >
                              <div className="text-xs text-slate-500 mb-1">Floor {room.floor}</div>
                              <div className="font-semibold text-slate-900">{room.roomNumber}</div>
                              <div className="text-xs text-slate-600 mt-1">
                                {room.currentOccupancy}/{room.capacity}
                              </div>
                              {room.type && (
                                <Badge variant="outline" className="mt-2 text-xs">
                                  {room.type}
                                </Badge>
                              )}
                            </button>
                          ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Student Allocations</h2>
            <div className="space-y-3">
              <div className="flex gap-2 mb-4">
                <Input
                  id="student-search"
                  name="student-search"
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  autoComplete="off"
                  className="flex-1"
                />
                <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="CheckedOut">Checked Out</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {filteredAllocations.map(allocation => (
                <Card
                  key={allocation.id}
                  className={`hover:shadow-lg transition-all cursor-pointer ${
                    allocation.status === 'CheckedOut' ? 'opacity-60' : ''
                  }`}
                  onClick={() => { setSelectedAllocation(allocation); setIsViewDetailsOpen(true) }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${
                          allocation.hostel?.type === 'Boys' ? 'bg-blue-500' : 
                          allocation.hostel?.type === 'Girls' ? 'bg-pink-500' : 'bg-purple-500'
                        }`}>
                          {allocation.student?.firstName?.charAt(0) || '?'}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">
                            {allocation.student?.firstName} {allocation.student?.lastName}
                          </p>
                          <p className="text-xs text-slate-500">{allocation.student?.rollNumber}</p>
                        </div>
                      </div>
                      <Badge
                        variant={allocation.status === 'Active' ? 'default' : 'secondary'}
                        className={
                          allocation.status === 'Active'
                            ? 'bg-emerald-500 hover:bg-emerald-600'
                            : 'bg-slate-500 hover:bg-slate-600'
                        }
                      >
                        {allocation.status}
                      </Badge>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Home className="w-4 h-4" />
                        <span className="font-medium">{allocation.hostel?.name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600">
                        <Bed className="w-4 h-4" />
                        <span>Room {allocation.room?.roomNumber} (Floor {allocation.room?.floor})</span>
                      </div>
                      {allocation.fees && (
                        <div className="flex items-center gap-2 text-slate-600">
                          <CreditCard className="w-4 h-4" />
                          <span>₹{allocation.fees.toLocaleString()}/month</span>
                        </div>
                      )}
                    </div>

                    {allocation.status === 'Active' && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-xs text-slate-500 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Since {new Date(allocation.allocationDate).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}

              {filteredAllocations.length === 0 && (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500">No allocations found</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>

        <Dialog open={isViewDetailsOpen} onOpenChange={setIsViewDetailsOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {selectedRoom ? `Room ${selectedRoom.roomNumber}` : selectedAllocation?.student?.firstName}
              </DialogTitle>
              <DialogDescription>
                {selectedRoom 
                  ? `${selectedRoom.hostel?.name} - Floor ${selectedRoom.floor}`
                  : 'Allocation details'
                }
              </DialogDescription>
            </DialogHeader>
            {selectedRoom && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Room Number</Label>
                    <p className="font-semibold">{selectedRoom.roomNumber}</p>
                  </div>
                  <div>
                    <Label>Floor</Label>
                    <p className="font-semibold">{selectedRoom.floor}</p>
                  </div>
                  <div>
                    <Label>Capacity</Label>
                    <p className="font-semibold">{selectedRoom.capacity} students</p>
                  </div>
                  <div>
                    <Label>Current Occupancy</Label>
                    <p className="font-semibold">{selectedRoom.currentOccupancy} students</p>
                  </div>
                  {selectedRoom.type && (
                    <div>
                      <Label>Room Type</Label>
                      <p className="font-semibold">{selectedRoom.type}</p>
                    </div>
                  )}
                </div>

                <div>
                  <Label>Occupants</Label>
                  <div className="mt-2 space-y-2">
                    {selectedRoom.allocations && selectedRoom.allocations.length > 0 ? (
                      selectedRoom.allocations.map(allocation => (
                        <div key={allocation.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold ${
                            allocation.hostel?.type === 'Boys' ? 'bg-blue-500' : 
                            allocation.hostel?.type === 'Girls' ? 'bg-pink-500' : 'bg-purple-500'
                          }`}>
                            {allocation.student?.firstName?.charAt(0) || '?'}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-sm">
                              {allocation.student?.firstName} {allocation.student?.lastName}
                            </p>
                            <p className="text-xs text-slate-500">{allocation.student?.rollNumber}</p>
                          </div>
                          <Badge variant={allocation.status === 'Active' ? 'default' : 'secondary'}>
                            {allocation.status}
                          </Badge>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-slate-500">No occupants</p>
                    )}
                  </div>
                </div>

                <DialogFooter>
                  <Button onClick={() => setIsViewDetailsOpen(false)}>Close</Button>
                </DialogFooter>
              </div>
            )}
            {selectedAllocation && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Student Name</Label>
                    <p className="font-semibold">
                      {selectedAllocation.student?.firstName} {selectedAllocation.student?.lastName}
                    </p>
                  </div>
                  <div>
                    <Label>Roll Number</Label>
                    <p className="font-semibold">{selectedAllocation.student?.rollNumber}</p>
                  </div>
                  <div>
                    <Label>Hostel</Label>
                    <p className="font-semibold">{selectedAllocation.hostel?.name}</p>
                  </div>
                  <div>
                    <Label>Room</Label>
                    <p className="font-semibold">{selectedAllocation.room?.roomNumber}</p>
                  </div>
                  <div>
                    <Label>Allocation Date</Label>
                    <p className="font-semibold">
                      {new Date(selectedAllocation.allocationDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <Label>Status</Label>
                    <Badge variant={selectedAllocation.status === 'Active' ? 'default' : 'secondary'}>
                      {selectedAllocation.status}
                    </Badge>
                  </div>
                  {selectedAllocation.fees && (
                    <div>
                      <Label>Monthly Fees</Label>
                      <p className="font-semibold">₹{selectedAllocation.fees.toLocaleString()}</p>
                    </div>
                  )}
                </div>

                {selectedAllocation.status === 'Active' && (
                  <Dialog open={isCheckoutDialogOpen} onOpenChange={setIsCheckoutDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="destructive" className="w-full">
                        <LogOut className="w-4 h-4 mr-2" />
                        Check Out Student
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Confirm Checkout</DialogTitle>
                        <DialogDescription>
                          Are you sure you want to check out {selectedAllocation.student?.firstName} {selectedAllocation.student?.lastName} from room {selectedAllocation.room?.roomNumber}?
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCheckoutDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button 
                          variant="destructive"
                          onClick={() => handleCheckout(selectedAllocation.id)}
                        >
                          Check Out
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}

                <Button onClick={() => setIsViewDetailsOpen(false)} className="w-full">
                  Close
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}

'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Plus, Search, Filter, MapPin, Users, AlertCircle, Activity, Clock, TrendingUp, ArrowUpRight, ArrowDownRight, Zap, Fuel, Wrench, Route, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuPortal } from '@/components/ui/dropdown-menu'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface Vehicle {
  id: string
  vehicleNumber: string
  model: string
  type: 'bus' | 'van' | 'mini-bus'
  route: string
  driver: string
  driverPhone: string
  capacity: number
  currentLoad: number
  status: 'active' | 'maintenance' | 'inactive'
  fuelLevel: number
  lastMaintenance: string
  nextMaintenance: string
  averageSpeed: number
  totalDistance: number
}

interface Allocation {
  id: string
  vehicleId: string
  studentCount: number
  route: string
  pickupPoints: string[]
  dropPoints: string[]
  timing: string
}

export default function TransportPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [allocations, setAllocations] = useState<Allocation[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)

  useEffect(() => {
    const mockVehicles: Vehicle[] = [
      {
        id: '1',
        vehicleNumber: 'KA-01-AB-1234',
        model: 'Tata Starbus',
        type: 'bus',
        route: 'Route A - Central',
        driver: 'Ramesh Kumar',
        driverPhone: '9876543210',
        capacity: 50,
        currentLoad: 42,
        status: 'active',
        fuelLevel: 75,
        lastMaintenance: '2025-12-15',
        nextMaintenance: '2026-02-15',
        averageSpeed: 35,
        totalDistance: 15420
      },
      {
        id: '2',
        vehicleNumber: 'KA-01-CD-5678',
        model: 'Eicher 2070',
        type: 'bus',
        route: 'Route B - East',
        driver: 'Suresh Patil',
        driverPhone: '9876543211',
        capacity: 45,
        currentLoad: 38,
        status: 'active',
        fuelLevel: 60,
        lastMaintenance: '2025-12-20',
        nextMaintenance: '2026-02-20',
        averageSpeed: 32,
        totalDistance: 12350
      },
      {
        id: '3',
        vehicleNumber: 'KA-01-EF-9012',
        model: 'Force Traveller',
        type: 'mini-bus',
        route: 'Route C - West',
        driver: 'Mohan Singh',
        driverPhone: '9876543212',
        capacity: 25,
        currentLoad: 18,
        status: 'maintenance',
        fuelLevel: 45,
        lastMaintenance: '2025-11-28',
        nextMaintenance: '2026-01-28',
        averageSpeed: 28,
        totalDistance: 8900
      },
      {
        id: '4',
        vehicleNumber: 'KA-01-GH-3456',
        model: 'Toyota Innova',
        type: 'van',
        route: 'Route D - North',
        driver: 'Rajesh Verma',
        driverPhone: '9876543213',
        capacity: 7,
        currentLoad: 5,
        status: 'active',
        fuelLevel: 80,
        lastMaintenance: '2025-12-25',
        nextMaintenance: '2026-03-25',
        averageSpeed: 40,
        totalDistance: 5600
      },
      {
        id: '5',
        vehicleNumber: 'KA-01-IJ-7890',
        model: 'Ashok Leyland',
        type: 'bus',
        route: 'Route E - South',
        driver: 'Anil Sharma',
        driverPhone: '9876543214',
        capacity: 55,
        currentLoad: 48,
        status: 'active',
        fuelLevel: 55,
        lastMaintenance: '2025-12-10',
        nextMaintenance: '2026-02-10',
        averageSpeed: 33,
        totalDistance: 18200
      },
      {
        id: '6',
        vehicleNumber: 'KA-01-KL-1122',
        model: 'Mahindra Bolero',
        type: 'van',
        route: 'Route F - Suburban',
        driver: 'Vikram Reddy',
        driverPhone: '9876543215',
        capacity: 9,
        currentLoad: 0,
        status: 'inactive',
        fuelLevel: 90,
        lastMaintenance: '2025-11-15',
        nextMaintenance: '2026-02-15',
        averageSpeed: 38,
        totalDistance: 7800
      }
    ]

    const mockAllocations: Allocation[] = [
      {
        id: '1',
        vehicleId: '1',
        studentCount: 42,
        route: 'Route A - Central',
        pickupPoints: ['MG Road', 'Cubbon Park', 'Indiranagar', 'Koramangala'],
        dropPoints: ['School Gate', 'Main Entrance'],
        timing: '07:00 AM - 08:30 AM'
      },
      {
        id: '2',
        vehicleId: '2',
        studentCount: 38,
        route: 'Route B - East',
        pickupPoints: ['Whitefield', 'Marathahalli', 'HAL Airport', 'Domlur'],
        dropPoints: ['School Gate', 'Side Entrance'],
        timing: '07:15 AM - 08:45 AM'
      },
      {
        id: '3',
        vehicleId: '4',
        studentCount: 5,
        route: 'Route D - North',
        pickupPoints: ['Yelahanka', 'Hebbal', 'Manyata'],
        dropPoints: ['School Gate'],
        timing: '07:30 AM - 08:00 AM'
      }
    ]

    setVehicles(mockVehicles)
    setAllocations(mockAllocations)
  }, [])

  const stats = useMemo(() => ({
    totalVehicles: vehicles.length,
    activeVehicles: vehicles.filter(v => v.status === 'active').length,
    maintenanceVehicles: vehicles.filter(v => v.status === 'maintenance').length,
    totalStudents: allocations.reduce((sum, a) => sum + a.studentCount, 0),
    averageCapacity: vehicles.length > 0 
      ? Math.round(vehicles.reduce((sum, v) => sum + (v.currentLoad / v.capacity * 100), 0) / vehicles.length)
      : 0
  }), [vehicles, allocations])

  const filteredVehicles = useMemo(() => vehicles.filter(vehicle => {
    const matchesSearch = 
      vehicle.vehicleNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.driver.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.route.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = selectedStatus === 'all' || vehicle.status === selectedStatus
    
    return matchesSearch && matchesStatus
  }), [vehicles, searchTerm, selectedStatus])

  const handleViewDetails = useCallback((vehicle: Vehicle) => {
    setSelectedVehicle(vehicle)
    setIsViewDialogOpen(true)
  }, [])

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'active': return 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20'
      case 'maintenance': return 'bg-amber-500/10 text-amber-700 border-amber-500/20'
      case 'inactive': return 'bg-slate-500/10 text-slate-700 border-slate-500/20'
      default: return 'bg-slate-500/10 text-slate-700 border-slate-500/20'
    }
  }, [])

  const getFuelColor = useCallback((level: number) => {
    if (level > 50) return 'text-emerald-600'
    if (level > 25) return 'text-amber-600'
    return 'text-rose-600'
  }, [])

  const getLoadPercentage = useCallback((vehicle: Vehicle) => {
    return Math.round((vehicle.currentLoad / vehicle.capacity) * 100)
  }, [])

  const getLoadColor = useCallback((percentage: number) => {
    if (percentage >= 90) return 'bg-rose-500'
    if (percentage >= 70) return 'bg-amber-500'
    return 'bg-emerald-500'
  }, [])

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">Transport Fleet</h1>
            <p className="text-muted-foreground">Monitor and manage your school's transportation system</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-lg border">
              <Activity className="h-4 w-4 text-emerald-600" />
              <span className="text-sm font-medium">Live Tracking</span>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button size="lg" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Vehicle
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add New Vehicle</DialogTitle>
                  <DialogDescription>Enter vehicle details to add to the transport fleet</DialogDescription>
                </DialogHeader>
                <div className="grid gap-6 py-6">
                  <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="vehicleNumber">Vehicle Number</Label>
                    <Input id="vehicleNumber" placeholder="KA-01-AB-1234" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="model">Model</Label>
                    <Input id="model" placeholder="Tata Starbus" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="type">Vehicle Type</Label>
                    <Input id="type" placeholder="Bus / Van / Mini-bus" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="capacity">Capacity</Label>
                    <Input id="capacity" type="number" placeholder="50" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="driver">Driver Name</Label>
                    <Input id="driver" placeholder="Ramesh Kumar" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="driverPhone">Driver Phone</Label>
                    <Input id="driverPhone" placeholder="9876543210" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="route">Route</Label>
                  <Input id="route" placeholder="Route A - Central" />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                <Button>Add Vehicle</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-none bg-gradient-to-br from-slate-50 to-slate-100/50">
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-lg">Fleet Overview</CardTitle>
                <CardDescription className="text-xs">Real-time vehicle status and metrics</CardDescription>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border shadow-sm">
                <div className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-xs font-medium text-emerald-700">Live</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="p-5 bg-white rounded-xl border shadow-sm">
                  <div className="flex items-start justify-between mb-3">
                    <div className="p-2.5 bg-blue-50 rounded-lg">
                      <Activity className="h-5 w-5 text-blue-600" />
                    </div>
                    <Badge variant="outline" className="bg-slate-50">
                      Total
                    </Badge>
                  </div>
                  <div className="flex items-end justify-between">
                    <div>
                      <div className="text-3xl font-bold tracking-tight">{stats.totalVehicles}</div>
                      <p className="text-xs text-slate-500 mt-1">Fleet vehicles</p>
                    </div>
                    <div className="flex items-center text-emerald-600 text-sm font-medium">
                      <ArrowUpRight className="h-3.5 w-3.5 mr-1" />
                      100%
                    </div>
                  </div>
                </div>

                <div className="p-5 bg-white rounded-xl border shadow-sm">
                  <div className="flex items-start justify-between mb-3">
                    <div className="p-2.5 bg-emerald-50 rounded-lg">
                      <Activity className="h-5 w-5 text-emerald-600" />
                    </div>
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                      Active
                    </Badge>
                  </div>
                  <div className="flex items-end justify-between">
                    <div>
                      <div className="text-3xl font-bold tracking-tight">{stats.activeVehicles}</div>
                      <p className="text-xs text-slate-500 mt-1">Operational</p>
                    </div>
                    <div className="text-sm font-medium text-emerald-600">
                      {Math.round((stats.activeVehicles / stats.totalVehicles) * 100)}%
                    </div>
                  </div>
                </div>

                <div className="p-5 bg-white rounded-xl border shadow-sm">
                  <div className="flex items-start justify-between mb-3">
                    <div className="p-2.5 bg-amber-50 rounded-lg">
                      <Wrench className="h-5 w-5 text-amber-600" />
                    </div>
                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                      Service
                    </Badge>
                  </div>
                  <div className="flex items-end justify-between">
                    <div>
                      <div className="text-3xl font-bold tracking-tight">{stats.maintenanceVehicles}</div>
                      <p className="text-xs text-slate-500 mt-1">Under maintenance</p>
                    </div>
                    <div className="text-sm font-medium text-amber-600">
                      {Math.round((stats.maintenanceVehicles / stats.totalVehicles) * 100)}%
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-5 bg-white rounded-xl border shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold">Fleet Capacity Distribution</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Current load across all vehicles</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 bg-emerald-500 rounded-full" />
                    <span className="text-xs text-slate-600">Healthy</span>
                  </div>
                </div>
                <div className="space-y-4">
                  {vehicles.slice(0, 4).map((vehicle, idx) => {
                    const loadPct = getLoadPercentage(vehicle)
                    return (
                      <div key={vehicle.id} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{vehicle.vehicleNumber}</span>
                            <Badge variant="outline" className={`text-xs ${getStatusColor(vehicle.status)}`}>
                              {vehicle.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-slate-500">{vehicle.currentLoad}/{vehicle.capacity} students</span>
                            <span className={`text-xs font-semibold ${loadPct >= 90 ? 'text-rose-600' : loadPct >= 70 ? 'text-amber-600' : 'text-emerald-600'}`}>
                              {loadPct}%
                            </span>
                          </div>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${getLoadColor(loadPct)}`}
                            style={{ width: `${loadPct}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-none bg-gradient-to-br from-blue-50 to-indigo-50/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Student Allocation</CardTitle>
              <CardDescription className="text-xs">Daily transport coverage</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-white rounded-xl border shadow-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-indigo-50 rounded-lg">
                      <Users className="h-4 w-4 text-indigo-600" />
                    </div>
                    <div className="flex-1">
                      <div className="text-2xl font-bold tracking-tight">{stats.totalStudents}</div>
                      <p className="text-xs text-slate-500 mt-0.5">Students today</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
                    <span className="text-slate-600">+12% from yesterday</span>
                  </div>
                </div>

                <div className="p-4 bg-white rounded-xl border shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium">Route Efficiency</span>
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                      Optimal
                    </Badge>
                  </div>
                  <div className="text-2xl font-bold tracking-tight">94%</div>
                  <div className="mt-2 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: '94%' }} />
                  </div>
                  <p className="text-xs text-slate-500 mt-2">On-time delivery rate</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none bg-gradient-to-br from-amber-50 to-orange-50/50">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <CardTitle className="text-base">Alerts</CardTitle>
              </div>
              <CardDescription className="text-xs">Immediate attention needed</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-3 bg-white rounded-lg border shadow-sm">
                  <div className="flex items-start gap-2">
                    <Fuel className="h-4 w-4 text-amber-600 mt-0.5" />
                    <div className="flex-1">
                      <div className="text-sm font-medium">Low Fuel Warning</div>
                      <p className="text-xs text-slate-500 mt-0.5">KA-01-EF-9012 at 45%</p>
                    </div>
                    <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                      Action
                    </Badge>
                  </div>
                </div>

                <div className="p-3 bg-white rounded-lg border shadow-sm">
                  <div className="flex items-start gap-2">
                    <Wrench className="h-4 w-4 text-amber-600 mt-0.5" />
                    <div className="flex-1">
                      <div className="text-sm font-medium">Maintenance Due</div>
                      <p className="text-xs text-slate-500 mt-0.5">KA-01-EF-9012 scheduled for Jan 28</p>
                    </div>
                    <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                      Schedule
                    </Badge>
                  </div>
                </div>

                <div className="p-3 bg-white rounded-lg border shadow-sm">
                  <div className="flex items-start gap-2">
                    <Clock className="h-4 w-4 text-amber-600 mt-0.5" />
                    <div className="flex-1">
                      <div className="text-sm font-medium">Route Delay</div>
                      <p className="text-xs text-slate-500 mt-0.5">Route C running 15 mins late</p>
                    </div>
                    <Badge variant="outline" className="text-xs bg-rose-50 text-rose-700 border-rose-200">
                      Urgent
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="border-none">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="space-y-1">
              <CardTitle>Vehicle Fleet</CardTitle>
              <CardDescription>Manage and monitor all transport vehicles</CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search vehicles..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-full sm:w-64"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={selectedStatus === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedStatus('all')}
                >
                  All
                </Button>
                <Button
                  variant={selectedStatus === 'active' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedStatus('active')}
                >
                  Active
                </Button>
                <Button
                  variant={selectedStatus === 'maintenance' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedStatus('maintenance')}
                >
                  Maintenance
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[200px]">Vehicle</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Route</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead>Fuel</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVehicles.map((vehicle) => (
                  <TableRow key={vehicle.id} className="group hover:bg-slate-50/50">
                    <TableCell>
                      <div>
                        <div className="font-semibold text-sm">{vehicle.vehicleNumber}</div>
                        <div className="text-xs text-slate-500">{vehicle.model}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {vehicle.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Route className="h-3.5 w-3.5 text-slate-400" />
                        <span className="text-sm">{vehicle.route}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="text-sm font-medium">{vehicle.driver}</div>
                        <div className="text-xs text-slate-500">{vehicle.driverPhone}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span>{vehicle.currentLoad}/{vehicle.capacity}</span>
                          <span className={`font-semibold ${getLoadPercentage(vehicle) >= 90 ? 'text-rose-600' : getLoadPercentage(vehicle) >= 70 ? 'text-amber-600' : 'text-emerald-600'}`}>
                            {getLoadPercentage(vehicle)}%
                          </span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-300 ${getLoadColor(getLoadPercentage(vehicle))}`}
                            style={{ width: `${getLoadPercentage(vehicle)}%` }}
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Fuel className={`h-3.5 w-3.5 ${getFuelColor(vehicle.fuelLevel)}`} />
                        <span className={`text-sm font-semibold ${getFuelColor(vehicle.fuelLevel)}`}>
                          {vehicle.fuelLevel}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`capitalize ${getStatusColor(vehicle.status)}`}>
                        {vehicle.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="relative overflow-visible z-10">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuPortal>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel>Vehicle Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="flex items-center gap-2 cursor-pointer"
                              onSelect={() => handleViewDetails(vehicle)}
                            >
                              <Activity className="h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem className="flex items-center gap-2 cursor-pointer">
                              <MapPin className="h-4 w-4" />
                              Track Route
                            </DropdownMenuItem>
                            <DropdownMenuItem className="flex items-center gap-2 cursor-pointer">
                              <Wrench className="h-4 w-4" />
                              Schedule Maintenance
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="flex items-center gap-2 cursor-pointer text-rose-600">
                              <Wrench className="h-4 w-4" />
                              Remove Vehicle
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenuPortal>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Vehicle Details</DialogTitle>
            <DialogDescription>Complete information about the selected vehicle</DialogDescription>
          </DialogHeader>
          {selectedVehicle && (
            <div className="space-y-6 py-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 bg-slate-50 rounded-lg border">
                  <div className="text-xs text-slate-500 mb-1">Vehicle Number</div>
                  <div className="font-semibold text-lg">{selectedVehicle.vehicleNumber}</div>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg border">
                  <div className="text-xs text-slate-500 mb-1">Model</div>
                  <div className="font-semibold text-lg">{selectedVehicle.model}</div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="h-4 w-4 text-emerald-600" />
                    <div className="text-xs text-slate-600">Status</div>
                  </div>
                  <Badge className={`capitalize ${getStatusColor(selectedVehicle.status)}`}>
                    {selectedVehicle.status}
                  </Badge>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-4 w-4 text-blue-600" />
                    <div className="text-xs text-slate-600">Capacity</div>
                  </div>
                  <div className="font-semibold text-lg">{selectedVehicle.capacity}</div>
                  <div className="text-xs text-slate-500 mt-1">seats</div>
                </div>
                <div className="p-4 bg-amber-50 rounded-lg border border-amber-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Fuel className="h-4 w-4 text-amber-600" />
                    <div className="text-xs text-slate-600">Fuel Level</div>
                  </div>
                  <div className={`font-semibold text-lg ${getFuelColor(selectedVehicle.fuelLevel)}`}>
                    {selectedVehicle.fuelLevel}%
                  </div>
                  <div className="text-xs text-slate-500 mt-1">remaining</div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold">Driver Information</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="p-4 bg-slate-50 rounded-lg border">
                    <div className="text-xs text-slate-500 mb-1">Name</div>
                    <div className="font-medium">{selectedVehicle.driver}</div>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-lg border">
                    <div className="text-xs text-slate-500 mb-1">Phone</div>
                    <div className="font-medium">{selectedVehicle.driverPhone}</div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold">Route Information</h3>
                <div className="p-4 bg-slate-50 rounded-lg border">
                  <div className="flex items-center gap-2">
                    <Route className="h-4 w-4 text-slate-600" />
                    <div className="font-medium">{selectedVehicle.route}</div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold">Performance Metrics</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="p-4 bg-slate-50 rounded-lg border">
                    <div className="text-xs text-slate-500 mb-1">Average Speed</div>
                    <div className="font-semibold text-lg">{selectedVehicle.averageSpeed} km/h</div>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-lg border">
                    <div className="text-xs text-slate-500 mb-1">Total Distance</div>
                    <div className="font-semibold text-lg">{selectedVehicle.totalDistance.toLocaleString()} km</div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold">Maintenance Schedule</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="p-4 bg-slate-50 rounded-lg border">
                    <div className="text-xs text-slate-500 mb-1">Last Maintenance</div>
                    <div className="font-medium">{new Date(selectedVehicle.lastMaintenance).toLocaleDateString()}</div>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-lg border">
                    <div className="text-xs text-slate-500 mb-1">Next Maintenance</div>
                    <div className="font-medium">{new Date(selectedVehicle.nextMaintenance).toLocaleDateString()}</div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold">Current Load</h3>
                <div className="p-4 bg-slate-50 rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Occupancy</span>
                    <span className={`font-semibold ${getLoadPercentage(selectedVehicle) >= 90 ? 'text-rose-600' : getLoadPercentage(selectedVehicle) >= 70 ? 'text-amber-600' : 'text-emerald-600'}`}>
                      {getLoadPercentage(selectedVehicle)}%
                    </span>
                  </div>
                  <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${getLoadColor(getLoadPercentage(selectedVehicle))}`}
                      style={{ width: `${getLoadPercentage(selectedVehicle)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-2 text-xs text-slate-500">
                    <span>{selectedVehicle.currentLoad} students onboard</span>
                    <span>{selectedVehicle.capacity - selectedVehicle.currentLoad} seats available</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      </div>
    </DashboardLayout>
  )
}

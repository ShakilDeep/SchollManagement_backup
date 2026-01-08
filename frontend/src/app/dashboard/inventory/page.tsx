'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Plus,
  Search,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Filter,
  Package,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Loader2,
  TrendingUp,
  ArrowUpRight
} from 'lucide-react'

interface Asset {
  id: string
  assetCode: string
  name: string
  category: string
  description: string | null
  serialNumber: string | null
  purchaseDate: string | null
  purchasePrice: number | null
  currentValue: number | null
  condition: string
  location: string | null
  assignedTo: string | null
  status: string
}

interface AssetFormData {
  name: string
  category: string
  description: string
  serialNumber: string
  purchaseDate: string
  purchasePrice: string
  currentValue: string
  condition: string
  location: string
  assignedTo: string
  status: string
}

interface AssetStats {
  total: number
  available: number
  inUse: number
  maintenance: number
  totalValue: number
  lowCondition: number
}

export default function InventoryPage() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null)
  const [selectedAssetDetails, setSelectedAssetDetails] = useState<Asset | null>(null)
  
  const [formData, setFormData] = useState<AssetFormData>({
    name: '',
    category: 'Electronics',
    description: '',
    serialNumber: '',
    purchaseDate: '',
    purchasePrice: '',
    currentValue: '',
    condition: 'Good',
    location: '',
    assignedTo: '',
    status: 'Available',
  })
  
  const [stats, setStats] = useState<AssetStats>({
    total: 0,
    available: 0,
    inUse: 0,
    maintenance: 0,
    totalValue: 0,
    lowCondition: 0,
  })
  
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchAssets()
  }, [searchTerm, categoryFilter, statusFilter])

  useEffect(() => {
    calculateStats()
  }, [assets])

  const fetchAssets = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (categoryFilter !== 'all') params.append('category', categoryFilter)
      if (statusFilter !== 'all') params.append('status', statusFilter)
      
      const response = await fetch(`/api/inventory?${params}`)
      if (!response.ok) throw new Error('Failed to fetch assets')
      
      const data = await response.json()
      setAssets(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch assets')
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = () => {
    const total = assets.length
    const available = assets.filter(a => a.status === 'Available').length
    const inUse = assets.filter(a => a.status === 'InUse').length
    const maintenance = assets.filter(a => a.status === 'Maintenance').length
    const totalValue = assets.reduce((sum, a) => sum + (a.currentValue || 0), 0)
    const lowCondition = assets.filter(a => a.condition === 'Poor' || a.condition === 'Fair').length
    
    setStats({
      total,
      available,
      inUse,
      maintenance,
      totalValue,
      lowCondition,
    })
  }

  const handleView = async (asset: Asset) => {
    try {
      const response = await fetch(`/api/inventory/${asset.id}`)
      if (!response.ok) throw new Error('Failed to fetch asset details')
      
      const data = await response.json()
      setSelectedAssetDetails(data)
      setSelectedAsset(asset)
      setIsViewDialogOpen(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch asset details')
    }
  }

  const handleEdit = async (asset: Asset) => {
    try {
      const response = await fetch(`/api/inventory/${asset.id}`)
      if (!response.ok) throw new Error('Failed to fetch asset details')
      
      const data = await response.json()
      setSelectedAssetDetails(data)
      setSelectedAsset(asset)
      setFormData({
        name: data.name,
        category: data.category,
        description: data.description || '',
        serialNumber: data.serialNumber || '',
        purchaseDate: data.purchaseDate || '',
        purchasePrice: data.purchasePrice?.toString() || '',
        currentValue: data.currentValue?.toString() || '',
        condition: data.condition,
        location: data.location || '',
        assignedTo: data.assignedTo || '',
        status: data.status,
      })
      setIsEditDialogOpen(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch asset details')
    }
  }

  const handleDelete = (asset: Asset) => {
    setSelectedAsset(asset)
    setIsDeleteDialogOpen(true)
  }

  const handleCloseAddDialog = () => {
    setIsAddDialogOpen(false)
    resetForm()
  }

  const handleCloseViewDialog = () => {
    setIsViewDialogOpen(false)
    setSelectedAsset(null)
    setSelectedAssetDetails(null)
  }

  const handleCloseEditDialog = () => {
    setIsEditDialogOpen(false)
    setSelectedAsset(null)
    setSelectedAssetDetails(null)
    resetForm()
  }

  const handleCloseDeleteDialog = () => {
    setIsDeleteDialogOpen(false)
    setSelectedAsset(null)
    setSubmitError(null)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      category: 'Electronics',
      description: '',
      serialNumber: '',
      purchaseDate: '',
      purchasePrice: '',
      currentValue: '',
      condition: 'Good',
      location: '',
      assignedTo: '',
      status: 'Available',
    })
    setSubmitError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const url = selectedAsset ? `/api/inventory/${selectedAsset.id}` : '/api/inventory'
      const method = selectedAsset ? 'PATCH' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          purchasePrice: formData.purchasePrice ? parseFloat(formData.purchasePrice) : null,
          currentValue: formData.currentValue ? parseFloat(formData.currentValue) : null,
        }),
      })

      if (!response.ok) throw new Error('Failed to save asset')

      await fetchAssets()
      if (selectedAsset) {
        handleCloseEditDialog()
      } else {
        handleCloseAddDialog()
      }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to save asset')
    } finally {
      setIsSubmitting(false)
    }
  }

  const confirmDelete = async () => {
    if (!selectedAsset) return

    try {
      const response = await fetch(`/api/inventory/${selectedAsset.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete asset')

      await fetchAssets()
      handleCloseDeleteDialog()
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to delete asset')
    }
  }

  const getConditionBadge = (condition: string) => {
    const variants = {
      'Excellent': 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
      'Good': 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
      'Fair': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
      'Poor': 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
    }
    return <Badge className={variants[condition as keyof typeof variants] || 'bg-gray-100 text-gray-700'}>{condition}</Badge>
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      'Available': 'default',
      'InUse': 'secondary',
      'Maintenance': 'destructive',
    }
    return <Badge variant={variants[status as keyof typeof variants] || 'default'}>{status}</Badge>
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-slate-600 mx-auto mb-4" />
            <p className="text-slate-600">Loading inventory...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-slate-600">{error}</p>
            <Button onClick={fetchAssets} className="mt-4">
              Retry
            </Button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Inventory Management</h1>
            <p className="text-slate-500 mt-1">Track and manage school assets</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-slate-900 hover:bg-slate-800">
                <Plus className="h-4 w-4" />
                Add Asset
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Asset</DialogTitle>
                <DialogDescription>
                  Enter the details of the new asset to add to inventory
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Asset Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Enter asset name"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="category">Category *</Label>
                      <Select
                        value={formData.category}
                        onValueChange={(value) => setFormData({ ...formData, category: value })}
                      >
                        <SelectTrigger id="category">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Electronics">Electronics</SelectItem>
                          <SelectItem value="Furniture">Furniture</SelectItem>
                          <SelectItem value="Equipment">Equipment</SelectItem>
                          <SelectItem value="Vehicles">Vehicles</SelectItem>
                          <SelectItem value="Books">Books</SelectItem>
                          <SelectItem value="Supplies">Supplies</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Enter asset description"
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="serialNumber">Serial Number</Label>
                      <Input
                        id="serialNumber"
                        value={formData.serialNumber}
                        onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                        placeholder="Enter serial number"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="purchaseDate">Purchase Date</Label>
                      <Input
                        id="purchaseDate"
                        type="date"
                        value={formData.purchaseDate}
                        onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="purchasePrice">Purchase Price</Label>
                      <Input
                        id="purchasePrice"
                        type="number"
                        step="0.01"
                        value={formData.purchasePrice}
                        onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
                        placeholder="0.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="currentValue">Current Value</Label>
                      <Input
                        id="currentValue"
                        type="number"
                        step="0.01"
                        value={formData.currentValue}
                        onChange={(e) => setFormData({ ...formData, currentValue: e.target.value })}
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="condition">Condition *</Label>
                      <Select
                        value={formData.condition}
                        onValueChange={(value) => setFormData({ ...formData, condition: value })}
                      >
                        <SelectTrigger id="condition">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Excellent">Excellent</SelectItem>
                          <SelectItem value="Good">Good</SelectItem>
                          <SelectItem value="Fair">Fair</SelectItem>
                          <SelectItem value="Poor">Poor</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="status">Status *</Label>
                      <Select
                        value={formData.status}
                        onValueChange={(value) => setFormData({ ...formData, status: value })}
                      >
                        <SelectTrigger id="status">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Available">Available</SelectItem>
                          <SelectItem value="InUse">In Use</SelectItem>
                          <SelectItem value="Maintenance">Maintenance</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        placeholder="Enter location"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="assignedTo">Assigned To</Label>
                      <Input
                        id="assignedTo"
                        value={formData.assignedTo}
                        onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                        placeholder="Enter assignee"
                      />
                    </div>
                  </div>
                </div>
                {submitError && (
                  <div className="text-sm text-red-600 mb-4">{submitError}</div>
                )}
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={handleCloseAddDialog}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      'Add Asset'
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
          <Card className="border-l-4 border-l-neutral-900 border-neutral-200/60 shadow-none bg-neutral-50/30">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-xs font-semibold text-neutral-600 mb-1">Total Assets</CardTitle>
              <div className="flex items-baseline gap-2">
                <div className="text-4xl font-bold text-neutral-900">{stats.total}</div>
                <Package className="h-4 w-4 text-neutral-400" />
              </div>
            </CardHeader>
            <CardContent className="pt-0 px-4 pb-4">
              <div className="text-xs text-neutral-500">Across all categories</div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-emerald-600 border-neutral-200/60 shadow-none bg-emerald-50/20 md:col-span-2">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-xs font-semibold text-neutral-600 mb-1">Available Assets</CardTitle>
              <div className="flex items-center justify-between">
                <div className="flex items-baseline gap-2">
                  <div className="text-4xl font-bold text-emerald-900">{stats.available}</div>
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                </div>
                <div className="text-xs text-neutral-500 bg-emerald-50 px-2 py-1 rounded-full">
                  {stats.total > 0 ? `${Math.round((stats.available / stats.total) * 100)}% available` : '0%'}
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0 px-4 pb-4">
              <div className="text-xs text-neutral-500">Ready for deployment</div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-600 border-neutral-200/60 shadow-none bg-blue-50/20">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-xs font-semibold text-neutral-600 mb-1">In Use</CardTitle>
              <div className="flex items-baseline gap-2">
                <div className="text-4xl font-bold text-blue-900">{stats.inUse}</div>
                <ArrowUpRight className="h-4 w-4 text-blue-500" />
              </div>
            </CardHeader>
            <CardContent className="pt-0 px-4 pb-4">
              <div className="text-xs text-neutral-500">Currently assigned</div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-600 border-neutral-200/60 shadow-none bg-purple-50/20">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-xs font-semibold text-neutral-600 mb-1">Maintenance</CardTitle>
              <div className="flex items-baseline gap-2">
                <div className="text-4xl font-bold text-purple-900">{stats.maintenance}</div>
                <Clock className="h-4 w-4 text-purple-500" />
              </div>
            </CardHeader>
            <CardContent className="pt-0 px-4 pb-4">
              <div className="text-xs text-neutral-500">Under repair</div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-amber-600 border-neutral-200/60 shadow-none bg-amber-50/20 md:col-span-2">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-xs font-semibold text-neutral-600 mb-1">Low Condition</CardTitle>
              <div className="flex items-center justify-between">
                <div className="flex items-baseline gap-2">
                  <div className="text-4xl font-bold text-amber-900">{stats.lowCondition}</div>
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                </div>
                <div className="text-xs text-neutral-500 bg-amber-50 px-2 py-1 rounded-full">
                  {stats.total > 0 ? `${Math.round((stats.lowCondition / stats.total) * 100)}% need attention` : '0%'}
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0 px-4 pb-4">
              <div className="text-xs text-neutral-500">Fair or Poor condition</div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-teal-600 border-neutral-200/60 shadow-none bg-teal-50/20">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-xs font-semibold text-neutral-600 mb-1">Total Value</CardTitle>
              <div className="flex items-baseline gap-2">
                <div className="text-3xl font-bold text-teal-900">${stats.totalValue.toLocaleString()}</div>
                <DollarSign className="h-4 w-4 text-teal-500" />
              </div>
            </CardHeader>
            <CardContent className="pt-0 px-4 pb-4">
              <div className="text-xs text-neutral-500">Asset valuation</div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-slate-200 dark:border-slate-700 shadow-none">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-slate-900">Assets Inventory</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="search-assets"
                  placeholder="Search by asset code, name, or serial number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-11 border-slate-300 focus:border-slate-500"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Select id="filter-category" value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-[160px] h-10 border-slate-300 focus:border-slate-500">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="Electronics">Electronics</SelectItem>
                    <SelectItem value="Furniture">Furniture</SelectItem>
                    <SelectItem value="Equipment">Equipment</SelectItem>
                    <SelectItem value="Vehicles">Vehicles</SelectItem>
                    <SelectItem value="Books">Books</SelectItem>
                    <SelectItem value="Supplies">Supplies</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <Select id="filter-status" value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[160px] h-10 border-slate-300 focus:border-slate-500">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="Available">Available</SelectItem>
                    <SelectItem value="InUse">In Use</SelectItem>
                    <SelectItem value="Maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-neutral-50/50 border-b border-neutral-200">
                    <TableHead className="w-[120px] font-semibold text-neutral-700 text-xs uppercase tracking-wide">Code</TableHead>
                    <TableHead className="w-1/4 font-semibold text-neutral-700 text-xs uppercase tracking-wide">Asset</TableHead>
                    <TableHead className="w-[140px] font-semibold text-neutral-700 text-xs uppercase tracking-wide">Category</TableHead>
                    <TableHead className="w-[110px] font-semibold text-neutral-700 text-xs uppercase tracking-wide">Condition</TableHead>
                    <TableHead className="w-[120px] font-semibold text-neutral-700 text-xs uppercase tracking-wide">Status</TableHead>
                    <TableHead className="w-[120px] font-semibold text-neutral-700 text-xs uppercase tracking-wide">Location</TableHead>
                    <TableHead className="w-[100px] font-semibold text-neutral-700 text-xs uppercase tracking-wide text-right">Value</TableHead>
                    <TableHead className="w-[60px] font-semibold text-neutral-700 text-xs uppercase tracking-wide text-center"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assets.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-12 text-neutral-500">
                        <div className="flex flex-col items-center gap-2">
                          <Package className="h-8 w-8 text-neutral-300" />
                          <span>No assets found</span>
                          {(searchTerm || categoryFilter !== 'all' || statusFilter !== 'all') && (
                            <span className="text-xs text-neutral-400">Try adjusting your filters</span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    assets.map((asset) => {
                      const statusBgClass = asset.status === 'Available' 
                        ? 'bg-emerald-50/40 dark:bg-emerald-950/20' 
                        : asset.status === 'InUse' 
                        ? 'bg-blue-50/40 dark:bg-blue-950/20' 
                        : 'bg-amber-50/40 dark:bg-amber-950/20'
                      const statusBorderClass = asset.status === 'Available' 
                        ? 'border-l-emerald-400' 
                        : asset.status === 'InUse' 
                        ? 'border-l-blue-400' 
                        : 'border-l-amber-400'
                      
                      return (
                        <TableRow 
                          key={asset.id} 
                          className={`hover:bg-neutral-50/60 dark:hover:bg-neutral-900/20 transition-colors border-l-4 ${statusBorderClass} ${statusBgClass}`}
                        >
                          <TableCell className="font-mono text-xs font-semibold text-neutral-700">{asset.assetCode}</TableCell>
                          <TableCell>
                            <div className="space-y-0.5">
                              <div className="font-medium text-neutral-900">{asset.name}</div>
                              {asset.serialNumber && (
                                <div className="text-[11px] text-neutral-500 font-mono">{asset.serialNumber}</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-neutral-600 text-sm">{asset.category}</TableCell>
                          <TableCell>{getConditionBadge(asset.condition)}</TableCell>
                          <TableCell>{getStatusBadge(asset.status)}</TableCell>
                          <TableCell className="text-neutral-600 text-sm">{asset.location || '-'}</TableCell>
                          <TableCell className="text-neutral-600 text-sm text-right font-medium">
                            {asset.currentValue ? `$${asset.currentValue.toLocaleString()}` : '-'}
                          </TableCell>
                          <TableCell className="text-center">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-neutral-500 hover:text-neutral-900">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleView(asset)}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleEdit(asset)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit Asset
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDelete(asset)} className="text-red-600 focus:text-red-600">
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete Asset
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Asset Details</DialogTitle>
            <DialogDescription>
              View detailed information about this asset
            </DialogDescription>
          </DialogHeader>
          {selectedAssetDetails && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-medium uppercase text-slate-500">Asset Code</Label>
                  <div className="text-lg font-semibold text-slate-900">{selectedAssetDetails.assetCode}</div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium uppercase text-slate-500">Category</Label>
                  <div className="text-lg font-semibold text-slate-900">{selectedAssetDetails.category}</div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-xs font-medium uppercase text-slate-500">Asset Name</Label>
                <div className="text-lg font-semibold text-slate-900">{selectedAssetDetails.name}</div>
              </div>
              
              {selectedAssetDetails.description && (
                <div className="space-y-2">
                  <Label className="text-xs font-medium uppercase text-slate-500">Description</Label>
                  <div className="text-slate-700">{selectedAssetDetails.description}</div>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-medium uppercase text-slate-500">Serial Number</Label>
                  <div className="text-slate-700">{selectedAssetDetails.serialNumber || '-'}</div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium uppercase text-slate-500">Purchase Date</Label>
                  <div className="text-slate-700">{selectedAssetDetails.purchaseDate || '-'}</div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-medium uppercase text-slate-500">Purchase Price</Label>
                  <div className="text-lg font-semibold text-slate-900">
                    {selectedAssetDetails.purchasePrice ? `$${selectedAssetDetails.purchasePrice.toLocaleString()}` : '-'}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium uppercase text-slate-500">Current Value</Label>
                  <div className="text-lg font-semibold text-slate-900">
                    {selectedAssetDetails.currentValue ? `$${selectedAssetDetails.currentValue.toLocaleString()}` : '-'}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-medium uppercase text-slate-500">Condition</Label>
                  {getConditionBadge(selectedAssetDetails.condition)}
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium uppercase text-slate-500">Status</Label>
                  {getStatusBadge(selectedAssetDetails.status)}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-medium uppercase text-slate-500">Location</Label>
                  <div className="text-slate-700">{selectedAssetDetails.location || '-'}</div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium uppercase text-slate-500">Assigned To</Label>
                  <div className="text-slate-700">{selectedAssetDetails.assignedTo || '-'}</div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseViewDialog}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Asset</DialogTitle>
            <DialogDescription>
              Update the details of this asset
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Asset Name *</Label>
                  <Input
                    id="edit-name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter asset name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-category">Category *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger id="edit-category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Electronics">Electronics</SelectItem>
                      <SelectItem value="Furniture">Furniture</SelectItem>
                      <SelectItem value="Equipment">Equipment</SelectItem>
                      <SelectItem value="Vehicles">Vehicles</SelectItem>
                      <SelectItem value="Books">Books</SelectItem>
                      <SelectItem value="Supplies">Supplies</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter asset description"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-serialNumber">Serial Number</Label>
                  <Input
                    id="edit-serialNumber"
                    value={formData.serialNumber}
                    onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                    placeholder="Enter serial number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-purchaseDate">Purchase Date</Label>
                  <Input
                    id="edit-purchaseDate"
                    type="date"
                    value={formData.purchaseDate}
                    onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-purchasePrice">Purchase Price</Label>
                  <Input
                    id="edit-purchasePrice"
                    type="number"
                    step="0.01"
                    value={formData.purchasePrice}
                    onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-currentValue">Current Value</Label>
                  <Input
                    id="edit-currentValue"
                    type="number"
                    step="0.01"
                    value={formData.currentValue}
                    onChange={(e) => setFormData({ ...formData, currentValue: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-condition">Condition *</Label>
                  <Select
                    value={formData.condition}
                    onValueChange={(value) => setFormData({ ...formData, condition: value })}
                  >
                    <SelectTrigger id="edit-condition">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Excellent">Excellent</SelectItem>
                      <SelectItem value="Good">Good</SelectItem>
                      <SelectItem value="Fair">Fair</SelectItem>
                      <SelectItem value="Poor">Poor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-status">Status *</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger id="edit-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Available">Available</SelectItem>
                      <SelectItem value="InUse">In Use</SelectItem>
                      <SelectItem value="Maintenance">Maintenance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-location">Location</Label>
                  <Input
                    id="edit-location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Enter location"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-assignedTo">Assigned To</Label>
                  <Input
                    id="edit-assignedTo"
                    value={formData.assignedTo}
                    onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                    placeholder="Enter assignee"
                  />
                </div>
              </div>
            </div>
            {submitError && (
              <div className="text-sm text-red-600 mb-4">{submitError}</div>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseEditDialog}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Asset'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Asset</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this asset? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {selectedAsset && (
            <div className="py-4">
              <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <Package className="h-8 w-8 text-slate-500" />
                <div>
                  <div className="font-medium text-slate-900">{selectedAsset.name}</div>
                  <div className="text-sm text-slate-500">{selectedAsset.assetCode}</div>
                </div>
              </div>
            </div>
          )}
          {submitError && (
            <div className="text-sm text-red-600 mb-4">{submitError}</div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDeleteDialog}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete Asset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}

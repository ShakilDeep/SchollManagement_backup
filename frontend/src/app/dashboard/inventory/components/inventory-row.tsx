'use client'

import { memo } from 'react'
import { Badge } from '@/components/ui/badge'
import { useInventoryPrediction } from '@/hooks/use-inventory-prediction'
import { TableCell, TableRow } from '@/components/ui/table'
import { InventoryPredictionBadge } from '@/components/inventory/inventory-prediction-badge'
import { cn } from '@/lib/utils'
import { MoreVertical, Eye, Edit, Trash2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'

interface Asset {
  id: string
  assetCode: string
  name: string
  category: string
  status: 'Available' | 'InUse' | 'Maintenance'
  condition: 'Excellent' | 'Good' | 'Fair' | 'Poor'
  location?: string
  currentValue?: number
  serialNumber?: string
}

interface InventoryRowProps {
  asset: Asset
  onEdit: (asset: Asset) => void
  onView: (asset: Asset) => void
  onDelete: (asset: Asset) => void
  getConditionBadge: (condition: string) => React.ReactNode
  getStatusBadge: (status: string) => React.ReactNode
}

export const InventoryRow = memo(({ asset, onEdit, onView, onDelete, getConditionBadge, getStatusBadge }: InventoryRowProps) => {
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
  
  const { data: prediction, isLoading: predictionLoading } = useInventoryPrediction(asset.id)

  return (
    <TableRow 
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
        {asset.currentValue ? formatCurrency(asset.currentValue) : '-'}
      </TableCell>
      <TableCell className="text-center">
        <InventoryPredictionBadge prediction={prediction} isLoading={predictionLoading} />
      </TableCell>
      <TableCell className="text-center">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-neutral-500 hover:text-neutral-900">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onView(asset)}>
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(asset)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Asset
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDelete(asset)} className="text-red-600 focus:text-red-600">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Asset
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  )
})

InventoryRow.displayName = 'InventoryRow'

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(value)
}

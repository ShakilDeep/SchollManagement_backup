'use client'

import * as React from 'react'
import { ChevronLeft, ChevronRight, MoreHorizontal, Search, Filter, RefreshCw } from 'lucide-react'
import { Table, TableHeader, TableBody, TableFooter, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export interface Column<T> {
  id: string
  header: string
  accessor?: keyof T | ((item: T) => any)
  sortable?: boolean
  filterable?: boolean
  cell?: (item: T) => React.ReactNode
  width?: string
}

export interface Action<T> {
  label: string
  onClick: (item: T) => void
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  icon?: React.ReactNode
}

export interface DataGridProps<T> {
  data: T[]
  columns: Column<T>[]
  loading?: boolean
  actions?: Action<T>[]
  pagination?: {
    page: number
    pageSize: number
    total: number
    totalPages: number
    onPageChange: (page: number) => void
    onPageSizeChange: (pageSize: number) => void
  }
  search?: {
    value: string
    onChange: (value: string) => void
    placeholder?: string
  }
  filters?: React.ReactNode
  onRefresh?: () => void
  emptyMessage?: string
  className?: string
  rowClassName?: (item: T, index: number) => string | undefined
}

export function DataGrid<T extends Record<string, any>>({
  data,
  columns,
  loading = false,
  actions,
  pagination,
  search,
  filters,
  onRefresh,
  emptyMessage = 'No data found',
  className,
  rowClassName,
}: DataGridProps<T>) {
  const [sortColumn, setSortColumn] = React.useState<string | null>(null)
  const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc'>('asc')
  const [openMenuId, setOpenMenuId] = React.useState<string | null>(null)

  const handleSort = (columnId: string) => {
    const column = columns.find((c) => c.id === columnId)
    if (!column?.sortable) return

    if (sortColumn === columnId) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(columnId)
      setSortOrder('asc')
    }
  }

  const getCellValue = (item: T, column: Column<T>) => {
    if (column.cell) return column.cell(item)
    if (column.accessor) {
      if (typeof column.accessor === 'function') {
        return column.accessor(item)
      }
      return item[column.accessor]
    }
    return null
  }

  const getSortIcon = (columnId: string) => {
    if (sortColumn !== columnId) return null
    return sortOrder === 'asc' ? '↑' : '↓'
  }

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {(search || filters || onRefresh) && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {search && (
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={search.placeholder || 'Search...'}
                value={search.value}
                onChange={(e) => search.onChange(e.target.value)}
                className="pl-9"
              />
            </div>
          )}
          <div className="flex items-center gap-2">
            {filters}
            {onRefresh && (
              <Button variant="outline" size="icon" onClick={onRefresh} disabled={loading}>
                <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
              </Button>
            )}
          </div>
        </div>
      )}

      <div className="relative border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead
                  key={column.id}
                  className={cn(
                    column.sortable && 'cursor-pointer hover:bg-muted/50 select-none',
                    column.width
                  )}
                  onClick={() => column.sortable && handleSort(column.id)}
                >
                  <div className="flex items-center gap-1">
                    {column.header}
                    {getSortIcon(column.id)}
                  </div>
                </TableHead>
              ))}
              {actions && <TableHead className="w-[50px]">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length + (actions ? 1 : 0)} className="h-24 text-center">
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Loading...
                  </div>
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length + (actions ? 1 : 0)} className="h-24 text-center text-muted-foreground">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              data.map((item, index) => (
                <TableRow key={item.id || index} className={rowClassName?.(item, index)}>
                  {columns.map((column) => (
                    <TableCell key={column.id}>
                      {getCellValue(item, column)}
                    </TableCell>
                  ))}
                  {actions && (
                    <TableCell>
                      <div className="relative">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setOpenMenuId(openMenuId === (item.id as string) ? null : item.id as string)}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                        {openMenuId === (item.id as string) && (
                          <div className="absolute right-0 top-full z-50 min-w-[150px] rounded-md border bg-popover p-1 shadow-md">
                            {actions.map((action, idx) => (
                              <button
                                key={idx}
                                onClick={() => {
                                  action.onClick(item)
                                  setOpenMenuId(null)
                                }}
                                className={cn(
                                  'flex w-full items-center gap-2 px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground',
                                  action.variant === 'destructive' && 'text-destructive hover:bg-destructive/10'
                                )}
                              >
                                {action.icon}
                                {action.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
          {pagination && (
            <TableFooter>
              <TableRow>
                <TableCell colSpan={columns.length + (actions ? 1 : 0)} className="p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>Showing</span>
                      <Select
                        value={String(pagination.pageSize)}
                        onValueChange={(v) => pagination.onPageSizeChange(Number(v))}
                      >
                        <SelectTrigger className="h-8 w-[70px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[10, 20, 50, 100].map((size) => (
                            <SelectItem key={size} value={String(size)}>
                              {size}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <span>per page</span>
                      <span className="hidden sm:inline">•</span>
                      <span className="hidden sm:inline">Total: {pagination.total}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => pagination.onPageChange(pagination.page - 1)}
                        disabled={pagination.page === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                          let pageNum: number
                          if (pagination.totalPages <= 5) {
                            pageNum = i + 1
                          } else if (pagination.page <= 3) {
                            pageNum = i + 1
                          } else if (pagination.page >= pagination.totalPages - 2) {
                            pageNum = pagination.totalPages - 4 + i
                          } else {
                            pageNum = pagination.page - 2 + i
                          }
                          return (
                            <Button
                              key={pageNum}
                              variant={pagination.page === pageNum ? 'default' : 'outline'}
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => pagination.onPageChange(pageNum)}
                            >
                              {pageNum}
                            </Button>
                          )
                        })}
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => pagination.onPageChange(pagination.page + 1)}
                        disabled={pagination.page === pagination.totalPages}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            </TableFooter>
          )}
        </Table>
      </div>
    </div>
  )
}

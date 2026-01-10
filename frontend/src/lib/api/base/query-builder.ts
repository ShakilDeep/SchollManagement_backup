import { Prisma } from '@prisma/client'
import { startOfDay, endOfDay } from 'date-fns'

export type FilterOperator = 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'in' | 'between'

export interface FilterConfig {
  field: string
  operator?: FilterOperator
  type?: 'string' | 'number' | 'date' | 'boolean' | 'enum'
}

export interface QueryBuilderOptions {
  searchFields?: string[]
  filterFields?: Record<string, FilterConfig>
  defaultSort?: string
  defaultSortOrder?: 'asc' | 'desc'
  include?: Prisma.Include<Record<string, never>>
  select?: Prisma.Select<Record<string, never>>
}

export class QueryBuilder<T = unknown> {
  private where: Prisma.Enumerable<Prisma.WhereInput> = {}
  private orderBy: Prisma.Enumerable<Prisma.OrderByWithRelationInput> = {}
  private skip?: number
  private take?: number
  private include?: Prisma.Include<Record<string, never>>
  private select?: Prisma.Select<Record<string, never>>
  private searchFields: string[] = []
  private filterFields: Record<string, FilterConfig> = {}

  constructor(options: QueryBuilderOptions = {}) {
    this.searchFields = options.searchFields || []
    this.filterFields = options.filterFields || {}
    this.include = options.include
    this.select = options.select
    if (options.defaultSort) {
      this.orderBy = { [options.defaultSort]: options.defaultSortOrder || 'asc' }
    }
  }

  withSearch(search: string | null | undefined): this {
    if (!search) return this

    if (this.searchFields.length === 0) {
      return this
    }

    const conditions = this.searchFields.map((field) => ({
      [field]: { contains: search },
    }))

    this.where = {
      ...this.where,
      OR: conditions,
    }

    return this
  }

  withFilters(filters: Record<string, string | string[] | undefined>): this {
    Object.entries(filters).forEach(([key, value]) => {
      if (value === undefined || value === '' || value === 'all') {
        return
      }

      const config = this.filterFields[key]
      if (!config) {
        return
      }

      const operator = config.operator || 'eq'
      const type = config.type || 'string'

      const condition = this.buildCondition(config.field, value, operator, type)
      this.where = { ...this.where, ...condition }
    })

    return this
  }

  private buildCondition(
    field: string,
    value: string | string[],
    operator: FilterOperator,
    type: string
  ): Prisma.WhereInput {
    switch (operator) {
      case 'eq':
        return { [field]: type === 'boolean' ? value === 'true' : value }
      case 'ne':
        return { [field]: { not: value } }
      case 'gt':
        return { [field]: { gt: type === 'date' ? new Date(value) : Number(value) } }
      case 'gte':
        return { [field]: { gte: type === 'date' ? new Date(value) : Number(value) } }
      case 'lt':
        return { [field]: { lt: type === 'date' ? new Date(value) : Number(value) } }
      case 'lte':
        return { [field]: { lte: type === 'date' ? new Date(value) : Number(value) } }
      case 'contains':
        return { [field]: { contains: value } }
      case 'in':
        const values = Array.isArray(value) ? value : [value]
        return { [field]: { in: values } }
      case 'between':
        const [start, end] = Array.isArray(value) ? value : value.split(',')
        if (type === 'date') {
          return {
            [field]: {
              gte: startOfDay(new Date(start)),
              lte: endOfDay(new Date(end)),
            },
          }
        }
        return {
          [field]: { gte: Number(start), lte: Number(end) },
        }
      default:
        return { [field]: value }
    }
  }

  withSort(sortBy?: string | null, sortOrder?: 'asc' | 'desc' | null): this {
    if (sortBy) {
      this.orderBy = { [sortBy]: sortOrder || 'asc' }
    }
    return this
  }

  withPagination(page?: number | null, pageSize?: number | null): this {
    if (page !== undefined && page !== null && pageSize !== undefined && pageSize !== null) {
      this.skip = (page - 1) * pageSize
      this.take = pageSize
    }
    return this
  }

  withInclude(include: Prisma.Include<Record<string, never>>): this {
    this.include = { ...this.include, ...include }
    return this
  }

  withSelect(select: Prisma.Select<Record<string, never>>): this {
    this.select = { ...this.select, ...select }
    return this
  }

  buildFindMany(): Prisma.FindManyArgs {
    return {
      where: this.where as Prisma.WhereInput,
      orderBy: this.orderBy,
      skip: this.skip,
      take: this.take,
      include: this.include,
      select: this.select,
    }
  }

  buildFindFirst(): Prisma.FindFirstArgs {
    return {
      where: this.where as Prisma.WhereInput,
      include: this.include,
      select: this.select,
    }
  }

  buildFindUnique(id: string): Prisma.FindUniqueArgs {
    return {
      where: { id },
      include: this.include,
      select: this.select,
    }
  }

  buildCount(): Prisma.FindManyArgs {
    return {
      where: this.where as Prisma.WhereInput,
    }
  }
}

export function createQueryBuilder<T = unknown>(
  options: QueryBuilderOptions = {}
): QueryBuilder<T> {
  return new QueryBuilder<T>(options)
}

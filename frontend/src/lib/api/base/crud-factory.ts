import { z } from 'zod'
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'
import { QueryBuilder, QueryBuilderOptions, FilterConfig } from './query-builder'
import {
  success,
  error,
  notFound,
  badRequest,
  created,
  noContent,
  internalError,
  handleApiError,
} from './api-handler'

export interface ResourceConfig<T = unknown> {
  model: keyof typeof db
  resourceName: string
  pluralName?: string
  searchFields?: string[]
  filterFields?: Record<string, FilterConfig>
  defaultSort?: string
  defaultSortOrder?: 'asc' | 'desc'
  include?: Prisma.Include<Record<string, never>>
  select?: Prisma.Select<Record<string, never>>
  validationSchema?: z.ZodSchema
  createSchema?: z.ZodSchema
  updateSchema?: z.ZodSchema
  transformCreate?: (data: any) => any
  transformUpdate?: (data: any) => any
  transformResponse?: (data: any) => any
  beforeCreate?: (data: any) => Promise<any>
  afterCreate?: (data: any) => Promise<void>
  beforeUpdate?: (id: string, data: any) => Promise<any>
  afterUpdate?: (id: string, data: any) => Promise<void>
  beforeDelete?: (id: string) => Promise<void>
  afterDelete?: (id: string) => Promise<void>
}

export interface CrudHandlers<T = unknown> {
  GET: (request: NextRequest) => Promise<ReturnType<typeof success | typeof error>>
  POST: (request: NextRequest) => Promise<ReturnType<typeof created | typeof error>>
  PUT?: (request: NextRequest, params: { id: string }) => Promise<ReturnType<typeof success | typeof error>>
  PATCH?: (request: NextRequest, params: { id: string }) => Promise<ReturnType<typeof success | typeof error>>
  DELETE?: (request: NextRequest, params: { id: string }) => Promise<ReturnType<typeof noContent | typeof error>>
}

export class CRUDFactory<T = unknown> {
  private config: ResourceConfig<T>

  constructor(config: ResourceConfig<T>) {
    this.config = {
      pluralName: `${config.resourceName}s`,
      defaultSort: 'createdAt',
      defaultSortOrder: 'desc',
      ...config,
    }
  }

  private get model() {
    return db[this.config.model as keyof typeof db] as any
  }

  private get resourceName() {
    return this.config.resourceName
  }

  private get pluralName() {
    return this.config.pluralName!
  }

  private transformResponse(data: any): any {
    if (this.config.transformResponse) {
      return this.config.transformResponse(data)
    }
    return data
  }

  private async validate(data: any, schema: z.ZodSchema | undefined): Promise<any> {
    if (!schema) return data
    return schema.parseAsync(data)
  }

  GET = async (request: NextRequest): Promise<ReturnType<typeof success | typeof error>> => {
    return handleApiError(async () => {
      const { searchParams } = new URL(request.url)

      const search = searchParams.get('search')
      const page = searchParams.get('page')
      const pageSize = searchParams.get('pageSize')
      const sortBy = searchParams.get('sortBy')
      const sortOrder = searchParams.get('sortOrder') as 'asc' | 'desc' | null

      const queryBuilderOptions: QueryBuilderOptions = {
        searchFields: this.config.searchFields,
        filterFields: this.config.filterFields,
        defaultSort: this.config.defaultSort,
        defaultSortOrder: this.config.defaultSortOrder,
        include: this.config.include,
        select: this.config.select,
      }

      const queryBuilder = new QueryBuilder(queryBuilderOptions)
        .withSearch(search)
        .withFilters(Object.fromEntries(searchParams))
        .withSort(sortBy, sortOrder)
        .withPagination(page ? Number(page) : undefined, pageSize ? Number(pageSize) : undefined)

      const findManyArgs = queryBuilder.buildFindMany()

      const [data, total] = await Promise.all([
        this.model.findMany(findManyArgs),
        this.model.count({ where: findManyArgs.where }),
      ])

      const transformedData = Array.isArray(data)
        ? data.map((item: any) => this.transformResponse(item))
        : this.transformResponse(data)

      if (page && pageSize) {
        return success({
          data: transformedData,
          pagination: {
            page: Number(page),
            pageSize: Number(pageSize),
            total,
            totalPages: Math.ceil(total / Number(pageSize)),
          },
        })
      }

      return success(transformedData)
    }, `GET /${this.pluralName}`)
  }

  POST = async (request: NextRequest): Promise<ReturnType<typeof created | typeof error>> => {
    return handleApiError(async () => {
      const body = await request.json()

      let validatedData = await this.validate(body, this.config.createSchema || this.config.validationSchema)

      if (this.config.transformCreate) {
        validatedData = this.config.transformCreate(validatedData)
      }

      if (this.config.beforeCreate) {
        validatedData = await this.config.beforeCreate(validatedData)
      }

      const createdRecord = await this.model.create({
        data: validatedData,
        include: this.config.include,
      })

      if (this.config.afterCreate) {
        await this.config.afterCreate(createdRecord)
      }

      return created(this.transformResponse(createdRecord))
    }, `POST /${this.pluralName}`)
  }

  PUT = async (
    request: NextRequest,
    params: { id: string }
  ): Promise<ReturnType<typeof success | typeof error>> => {
    const { id } = params
    return handleApiError(async () => {
      const body = await request.json()

      const existing = await this.model.findUnique({ where: { id } })
      if (!existing) {
        return notFound(this.resourceName)
      }

      let validatedData = await this.validate(body, this.config.updateSchema || this.config.validationSchema)

      if (this.config.transformUpdate) {
        validatedData = this.config.transformUpdate(validatedData)
      }

      if (this.config.beforeUpdate) {
        validatedData = await this.config.beforeUpdate(id, validatedData)
      }

      const updated = await this.model.update({
        where: { id },
        data: validatedData,
        include: this.config.include,
      })

      if (this.config.afterUpdate) {
        await this.config.afterUpdate(id, updated)
      }

      return success(this.transformResponse(updated))
    }, `PUT /${this.pluralName}/${id}`)
  }

  PATCH = async (
    request: NextRequest,
    params: { id: string }
  ): Promise<ReturnType<typeof success | typeof error>> => {
    const { id } = params
    return handleApiError(async () => {
      const body = await request.json()

      const existing = await this.model.findUnique({ where: { id } })
      if (!existing) {
        return notFound(this.resourceName)
      }

      let validatedData = await this.validate(body, this.config.updateSchema || this.config.validationSchema)

      if (this.config.transformUpdate) {
        validatedData = this.config.transformUpdate(validatedData)
      }

      if (this.config.beforeUpdate) {
        validatedData = await this.config.beforeUpdate(id, validatedData)
      }

      const updated = await this.model.update({
        where: { id },
        data: validatedData,
        include: this.config.include,
      })

      if (this.config.afterUpdate) {
        await this.config.afterUpdate(id, updated)
      }

      return success(this.transformResponse(updated))
    }, `PATCH /${this.pluralName}/${id}`)
  }

  DELETE = async (
    request: NextRequest,
    params: { id: string }
  ): Promise<ReturnType<typeof noContent | typeof error>> => {
    const { id } = params
    return handleApiError(async () => {

      const existing = await this.model.findUnique({ where: { id } })
      if (!existing) {
        return notFound(this.resourceName)
      }

      if (this.config.beforeDelete) {
        await this.config.beforeDelete(id)
      }

      await this.model.delete({ where: { id } })

      if (this.config.afterDelete) {
        await this.config.afterDelete(id)
      }

      return noContent()
    }, `DELETE /${this.pluralName}/${id}`)
  }

  getHandlers(): CrudHandlers<T> {
    return {
      GET: this.GET,
      POST: this.POST,
      PUT: this.PUT,
      PATCH: this.PATCH,
      DELETE: this.DELETE,
    }
  }
}

export function createCRUDRoute<T = unknown>(config: ResourceConfig<T>): CrudHandlers<T> {
  const factory = new CRUDFactory<T>(config)
  return factory.getHandlers()
}

export function createReadonlyRoute<T = unknown>(config: ResourceConfig<T>): Pick<CrudHandlers<T>, 'GET'> {
  const factory = new CRUDFactory<T>(config)
  return {
    GET: factory.GET,
  }
}

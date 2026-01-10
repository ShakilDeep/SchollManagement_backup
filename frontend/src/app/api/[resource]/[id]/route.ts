import { NextRequest } from 'next/server'
import { getResourceConfigByPlural } from '@/lib/api/base/resource-configs'
import { createCRUDRoute } from '@/lib/api/base/crud-factory'
import { db } from '@/lib/db'

function toCamelCase(str: string): string {
  return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase())
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ resource: string; id: string }> }
) {
  const { resource, id } = await params
  const camelCaseResource = toCamelCase(resource)
  const config = getResourceConfigByPlural(camelCaseResource) || getResourceConfig(camelCaseResource)

  if (!config) {
    return new Response('Resource not found', { status: 404 })
  }

  try {
    const model = db[config.model as keyof typeof db] as any
    const data = await model.findUnique({
      where: { id },
      include: config.include,
      select: config.select,
    })

    if (!data) {
      return new Response('Not found', { status: 404 })
    }

    const transformed = config.transformResponse ? config.transformResponse(data) : data
    return Response.json({ success: true, data: transformed })
  } catch (error: any) {
    console.error('Error fetching resource:', error)
    return Response.json(
      { success: false, error: { message: error.message || 'Failed to fetch resource' } },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ resource: string; id: string }> }
) {
  const { resource, id } = await params
  const camelCaseResource = toCamelCase(resource)
  const config = getResourceConfigByPlural(camelCaseResource) || getResourceConfig(camelCaseResource)

  if (!config) {
    return new Response('Resource not found', { status: 404 })
  }

  const handlers = createCRUDRoute(config)
  if (!handlers.PUT) {
    return new Response('Method not allowed', { status: 405 })
  }

  return handlers.PUT(request, { id })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ resource: string; id: string }> }
) {
  const { resource, id } = await params
  const camelCaseResource = toCamelCase(resource)
  const config = getResourceConfigByPlural(camelCaseResource) || getResourceConfig(camelCaseResource)

  if (!config) {
    return new Response('Resource not found', { status: 404 })
  }

  const handlers = createCRUDRoute(config)
  if (!handlers.PATCH) {
    return new Response('Method not allowed', { status: 405 })
  }

  return handlers.PATCH(request, { id })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ resource: string; id: string }> }
) {
  const { resource, id } = await params
  const camelCaseResource = toCamelCase(resource)
  const config = getResourceConfigByPlural(camelCaseResource) || getResourceConfig(camelCaseResource)

  if (!config) {
    return new Response('Resource not found', { status: 404 })
  }

  const handlers = createCRUDRoute(config)
  if (!handlers.DELETE) {
    return new Response('Method not allowed', { status: 405 })
  }

  return handlers.DELETE(request, { id })
}

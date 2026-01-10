import { NextRequest } from 'next/server'
import { getResourceConfigByPlural, getResourceConfig } from '@/lib/api/base/resource-configs'
import { createCRUDRoute } from '@/lib/api/base/crud-factory'

function toCamelCase(str: string): string {
  return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase())
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ resource: string }> }
) {
  const { resource } = await params
  const camelCaseResource = toCamelCase(resource)
  const config = getResourceConfigByPlural(camelCaseResource) || getResourceConfig(camelCaseResource)

  if (!config) {
    return new Response('Resource not found', { status: 404 })
  }

  const handlers = createCRUDRoute(config)
  return handlers.GET(request)
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ resource: string }> }
) {
  const { resource } = await params
  const camelCaseResource = toCamelCase(resource)
  const config = getResourceConfigByPlural(camelCaseResource) || getResourceConfig(camelCaseResource)

  if (!config) {
    return new Response('Resource not found', { status: 404 })
  }

  const handlers = createCRUDRoute(config)
  return handlers.POST(request)
}

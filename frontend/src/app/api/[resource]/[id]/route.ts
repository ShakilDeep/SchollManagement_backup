import { NextRequest } from 'next/server'
import { getResourceConfigByPlural, getResourceConfig } from '@/lib/api/base/resource-configs'
import { fetchAPI } from '@/lib/api/client'

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
    // Use backend API endpoint
    const endpoint = `/${config.endpoint || resource}/${id}/`
    const data = await fetchAPI<any>(endpoint)

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

  try {
    const endpoint = `/${config.endpoint || resource}/${id}/`
    const body = await request.json()

    // Transform data if needed
    const transformedBody = config.transformUpdate ? config.transformUpdate(body) : body

    const data = await fetchAPI(endpoint, {
      method: 'PUT',
      body: JSON.stringify(transformedBody)
    })

    const transformed = config.transformResponse ? config.transformResponse(data) : data
    return Response.json({ success: true, data: transformed })
  } catch (error: any) {
    console.error('Error updating resource:', error)
    return Response.json(
      { success: false, error: { message: error.message || 'Failed to update resource' } },
      { status: 500 }
    )
  }
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

  try {
    const endpoint = `/${config.endpoint || resource}/${id}/`
    const body = await request.json()

    // Transform data if needed
    const transformedBody = config.transformUpdate ? config.transformUpdate(body) : body

    const data = await fetchAPI(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(transformedBody)
    })

    const transformed = config.transformResponse ? config.transformResponse(data) : data
    return Response.json({ success: true, data: transformed })
  } catch (error: any) {
    console.error('Error updating resource:', error)
    return Response.json(
      { success: false, error: { message: error.message || 'Failed to update resource' } },
      { status: 500 }
    )
  }
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

  try {
    const endpoint = `/${config.endpoint || resource}/${id}/`

    await fetchAPI(endpoint, {
      method: 'DELETE'
    })

    return Response.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting resource:', error)
    return Response.json(
      { success: false, error: { message: error.message || 'Failed to delete resource' } },
      { status: 500 }
    )
  }
}

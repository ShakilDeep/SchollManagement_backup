import { NextRequest, NextResponse } from 'next/server'
import { fetchAPI } from '@/lib/api/client'

function toCamelCase(str: string): string {
  return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase())
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ resource: string }> }
) {
  const { resource } = await params
  const camelCaseResource = toCamelCase(resource)
  
  try {
    const searchParams = request.nextUrl.searchParams
    const queryString = searchParams.toString()
    const endpoint = queryString ? `/${resource}/?${queryString}` : `/${resource}/`
    const cookies = request.headers.get('cookie') || undefined
    
    const data = await fetchAPI(endpoint, { cookies })
    return NextResponse.json(data)
  } catch (error) {
    console.error(`GET /${camelCaseResource} error:`, error)
    return new NextResponse(
      JSON.stringify({ error: 'Failed to fetch resource' }),
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ resource: string }> }
) {
  const { resource } = await params
  const camelCaseResource = toCamelCase(resource)
  
  try {
    const body = await request.json()
    const cookies = request.headers.get('cookie') || undefined
    const data = await fetchAPI(`/${resource}/`, {
      method: 'POST',
      body: JSON.stringify(body),
      cookies,
    })
    
    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error(`POST /${camelCaseResource} error:`, error)
    return new NextResponse(
      JSON.stringify({ error: 'Failed to create resource' }),
      { status: 500 }
    )
  }
}

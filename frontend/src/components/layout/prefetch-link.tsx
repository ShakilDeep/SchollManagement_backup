'use client'

import { useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { cn } from '@/lib/utils'
import { PrefetchQueryConfig } from '@/lib/route-prefetch-config'

interface PrefetchLinkProps {
  href: string
  prefetchQueryConfigs?: PrefetchQueryConfig[]
  children: React.ReactNode
  className?: string
  onClick?: () => void
}

export function PrefetchLink({ href, prefetchQueryConfigs, children, className, onClick }: PrefetchLinkProps) {
  const queryClient = useQueryClient()
  const pathname = usePathname()
  const linkRef = useRef<HTMLAnchorElement>(null)
  const hasPrefetched = useRef(false)
  const isActive = pathname === href

  const handlePrefetch = () => {
    if (hasPrefetched.current) return
    hasPrefetched.current = true

    if (prefetchQueryConfigs) {
      prefetchQueryConfigs.forEach(config => {
        queryClient.prefetchQuery({
          queryKey: config.queryKey,
          queryFn: config.queryFn,
          staleTime: 1000 * 60 * 5,
        })
      })
    }
  }

  useEffect(() => {
    const linkElement = linkRef.current
    if (!linkElement) return

    const handleMouseEnter = () => {
      handlePrefetch()
    }

    linkElement.addEventListener('mouseenter', handleMouseEnter)
    return () => {
      linkElement.removeEventListener('mouseenter', handleMouseEnter)
    }
  }, [prefetchQueryConfigs])

  return (
    <Link
      ref={linkRef}
      href={href}
      className={className}
      onClick={onClick}
      prefetch={true}
    >
      {children}
    </Link>
  )
}

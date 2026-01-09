'use client'

import { memo } from 'react'
import { MessageSquare } from 'lucide-react'

interface MessageEmptyStateProps {
  folder: 'inbox' | 'sent'
}

export const MessageEmptyState = memo(({ folder }: MessageEmptyStateProps) => {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <MessageSquare className="h-16 w-16 text-slate-200 dark:text-slate-700 mx-auto mb-4" />
        <h2 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
          {folder === 'inbox' ? 'No message selected' : 'No sent message selected'}
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {folder === 'inbox'
            ? 'Select a message from the inbox to view its details'
            : 'Select a sent message to view its details'}
        </p>
      </div>
    </div>
  )
})

'use client'

import { memo } from 'react'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import type { Message } from '../page'

interface MessageListItemProps {
  message: Message
  isSelected: boolean
  onClick: (message: Message) => void
  getPriorityColor: (priority: string) => string
  formatTimestamp: (date: Date) => string
  getInitials: (name: string | null) => string
}

export const MessageListItem = memo(({ message, isSelected, onClick, getPriorityColor, formatTimestamp, getInitials }: MessageListItemProps) => {
  return (
    <button
      onClick={() => onClick(message)}
      className={cn(
        'w-full p-4 text-left transition-colors hover:bg-slate-100 dark:hover:bg-slate-800/50',
        isSelected && 'bg-slate-100 dark:bg-slate-800/50',
        !message.isRead && 'bg-blue-50/30 dark:bg-blue-950/20'
      )}
    >
      <div className="flex items-start gap-3">
        <Avatar className="h-9 w-9 flex-shrink-0">
          <AvatarImage src={message.sender.avatar || undefined} />
          <AvatarFallback className="text-xs">
            {getInitials(message.sender.name)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <span
              className={cn(
                'text-sm font-medium truncate',
                !message.isRead && 'font-semibold text-slate-900 dark:text-white'
              )}
            >
              {message.sender.name || message.sender.email}
            </span>
            <span className="text-xs text-slate-400 flex-shrink-0">
              {formatTimestamp(message.createdAt)}
            </span>
          </div>
          <div className="flex items-center gap-2 mb-1">
            {!message.isRead && (
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0" />
            )}
            <span
              className={cn(
                'text-sm truncate',
                !message.isRead ? 'font-medium text-slate-800 dark:text-slate-200' : 'text-slate-600 dark:text-slate-400'
              )}
            >
              {message.subject || '(No subject)'}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-500 truncate">
            {message.content}
          </p>
          <div className="mt-2">
            <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0', getPriorityColor(message.priority))}>
              {message.priority}
            </Badge>
          </div>
        </div>
      </div>
    </button>
  )
})

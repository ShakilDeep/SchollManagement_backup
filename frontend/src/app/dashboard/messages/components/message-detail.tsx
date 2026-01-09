'use client'

import { memo } from 'react'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Reply, Forward, Trash2, Check, Clock, MessageSquare } from 'lucide-react'
import type { Message } from '../page'

interface MessageDetailProps {
  message: Message
  onReply: () => void
  onDelete: () => void
  folder: 'inbox' | 'sent'
  getPriorityColor: (priority: string) => string
  formatTimestamp: (date: Date) => string
  getInitials: (name: string | null) => string
}

export const MessageDetail = memo(({ message, onReply, onDelete, folder, getPriorityColor, formatTimestamp, getInitials }: MessageDetailProps) => {
  return (
    <>
      <div className="p-6 border-b border-slate-200 dark:border-slate-700/50">
        <div className="flex items-start justify-between gap-4 mb-4">
          <h1 className="text-xl font-semibold text-slate-900 dark:text-white leading-tight">
            {message.subject || '(No subject)'}
          </h1>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={cn('text-xs', getPriorityColor(message.priority))}>
              {message.priority}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {message.type}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-3 mb-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={message.sender.avatar || undefined} />
            <AvatarFallback className="text-sm">
              {getInitials(message.sender.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-900 dark:text-white">
                {message.sender.name || message.sender.email}
              </span>
              {message.isRead && (
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Check className="h-3 w-3" />
                  Read
                </span>
              )}
            </div>
            <span className="text-xs text-slate-500">{message.sender.email}</span>
          </div>
          <div className="text-right text-xs text-slate-500">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatTimestamp(message.createdAt)}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-slate-500">
          <span>To:</span>
          <span className="text-slate-700 dark:text-slate-300">
            {message.receiver.name || message.receiver.email}
          </span>
        </div>
      </div>

      <ScrollArea className="flex-1 p-6">
        <div className="prose prose-slate dark:prose-invert max-w-none">
          {message.content.split('\n').map((paragraph, idx) => (
            <p key={idx} className="mb-4 leading-relaxed text-slate-700 dark:text-slate-300">
              {paragraph || <br />}
            </p>
          ))}
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-slate-200 dark:border-slate-700/50">
        <div className="flex items-center gap-3">
          <Button variant="default" size="sm" className="gap-2" onClick={onReply}>
            <Reply className="h-4 w-4" />
            Reply
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <Forward className="h-4 w-4" />
            Forward
          </Button>
          <div className="flex-1" />
          <Button
            variant="outline"
            size="sm"
            onClick={onDelete}
            className="gap-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>
    </>
  )
})

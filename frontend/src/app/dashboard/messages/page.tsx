'use client'

import { useState, useEffect, useMemo, useCallback, lazy, Suspense } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  Search,
  Send,
  Inbox,
  SendHorizontal,
  Mail,
  Sparkles,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { useDebouncedValue } from '@/hooks/use-debounced-value'

const MessageListItem = lazy(() => import('./components/message-list-item').then(m => ({ default: m.MessageListItem })))
const MessageDetail = lazy(() => import('./components/message-detail').then(m => ({ default: m.MessageDetail })))
const MessageEmptyState = lazy(() => import('./components/message-empty-state').then(m => ({ default: m.MessageEmptyState })))

type Message = {
  id: string
  senderId: string
  receiverId: string
  subject: string | null
  content: string
  type: string
  priority: string
  isRead: boolean
  readAt: Date | null
  createdAt: Date
  sender: {
    id: string
    name: string | null
    email: string
    avatar: string | null
  }
  receiver: {
    id: string
    name: string | null
    email: string
    avatar: string | null
  }
}

const CURRENT_USER_ID = 'cmk5xc4xt0011vqu49ighb5a6'

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'Urgent':
      return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'
    case 'High':
      return 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800'
    case 'Normal':
      return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800'
    case 'Low':
      return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800'
    default:
      return 'bg-gray-100 text-gray-700'
  }
}

const formatTimestamp = (date: Date) => {
  const now = new Date()
  const diff = now.getTime() - new Date(date).getTime()
  const hours = Math.floor(diff / (1000 * 60 * 60))

  if (hours < 1) {
    const minutes = Math.floor(diff / (1000 * 60))
    return minutes < 1 ? 'Just now' : `${minutes}m ago`
  }
  if (hours < 24) {
    return `${hours}h ago`
  }
  const days = Math.floor(hours / 24)
  if (days < 7) {
    return `${days}d ago`
  }
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const getInitials = (name: string | null) => {
  if (!name) return 'U'
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export default function MessagesPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null)
  const [folder, setFolder] = useState<'inbox' | 'sent'>('inbox')
  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearchTerm = useDebouncedValue(searchTerm, 300)
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [isComposeOpen, setIsComposeOpen] = useState(false)
  const [composeForm, setComposeForm] = useState({
    to: '',
    subject: '',
    content: '',
    priority: 'Normal',
  })
  const [aiSuggestion, setAiSuggestion] = useState('')
  const [aiLoading, setAiLoading] = useState(false)

  useEffect(() => {
    fetchMessages()
  }, [folder, priorityFilter])

  const fetchMessages = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        folder,
        userId: CURRENT_USER_ID,
      })

      if (priorityFilter !== 'all') {
        params.append('priority', priorityFilter)
      }

      const response = await fetch(`/api/messages?${params}`)
      if (!response.ok) throw new Error('Failed to fetch messages')
      const data = await response.json()
      setMessages(data)
    } catch (error) {
      console.error('Error fetching messages:', error)
    } finally {
      setLoading(false)
    }
  }, [folder, priorityFilter])

  const handleSelectMessage = useCallback(async (message: Message) => {
    setSelectedMessage(message)
    if (!message.isRead && folder === 'inbox') {
      try {
        await fetch(`/api/messages/${message.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isRead: true }),
        })
        setMessages((prev) =>
          prev.map((m) => (m.id === message.id ? { ...m, isRead: true, readAt: new Date() } : m))
        )
      } catch (error) {
        console.error('Error marking message as read:', error)
      }
    }
  }, [folder])

  const handleDeleteMessage = useCallback(async (messageId: string) => {
    if (!confirm('Are you sure you want to delete this message?')) return

    try {
      await fetch(`/api/messages/${messageId}`, { method: 'DELETE' })
      setMessages((prev) => prev.filter((m) => m.id !== messageId))
      if (selectedMessage?.id === messageId) {
        setSelectedMessage(null)
      }
    } catch (error) {
      console.error('Error deleting message:', error)
    }
  }, [selectedMessage])

  const handleSendMessage = useCallback(async () => {
    if (!composeForm.content) return
    const receiverId = selectedMessage ? selectedMessage.sender.id : composeForm.to
    if (!receiverId) return

    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: CURRENT_USER_ID,
          receiverId,
          subject: composeForm.subject || (selectedMessage ? `Re: ${selectedMessage.subject || ''}` : ''),
          content: composeForm.content,
          type: 'Direct',
          priority: composeForm.priority,
        }),
      })

      if (!response.ok) throw new Error('Failed to send message')

      setIsComposeOpen(false)
      setComposeForm({ to: '', subject: '', content: '', priority: 'Normal' })
      setAiSuggestion('')

      if (folder === 'sent') {
        fetchMessages()
      }
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }, [composeForm.to, composeForm.subject, composeForm.content, composeForm.priority, folder, fetchMessages, selectedMessage])

  const handleGetAISuggestion = useCallback(async () => {
    if (!selectedMessage) return

    setAiLoading(true)
    try {
      const response = await fetch('/api/messages/suggest-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageContent: selectedMessage.content,
          senderName: selectedMessage.sender.name,
          senderRole: selectedMessage.sender.name ? 'Parent' : 'Student',
          replyTone: 'professional'
        }),
      })

      if (!response.ok) throw new Error('Failed to get AI suggestion')

      const data = await response.json()
      if (data.success) {
        setAiSuggestion(data.data.suggestedReply)
        setComposeForm({ ...composeForm, content: data.data.suggestedReply })
      }
    } catch (error) {
      console.error('Error getting AI suggestion:', error)
    } finally {
      setAiLoading(false)
    }
  }, [selectedMessage, composeForm])

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Urgent':
        return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'
      case 'High':
        return 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800'
      case 'Normal':
        return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800'
      case 'Low':
        return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const formatTimestamp = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - new Date(date).getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))

    if (hours < 1) {
      const minutes = Math.floor(diff / (1000 * 60))
      return minutes < 1 ? 'Just now' : `${minutes}m ago`
    }
    if (hours < 24) {
      return `${hours}h ago`
    }
    const days = Math.floor(hours / 24)
    if (days < 7) {
      return `${days}d ago`
    }
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const getInitials = (name: string | null) => {
    if (!name) return 'U'
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const filteredMessages = useMemo(() => {
    return messages.filter((message) => {
      if (!debouncedSearchTerm) return true
      const search = debouncedSearchTerm.toLowerCase()
      return (
        message.subject?.toLowerCase().includes(search) ||
        message.content.toLowerCase().includes(search) ||
        message.sender.name?.toLowerCase().includes(search)
      )
    })
  }, [messages, debouncedSearchTerm])

  return (
    <DashboardLayout>
      <div className="flex h-[calc(100vh-5rem)]">
      <div className="w-[35%] border-r border-slate-200 dark:border-slate-700/50 flex flex-col bg-slate-50/50 dark:bg-slate-900/50">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700/50">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFolder('inbox')}
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                  folder === 'inbox'
                    ? 'bg-slate-900 text-white dark:bg-slate-700 dark:text-white'
                    : 'text-slate-600 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-800'
                )}
              >
                <Inbox className="h-4 w-4" />
                Inbox
              </button>
              <button
                onClick={() => setFolder('sent')}
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                  folder === 'sent'
                    ? 'bg-slate-900 text-white dark:bg-slate-700 dark:text-white'
                    : 'text-slate-600 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-800'
                )}
              >
                <SendHorizontal className="h-4 w-4" />
                Sent
              </button>
            </div>
            <Button size="sm" className="gap-2" onClick={() => setIsComposeOpen(true)}>
              <Send className="h-4 w-4" />
              Compose
            </Button>
          </div>

          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              id="message-search"
              name="message-search"
              placeholder="Search messages..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoComplete="off"
              className="pl-10 h-9 text-sm bg-white dark:bg-slate-800"
            />
          </div>

          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="h-9 text-sm bg-white dark:bg-slate-800">
              <SelectValue placeholder="All priorities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All priorities</SelectItem>
              <SelectItem value="Urgent">Urgent</SelectItem>
              <SelectItem value="High">High</SelectItem>
              <SelectItem value="Normal">Normal</SelectItem>
              <SelectItem value="Low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <ScrollArea className="flex-1">
          {loading ? (
            <div className="p-4 text-center text-sm text-slate-500">Loading...</div>
          ) : filteredMessages.length === 0 ? (
            <div className="p-8 text-center">
              <Mail className="h-12 w-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {folder === 'inbox'
                  ? 'Your inbox is empty. Messages from teachers and staff will appear here.'
                  : 'No sent messages yet.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {filteredMessages.map((message) => (
                <Suspense key={message.id} fallback={<div className="p-4 text-sm text-slate-400">Loading...</div>}>
                  <MessageListItem
                    message={message}
                    isSelected={selectedMessage?.id === message.id}
                    onClick={handleSelectMessage}
                    getPriorityColor={getPriorityColor}
                    formatTimestamp={formatTimestamp}
                    getInitials={getInitials}
                  />
                </Suspense>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      <div className="flex-1 flex flex-col bg-white dark:bg-slate-900">
        {selectedMessage ? (
            <Suspense fallback={<div className="flex-1 flex items-center justify-center p-8"><div className="text-sm text-slate-400">Loading message...</div></div>}>
              <MessageDetail
                message={selectedMessage}
                onReply={() => setIsComposeOpen(true)}
                onDelete={() => handleDeleteMessage(selectedMessage.id)}
                folder={folder}
                getPriorityColor={getPriorityColor}
                formatTimestamp={formatTimestamp}
                getInitials={getInitials}
              />
            </Suspense>
          ) : (
            <Suspense fallback={<div className="flex-1 flex items-center justify-center p-8"><div className="text-sm text-slate-400">Loading...</div></div>}>
              <MessageEmptyState folder={folder} />
            </Suspense>
          )}
      </div>
    </div>

    <Dialog open={isComposeOpen} onOpenChange={setIsComposeOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{selectedMessage ? 'Reply to message' : 'Compose new message'}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">To</label>
            {selectedMessage ? (
              <Input
                id="reply-to"
                name="reply-to"
                value={selectedMessage.sender.name || selectedMessage.sender.email}
                disabled
                className="bg-slate-50 dark:bg-slate-800"
              />
            ) : (
              <Input
                id="compose-to"
                name="compose-to"
                placeholder="Enter recipient email or name"
                value={composeForm.to}
                onChange={(e) => setComposeForm({ ...composeForm, to: e.target.value })}
              />
            )}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Subject</label>
            <Input
              id="subject"
              name="subject"
              placeholder="Enter subject"
              value={composeForm.subject}
              onChange={(e) => setComposeForm({ ...composeForm, subject: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Message</label>
            <div className="relative">
              <Textarea
                id="content"
                name="content"
                rows={6}
                value={composeForm.content}
                onChange={(e) => setComposeForm({ ...composeForm, content: e.target.value })}
                placeholder={selectedMessage ? "Write your reply..." : "Write your message..."}
              />
              {selectedMessage && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="absolute top-2 right-2 gap-1.5 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm"
                  onClick={handleGetAISuggestion}
                  disabled={aiLoading}
                >
                  {aiLoading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="h-3.5 w-3.5" />
                  )}
                  <span className="text-xs">{aiLoading ? 'Generating...' : 'AI Suggest'}</span>
                </Button>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Priority</label>
            <Select
              value={composeForm.priority}
              onValueChange={(value) => setComposeForm({ ...composeForm, priority: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Low">Low</SelectItem>
                <SelectItem value="Normal">Normal</SelectItem>
                <SelectItem value="High">High</SelectItem>
                <SelectItem value="Urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setIsComposeOpen(false)}
            className="mr-auto"
          >
            Cancel
          </Button>
          <Button onClick={handleSendMessage} className="gap-2">
            <Send className="h-4 w-4" />
            {selectedMessage ? 'Send Reply' : 'Send Message'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </DashboardLayout>
  )
}

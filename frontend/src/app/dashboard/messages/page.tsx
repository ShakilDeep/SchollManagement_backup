'use client'

import { useState, useEffect } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { Badge } from '@/components/ui/badge'
import {
  MessageSquare,
  Search,
  Send,
  Trash2,
  Reply,
  Forward,
  MoreVertical,
  Inbox,
  SendHorizontal,
  AlertCircle,
  Clock,
  User,
  Mail,
  X,
  Check,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { DashboardLayout } from '@/components/layout/dashboard-layout'

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

const CURRENT_USER_ID = 'cmjyq5cnt000tvqbgik92z276'

export default function MessagesPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null)
  const [folder, setFolder] = useState<'inbox' | 'sent'>('inbox')
  const [searchTerm, setSearchTerm] = useState('')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [isComposeOpen, setIsComposeOpen] = useState(false)
  const [composeForm, setComposeForm] = useState({
    to: '',
    subject: '',
    content: '',
    priority: 'Normal',
  })

  useEffect(() => {
    fetchMessages()
  }, [folder, priorityFilter])

  const fetchMessages = async () => {
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
  }

  const handleSelectMessage = async (message: Message) => {
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
  }

  const handleDeleteMessage = async (messageId: string) => {
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
  }

  const handleSendMessage = async () => {
    if (!composeForm.to || !composeForm.content) return

    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: CURRENT_USER_ID,
          receiverId: composeForm.to,
          subject: composeForm.subject,
          content: composeForm.content,
          type: 'Direct',
          priority: composeForm.priority,
        }),
      })

      if (!response.ok) throw new Error('Failed to send message')

      setIsComposeOpen(false)
      setComposeForm({ to: '', subject: '', content: '', priority: 'Normal' })

      if (folder === 'sent') {
        fetchMessages()
      }
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

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

  const filteredMessages = messages.filter((message) => {
    if (!searchTerm) return true
    const search = searchTerm.toLowerCase()
    return (
      message.subject?.toLowerCase().includes(search) ||
      message.content.toLowerCase().includes(search) ||
      message.sender.name?.toLowerCase().includes(search)
    )
  })

  return (
    <DashboardLayout>
      <div className="flex h-[calc(100vh-5rem)]">
      <div className="w-[35%] border-r border-slate-200 dark:border-slate-700/50 flex flex-col bg-slate-50/50 dark:bg-slate-900/50">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700/50">
          <div className="flex items-center gap-2 mb-3">
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
                <button
                  key={message.id}
                  onClick={() => handleSelectMessage(message)}
                  className={cn(
                    'w-full p-4 text-left transition-colors hover:bg-slate-100 dark:hover:bg-slate-800/50',
                    selectedMessage?.id === message.id && 'bg-slate-100 dark:bg-slate-800/50',
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
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      <div className="flex-1 flex flex-col bg-white dark:bg-slate-900">
        {selectedMessage ? (
          <>
            <div className="p-6 border-b border-slate-200 dark:border-slate-700/50">
              <div className="flex items-start justify-between gap-4 mb-4">
                <h1 className="text-xl font-semibold text-slate-900 dark:text-white leading-tight">
                  {selectedMessage.subject || '(No subject)'}
                </h1>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={cn('text-xs', getPriorityColor(selectedMessage.priority))}>
                    {selectedMessage.priority}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {selectedMessage.type}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center gap-3 mb-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={selectedMessage.sender.avatar || undefined} />
                  <AvatarFallback className="text-sm">
                    {getInitials(selectedMessage.sender.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-900 dark:text-white">
                      {selectedMessage.sender.name || selectedMessage.sender.email}
                    </span>
                    {selectedMessage.isRead && (
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Check className="h-3 w-3" />
                        Read
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-slate-500">{selectedMessage.sender.email}</span>
                </div>
                <div className="text-right text-xs text-slate-500">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatTimestamp(selectedMessage.createdAt)}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm text-slate-500">
                <span>To:</span>
                <span className="text-slate-700 dark:text-slate-300">
                  {selectedMessage.receiver.name || selectedMessage.receiver.email}
                </span>
              </div>
            </div>

            <ScrollArea className="flex-1 p-6">
              <div className="prose prose-slate dark:prose-invert max-w-none">
                {selectedMessage.content.split('\n').map((paragraph, idx) => (
                  <p key={idx} className="mb-4 leading-relaxed text-slate-700 dark:text-slate-300">
                    {paragraph || <br />}
                  </p>
                ))}
              </div>
            </ScrollArea>

            <div className="p-4 border-t border-slate-200 dark:border-slate-700/50">
              <div className="flex items-center gap-3">
                <Dialog open={isComposeOpen} onOpenChange={setIsComposeOpen}>
                  <DialogTrigger asChild>
                    <Button variant="default" size="sm" className="gap-2">
                      <Reply className="h-4 w-4" />
                      Reply
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Reply to message</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">To</label>
                        <Input
                          id="reply-to"
                          name="reply-to"
                          value={selectedMessage.sender.name || selectedMessage.sender.email}
                          disabled
                          className="bg-slate-50 dark:bg-slate-800"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Subject</label>
                        <Input
                          id="reply-subject"
                          name="reply-subject"
                          defaultValue={`Re: ${selectedMessage.subject || ''}`}
                          onChange={(e) => setComposeForm({ ...composeForm, subject: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Message</label>
                        <Textarea
                          id="reply-content"
                          name="reply-content"
                          rows={6}
                          value={composeForm.content}
                          onChange={(e) => setComposeForm({ ...composeForm, content: e.target.value })}
                          placeholder="Write your reply..."
                        />
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
                        Send Reply
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <Button variant="outline" size="sm" className="gap-2">
                  <Forward className="h-4 w-4" />
                  Forward
                </Button>

                <div className="flex-1" />

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteMessage(selectedMessage.id)}
                  className="gap-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </div>
            </div>
          </>
        ) : (
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
        )}
      </div>
    </div>
    </DashboardLayout>
  )
}

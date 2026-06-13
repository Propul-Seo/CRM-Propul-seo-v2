import { useState, useEffect, useCallback } from 'react'
import { v2 } from '../../../lib/supabase'
import type { ProjectNotification } from '../../../types/project-v2'

interface UseNotificationsV2Return {
  notifications: ProjectNotification[]
  unreadCount: number
  loading: boolean
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  deleteNotification: (id: string) => Promise<void>
}

export function useNotificationsV2(userId: string): UseNotificationsV2Return {
  const [notifications, setNotifications] = useState<ProjectNotification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) return
    setLoading(true)
    v2
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data, error }) => {
        if (!error && data) setNotifications(data as ProjectNotification[])
        setLoading(false)
      })
  }, [userId])

  const unreadCount = notifications.filter(n => !n.is_read).length

  const markAsRead = useCallback(async (id: string) => {
    const { error } = await v2
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
    if (!error) setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
  }, [])

  const markAllAsRead = useCallback(async () => {
    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id)
    if (unreadIds.length === 0) return
    const { error } = await v2
      .from('notifications')
      .update({ is_read: true })
      .in('id', unreadIds)
    if (!error) setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
  }, [notifications])

  const deleteNotification = useCallback(async (id: string) => {
    const { error } = await v2.from('notifications').delete().eq('id', id)
    if (!error) setNotifications(prev => prev.filter(n => n.id !== id))
  }, [])

  return { notifications, unreadCount, loading, markAsRead, markAllAsRead, deleteNotification }
}

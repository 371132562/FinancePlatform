import { create } from 'zustand'

import {
  notificationDeleteApiUrl,
  notificationListApiUrl,
  notificationMarkAllReadApiUrl,
  notificationMarkReadApiUrl
} from '../services/apis'
import http from '../services/base'
import type { NotificationItem, NotificationList } from '../types'

// 通知store的类型定义
export type NotificationStore = {
  notifications: NotificationItem[] // 通知列表（用于列表页面）
  unreadNotifications: NotificationItem[] // 未读通知列表（用于右上角显示）
  unreadCount: number // 未读数量（从unreadNotifications.length计算）
  loading: boolean // 加载状态
  error: string | null // 错误信息

  // 方法
  fetchNotifications: (params?: NotificationList) => Promise<void>
  fetchUnreadNotifications: (params?: NotificationList) => Promise<void>
  markAsRead: (ids: string[]) => Promise<boolean>
  markAllAsRead: () => Promise<boolean>
  deleteNotification: (id: string) => Promise<boolean>
  clearNotifications: () => void
}

// 通知store实现
export const useNotificationStore = create<NotificationStore>(set => ({
  notifications: [],
  unreadNotifications: [],
  unreadCount: 0,
  loading: false,
  error: null,

  // 获取通知列表
  async fetchNotifications(params) {
    set({ loading: true, error: null })
    try {
      const res = await http.post<NotificationItem[]>(notificationListApiUrl, params || {})
      set({ notifications: res.data, loading: false, error: null })
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : '获取通知列表失败'
      set({ loading: false, error: errorMsg })
    }
  },

  // 获取未读通知列表（用于右上角显示）
  async fetchUnreadNotifications(params) {
    try {
      const res = await http.post<NotificationItem[]>(notificationListApiUrl, {
        ...params,
        isRead: 0
        // 不传pageSize，获取所有未读通知
      })
      set({
        unreadNotifications: res.data,
        unreadCount: res.data.length
      })
    } catch (err: unknown) {
      console.error('获取未读通知列表失败:', err)
    }
  },

  // 标记通知为已读
  async markAsRead(ids) {
    set({ loading: true, error: null })
    try {
      await http.post(notificationMarkReadApiUrl, { ids })

      // 更新本地通知状态
      set(state => ({
        notifications: state.notifications.map(notification =>
          ids.includes(notification.id) ? { ...notification, isRead: 1 } : notification
        ),
        unreadNotifications: state.unreadNotifications.filter(
          notification => !ids.includes(notification.id)
        ),
        unreadCount: Math.max(0, state.unreadCount - ids.length),
        loading: false,
        error: null
      }))

      return true
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : '标记已读失败'
      set({ loading: false, error: errorMsg })
      return false
    }
  },

  // 标记所有通知为已读
  async markAllAsRead() {
    set({ loading: true, error: null })
    try {
      await http.post(notificationMarkAllReadApiUrl)

      // 更新本地通知状态
      set(state => ({
        notifications: state.notifications.map(notification => ({ ...notification, isRead: 1 })),
        unreadNotifications: [],
        unreadCount: 0,
        loading: false,
        error: null
      }))

      return true
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : '全部标记已读失败'
      set({ loading: false, error: errorMsg })
      return false
    }
  },

  // 删除通知
  async deleteNotification(id) {
    set({ loading: true, error: null })
    try {
      await http.post(notificationDeleteApiUrl, { id })
      set({ loading: false, error: null })
      return true
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : '删除通知失败'
      set({ loading: false, error: errorMsg })
      return false
    }
  },

  // 清空通知状态（退出登录时调用）
  clearNotifications() {
    set({
      notifications: [],
      unreadNotifications: [],
      unreadCount: 0,
      loading: false,
      error: null
    })
  }
}))

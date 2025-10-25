import { create } from 'zustand'

import {
  scheduleCommentCreateApiUrl,
  scheduleCreateApiUrl,
  scheduleDeleteApiUrl,
  scheduleDetailApiUrl,
  scheduleListApiUrl,
  scheduleUpdateStatusApiUrl
} from '../services/apis'
import http from '../services/base'
import type {
  CreateSchedule,
  ScheduleDetail,
  ScheduleItem,
  ScheduleList,
  UpdateScheduleStatus
} from '../types'

// 日程store的类型定义
export type ScheduleStore = {
  scheduleList: ScheduleItem[] // 日程列表
  currentSchedule: ScheduleDetail | null // 当前日程详情
  loading: boolean // 加载状态

  // 方法
  fetchScheduleList: (params?: ScheduleList) => Promise<void>
  fetchScheduleDetail: (id: string) => Promise<void>
  createSchedule: (data: CreateSchedule) => Promise<boolean>
  updateScheduleStatus: (data: UpdateScheduleStatus) => Promise<boolean>
  deleteSchedule: (id: string) => Promise<boolean>
  addComment: (scheduleId: string, content: string) => Promise<boolean>
  clearCurrentSchedule: () => void
}

// 日程store实现
export const useScheduleStore = create<ScheduleStore>(set => ({
  scheduleList: [],
  currentSchedule: null,
  loading: false,

  // 获取日程列表
  async fetchScheduleList(params) {
    set({ loading: true })
    try {
      const res = await http.post<ScheduleItem[]>(scheduleListApiUrl, params || {})
      set({ scheduleList: res.data })
    } finally {
      set({ loading: false })
    }
  },

  // 获取日程详情
  async fetchScheduleDetail(id) {
    set({ loading: true })
    try {
      const res = await http.post<ScheduleDetail>(scheduleDetailApiUrl, { id })
      set({ currentSchedule: res.data })
    } finally {
      set({ loading: false })
    }
  },

  // 创建日程
  async createSchedule(data) {
    set({ loading: true })
    try {
      await http.post(scheduleCreateApiUrl, data)
      return true
    } catch {
      return false
    } finally {
      set({ loading: false })
    }
  },

  // 更新日程状态
  async updateScheduleStatus(data) {
    set({ loading: true })
    try {
      await http.post(scheduleUpdateStatusApiUrl, data)
      return true
    } catch {
      return false
    } finally {
      set({ loading: false })
    }
  },

  // 删除日程
  async deleteSchedule(id) {
    set({ loading: true })
    try {
      await http.post(scheduleDeleteApiUrl, { id })
      return true
    } catch {
      return false
    } finally {
      set({ loading: false })
    }
  },

  // 添加回复
  async addComment(scheduleId, content) {
    set({ loading: true })
    try {
      await http.post(scheduleCommentCreateApiUrl, { scheduleId, content })
      return true
    } catch {
      return false
    } finally {
      set({ loading: false })
    }
  },

  // 清除当前日程
  clearCurrentSchedule() {
    set({ currentSchedule: null })
  }
}))

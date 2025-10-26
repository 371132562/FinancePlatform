import { create } from 'zustand'

import {
  scheduleCommentCreateApiUrl,
  scheduleCreateApiUrl,
  scheduleDeleteApiUrl,
  scheduleDetailApiUrl,
  scheduleListApiUrl,
  scheduleStatisticsApiUrl,
  scheduleUpdateStatusApiUrl
} from '../services/apis'
import http from '../services/base'
import type {
  CreateSchedule,
  ScheduleDetail,
  ScheduleItem,
  ScheduleList,
  ScheduleStatistics,
  UpdateScheduleStatus
} from '../types'

// 日程store的类型定义
export type ScheduleStore = {
  scheduleList: ScheduleItem[] // 日程列表
  currentSchedule: ScheduleDetail | null // 当前日程详情
  loading: boolean // 加载状态
  statistics: ScheduleStatistics | null // 统计数据
  statisticsLoading: boolean // 统计加载状态
  statisticsCacheTime: number | null // 统计缓存时间戳
  statisticsNextUpdateTime: Date | null // 下次更新时间
  statisticsUpdateTime: Date | null // 统计数据的更新时间

  // 方法
  fetchScheduleList: (params?: ScheduleList) => Promise<void>
  fetchScheduleDetail: (id: string) => Promise<void>
  createSchedule: (data: CreateSchedule) => Promise<boolean>
  updateScheduleStatus: (data: UpdateScheduleStatus) => Promise<boolean>
  deleteSchedule: (id: string) => Promise<boolean>
  addComment: (scheduleId: string, content: string) => Promise<boolean>
  clearCurrentSchedule: () => void
  fetchStatistics: (force?: boolean) => Promise<void> // 获取统计数据
}

// 日程store实现
export const useScheduleStore = create<ScheduleStore>(set => ({
  scheduleList: [],
  currentSchedule: null,
  loading: false,
  statistics: null,
  statisticsLoading: false,
  statisticsCacheTime: null,
  statisticsNextUpdateTime: null,
  statisticsUpdateTime: null,

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
  },

  // 获取统计数据
  async fetchStatistics(force = false) {
    const state = useScheduleStore.getState()
    const now = Date.now()
    const CACHE_DURATION = 10 * 60 * 1000 // 10分钟缓存

    // 检查缓存是否有效
    if (
      !force &&
      state.statistics &&
      state.statisticsCacheTime &&
      now - state.statisticsCacheTime < CACHE_DURATION
    ) {
      // 缓存有效，计算下次更新时间
      const nextUpdateTime = new Date(state.statisticsCacheTime + CACHE_DURATION)
      set({ statisticsNextUpdateTime: nextUpdateTime })
      return
    }

    // 需要请求新数据
    set({ statisticsLoading: true })
    try {
      const res = await http.post<ScheduleStatistics>(scheduleStatisticsApiUrl, {})
      const cacheTime = Date.now()
      const updateTime = new Date()
      const nextUpdateTime = new Date(cacheTime + CACHE_DURATION)

      set({
        statistics: res.data,
        statisticsCacheTime: cacheTime,
        statisticsNextUpdateTime: nextUpdateTime,
        statisticsUpdateTime: updateTime
      })
    } catch (error) {
      console.error('获取统计数据失败:', error)
    } finally {
      set({ statisticsLoading: false })
    }
  }
}))

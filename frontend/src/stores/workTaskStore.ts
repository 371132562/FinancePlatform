import { create } from 'zustand'

import {
  workTaskCommentCreateApiUrl,
  workTaskCommentDeleteApiUrl,
  workTaskCreateApiUrl,
  workTaskDeleteApiUrl,
  workTaskDetailApiUrl,
  workTaskListApiUrl,
  workTaskUpdateApiUrl
} from '../services/apis'
import http from '../services/base'
import type {
  CreateWorkTask,
  UpdateWorkTask,
  WorkTaskDetail,
  WorkTaskItem,
  WorkTaskList
} from '../types'

// 工作项store的类型定义
export type WorkTaskStore = {
  taskList: WorkTaskItem[] // 工作项列表
  currentTask: WorkTaskDetail | null // 当前工作项详情
  loading: boolean // 加载状态
  error: string | null // 错误信息

  // 方法
  fetchTaskList: (params?: WorkTaskList) => Promise<void>
  fetchTaskDetail: (id: string) => Promise<void>
  createTask: (data: CreateWorkTask) => Promise<boolean>
  updateTask: (data: UpdateWorkTask) => Promise<boolean>
  deleteTask: (id: string) => Promise<boolean>
  addComment: (taskId: string, content: string) => Promise<boolean>
  deleteComment: (commentId: string) => Promise<boolean>
  clearCurrentTask: () => void
}

// 工作项store实现
export const useWorkTaskStore = create<WorkTaskStore>(set => ({
  taskList: [],
  currentTask: null,
  loading: false,
  error: null,

  // 获取工作项列表
  async fetchTaskList(params) {
    set({ loading: true, error: null })
    try {
      const res = await http.post<WorkTaskItem[]>(workTaskListApiUrl, params || {})
      set({ taskList: res.data, loading: false, error: null })
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : '获取工作项列表失败'
      set({ loading: false, error: errorMsg })
    }
  },

  // 获取工作项详情
  async fetchTaskDetail(id) {
    set({ loading: true, error: null })
    try {
      const res = await http.post<WorkTaskDetail>(workTaskDetailApiUrl, { id })
      set({ currentTask: res.data, loading: false, error: null })
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : '获取工作项详情失败'
      set({ loading: false, error: errorMsg })
    }
  },

  // 创建工作项
  async createTask(data) {
    set({ loading: true, error: null })
    try {
      await http.post(workTaskCreateApiUrl, data)
      set({ loading: false, error: null })
      return true
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : '创建工作项失败'
      set({ loading: false, error: errorMsg })
      return false
    }
  },

  // 更新工作项
  async updateTask(data) {
    set({ loading: true, error: null })
    try {
      await http.post(workTaskUpdateApiUrl, data)
      set({ loading: false, error: null })
      return true
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : '更新工作项失败'
      set({ loading: false, error: errorMsg })
      return false
    }
  },

  // 删除工作项
  async deleteTask(id) {
    set({ loading: true, error: null })
    try {
      await http.post(workTaskDeleteApiUrl, { id })
      set({ loading: false, error: null })
      return true
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : '删除工作项失败'
      set({ loading: false, error: errorMsg })
      return false
    }
  },

  // 添加回复
  async addComment(taskId, content) {
    set({ loading: true, error: null })
    try {
      await http.post(workTaskCommentCreateApiUrl, { taskId, content })
      set({ loading: false, error: null })
      return true
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : '添加回复失败'
      set({ loading: false, error: errorMsg })
      return false
    }
  },

  // 删除回复
  async deleteComment(commentId) {
    set({ loading: true, error: null })
    try {
      await http.post(workTaskCommentDeleteApiUrl, { id: commentId })
      set({ loading: false, error: null })
      return true
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : '删除回复失败'
      set({ loading: false, error: errorMsg })
      return false
    }
  },

  // 清除当前工作项
  clearCurrentTask() {
    set({ currentTask: null })
  }
}))

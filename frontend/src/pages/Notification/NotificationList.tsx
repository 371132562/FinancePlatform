import { Button, Input, message, Popconfirm, Space, Table } from 'antd'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'

import { useAuthStore } from '@/stores/authStore'
import { getNotificationTypeLabel, useNotificationStore } from '@/stores/notificationStore'
import type { NotificationType } from '@/types'
import { formatDateTime } from '@/utils/dayjs'

const { Search } = Input

/**
 * 通知列表页面
 */
const NotificationList = () => {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const {
    notifications,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification
  } = useNotificationStore()

  const [searchParams, setSearchParams] = useState({
    page: 1,
    pageSize: 10,
    keyword: ''
  })

  useEffect(() => {
    if (user) {
      fetchNotifications({ page: 1, pageSize: 50 })
    }
  }, [user])

  // 处理搜索
  const handleSearch = (value: string) => {
    setSearchParams(prev => ({ ...prev, keyword: value, page: 1 }))
    // 这里可以添加搜索逻辑
  }

  // 处理标记为已读
  const handleMarkAsRead = async (notificationId: string) => {
    const success = await markAsRead([notificationId])
    if (success) {
      message.success('已标记为已读')
    }
  }

  // 处理全部标记为已读
  const handleMarkAllAsRead = async () => {
    const success = await markAllAsRead()
    if (success) {
      message.success('全部标记为已读')
    }
  }

  // 处理删除通知
  const handleDeleteNotification = async (notificationId: string) => {
    const success = await deleteNotification(notificationId)
    if (success) {
      message.success('删除成功')
    }
  }

  // 根据模块和类型生成跳转URL
  const getNotificationUrl = (notification: { module: string; relatedId?: string | null }) => {
    const { module, relatedId } = notification
    switch (module) {
      case 'schedule':
        return `/schedule/detail/${relatedId}`
      case 'article':
        return `/article/detail/${relatedId}`
      case 'user':
        return `/system/userManagement`
      case 'system':
        return '/system/maintenance'
      default:
        return '/notifications'
    }
  }

  // 处理标题点击跳转
  const handleTitleClick = async (notification: {
    id: string
    isRead: number
    module: string
    relatedId?: string | null
  }) => {
    const url = getNotificationUrl(notification)
    navigate(url)

    // 如果是未读通知，标记为已读
    if (!notification.isRead) {
      const success = await markAsRead([notification.id])
      if (success) {
        message.success('已标记为已读')
      }
    }
  }

  // 表格列定义
  const columns = [
    {
      title: '标题 (点击跳转)',
      dataIndex: 'title',
      key: 'title',
      width: 200,
      render: (
        title: string,
        record: { isRead: number; id: string; module: string; relatedId?: string | null }
      ) => (
        <Button
          variant="link"
          color="primary"
          onClick={() => handleTitleClick(record)}
        >
          {title}
        </Button>
      )
    },
    {
      title: '内容',
      dataIndex: 'content',
      key: 'content',
      width: 300,
      render: (content: string) => (
        <div
          className="max-w-xs truncate text-gray-600"
          title={content}
        >
          {content}
        </div>
      )
    },
    {
      title: '状态',
      dataIndex: 'isRead',
      key: 'isRead',
      width: 80,
      render: (isRead: number) => (
        <span className={isRead ? 'text-gray-600' : 'text-red-500'}>
          {isRead ? '已读' : '未读'}
        </span>
      )
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: string) => getNotificationTypeLabel(type as NotificationType)
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      key: 'createTime',
      width: 150,
      render: (time: Date) => formatDateTime(time)
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (record: { isRead: number; id: string }) => (
        <Space>
          {!record.isRead && (
            <Button
              variant="outlined"
              color="primary"
              onClick={() => handleMarkAsRead(record.id)}
            >
              标记已读
            </Button>
          )}
          <Popconfirm
            title="确定要删除这条通知吗？"
            description="此操作不可恢复，请谨慎操作。"
            onConfirm={() => handleDeleteNotification(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button
              variant="outlined"
              danger
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ]

  return (
    <div className="w-full max-w-7xl">
      {/* 搜索和筛选区域 */}
      <div className="mb-4 flex justify-between">
        <div className="flex items-center space-x-4">
          <Search
            placeholder="搜索通知标题或内容"
            onSearch={handleSearch}
            style={{ width: 200 }}
          />
        </div>
        {notifications.length > 0 && (
          <Button
            variant="outlined"
            color="primary"
            onClick={handleMarkAllAsRead}
          >
            全部标记为已读
          </Button>
        )}
      </div>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={notifications}
        pagination={{
          current: searchParams.page,
          pageSize: searchParams.pageSize,
          total: notifications.length,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: total => `共 ${total} 条记录`,
          onChange: (page, pageSize) => {
            setSearchParams(prev => ({ ...prev, page, pageSize: pageSize || 10 }))
          }
        }}
        loading={loading}
        rowClassName={record => (!record.isRead ? 'bg-blue-50 border-l-4 border-blue-400' : '')}
      />
    </div>
  )
}

export default NotificationList

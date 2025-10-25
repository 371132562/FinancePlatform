import { KeyOutlined, LoginOutlined, LogoutOutlined, UserOutlined } from '@ant-design/icons'
import { Avatar, Badge, Button, Dropdown, MenuProps, message } from 'antd'
import { FC, useEffect, useState } from 'react'
import { useNavigate } from 'react-router'

import ChangePasswordModal from '@/components/ChangePasswordModal'
import { useAuthStore } from '@/stores/authStore'
import { useNotificationStore } from '@/stores/notificationStore'
import { UserItem } from '@/types'
import { dayjs } from '@/utils/dayjs'

interface UserAvatarDropdownProps {
  /** 用户信息 */
  user?: UserItem | null
  /** 是否已登录 */
  isLoggedIn: boolean
}

/**
 * 用户头像下拉菜单组件
 * 包含用户信息展示、通知消息、修改密码、退出登录等功能
 */
export const UserAvatarDropdown: FC<UserAvatarDropdownProps> = ({ user, isLoggedIn }) => {
  const navigate = useNavigate()
  const [changePasswordModalOpen, setChangePasswordModalOpen] = useState(false)

  // 认证相关状态和方法
  const logout = useAuthStore(state => state.logout)
  const clearNotifications = useNotificationStore(state => state.clearNotifications)

  // 通知相关状态和方法
  const unreadCount = useNotificationStore(state => state.unreadCount)
  const unreadNotifications = useNotificationStore(state => state.unreadNotifications)
  const fetchUnreadNotifications = useNotificationStore(state => state.fetchUnreadNotifications)
  const markAsRead = useNotificationStore(state => state.markAsRead)
  const markAllAsRead = useNotificationStore(state => state.markAllAsRead)

  // 获取未读通知（定时轮询）
  useEffect(() => {
    if (isLoggedIn) {
      // 初始加载
      fetchUnreadNotifications()

      // 每30秒轮询一次
      const interval = setInterval(() => {
        fetchUnreadNotifications()
      }, 30000)
      return () => clearInterval(interval)
    }
  }, [isLoggedIn, fetchUnreadNotifications])

  // 通知项组件
  const NotificationItem = ({
    notification
  }: {
    notification: {
      id: string
      module: string
      type: string
      title: string
      content: string
      isRead: number
      relatedId?: string | null
      createTime: Date
    }
  }) => {
    // 根据模块和类型生成跳转URL
    const getNotificationUrl = (notif: typeof notification) => {
      const { module, relatedId } = notif
      switch (module) {
        case 'work':
          return `/work/detail/${relatedId}`
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

    // 获取模块图标
    const getModuleIcon = (module: string) => {
      switch (module) {
        case 'work':
          return '📋'
        case 'article':
          return '📄'
        case 'user':
          return '👤'
        case 'system':
          return '⚙️'
        default:
          return '🔔'
      }
    }

    // 获取时间显示文本
    const getTimeText = (createTime: Date) => {
      const now = dayjs()
      const time = dayjs(createTime)
      const diffMinutes = now.diff(time, 'minute')
      const diffHours = now.diff(time, 'hour')
      const diffDays = now.diff(time, 'day')

      if (diffMinutes < 1) return '刚刚'
      if (diffMinutes < 60) return `${diffMinutes}分钟前`
      if (diffHours < 24) return `${diffHours}小时前`
      if (diffDays < 7) return `${diffDays}天前`
      return time.format('MM月DD日')
    }

    return (
      <div
        className={`group relative cursor-pointer rounded-lg border transition-all duration-200 hover:shadow-md ${
          !notification.isRead
            ? 'border-blue-200 bg-blue-50/50 hover:bg-blue-50'
            : 'border-gray-200 bg-white hover:bg-gray-50'
        }`}
        onClick={async () => {
          const url = getNotificationUrl(notification)
          navigate(url)
          if (!notification.isRead) {
            const success = await markAsRead([notification.id])
            if (success) {
              // 重新获取未读通知列表以更新右上角显示
              fetchUnreadNotifications()
            }
          }
        }}
      >
        {/* 未读标识点 */}
        {!notification.isRead && (
          <div className="absolute left-3 top-3 h-2 w-2 rounded-full bg-blue-500"></div>
        )}

        <div className="flex items-start gap-3 p-4">
          {/* 模块图标 */}
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-sm">
            {getModuleIcon(notification.module)}
          </div>

          {/* 通知内容 */}
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h4
                className={`text-sm font-medium leading-5 ${
                  !notification.isRead ? 'text-gray-900' : 'text-gray-700'
                }`}
              >
                {notification.title}
              </h4>
              <span className="flex-shrink-0 text-xs text-gray-400">
                {getTimeText(notification.createTime)}
              </span>
            </div>

            <p className="mt-1 line-clamp-2 text-sm text-gray-600">{notification.content}</p>
          </div>
        </div>
      </div>
    )
  }

  // 用户下拉菜单项
  const userMenuItems: MenuProps['items'] = isLoggedIn
    ? [
        {
          key: 'userInfo',
          label: (
            <div
              className="min-w-[280px] max-w-[340px] rounded-lg bg-white px-4 py-3"
              style={{ lineHeight: 1.6 }}
            >
              {/* 用户名 */}
              <div className="mb-2 text-base font-semibold text-gray-800">{user?.name}</div>
              {/* 用户名 */}
              <div className="mb-2 flex items-center text-sm text-gray-600">
                <span className="mr-2 text-gray-400">用户名：</span>
                <span className="font-mono">{user?.code || '-'}</span>
              </div>
              {/* 角色名称 */}
              <div className="mb-2 flex items-center text-sm text-gray-600">
                <span className="mr-2 text-gray-400">角色：</span>
                <span>{user?.role?.name || '-'}</span>
              </div>
              {/* 所属部门 */}
              <div className="flex items-center text-sm text-gray-600">
                <span className="mr-2 text-gray-400">部门：</span>
                <span>{user?.department || '-'}</span>
              </div>
            </div>
          ),
          disabled: true
        },
        {
          type: 'divider'
        },
        {
          key: 'notifications',
          label: (
            <div className="min-w-[360px] max-w-[420px] rounded-xl border border-gray-100 bg-white">
              {/* 通知头部 */}
              <div className="rounded-t-xl border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50 px-5 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-sm text-white">
                      🔔
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-gray-900">通知消息</h3>
                      <p className="text-gray-500">
                        {unreadCount > 0 ? `您有 ${unreadCount} 条未读消息` : '暂无未读消息'}
                      </p>
                    </div>
                  </div>
                  {unreadCount > 0 && (
                    <Button
                      type="primary"
                      size="small"
                      className="h-7 px-3 text-xs"
                      onClick={e => {
                        e.stopPropagation()
                        markAllAsRead()
                      }}
                    >
                      全部已读
                    </Button>
                  )}
                </div>
              </div>

              {/* 通知列表 */}
              <div className="max-h-80 overflow-y-auto">
                {unreadNotifications.length > 0 ? (
                  <div className="space-y-2 p-3">
                    {unreadNotifications.slice(0, 3).map(notification => (
                      <NotificationItem
                        key={notification.id}
                        notification={notification}
                      />
                    ))}
                    {unreadNotifications.length > 3 && (
                      <div className="px-3 py-2 text-center">
                        <div className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600">
                          <span>还有</span>
                          <span className="font-medium text-blue-600">
                            {unreadNotifications.length - 3}
                          </span>
                          <span>条未读通知</span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>

              {/* 底部操作 - 只在有未读消息且超过3条时显示 */}
              {unreadNotifications.length > 3 && (
                <div className="rounded-b-xl border-t border-gray-100 bg-gray-50 px-4 py-3">
                  <Button
                    type="default"
                    className="h-8 w-full text-xs"
                    onClick={() => navigate('/notifications')}
                  >
                    查看全部通知
                  </Button>
                </div>
              )}
            </div>
          ),
          disabled: true
        },
        {
          type: 'divider'
        },
        {
          key: 'changePassword',
          label: <div className="px-2 py-1 text-blue-600 hover:text-blue-700">修改密码</div>,
          icon: <KeyOutlined />,
          onClick: () => {
            setChangePasswordModalOpen(true)
          }
        },
        {
          type: 'divider'
        },
        {
          key: 'logout',
          label: <div className="px-2 py-1 text-red-600 hover:text-red-700">退出登录</div>,
          icon: <LogoutOutlined />,
          onClick: () => {
            const success = logout()
            if (success) {
              // 清空通知状态
              clearNotifications()
              message.success('退出成功')
            }
            navigate('/home')
          }
        }
      ]
    : [
        {
          key: 'guestInfo',
          label: (
            <div
              className="min-w-[280px] max-w-[340px] rounded-lg bg-white px-4 py-3"
              style={{ lineHeight: 1.6 }}
            >
              {/* 访客提示 */}
              <div className="mb-2 text-base font-semibold text-gray-800">访客模式</div>
              <div className="text-sm text-gray-600">登录后可使用全部功能</div>
            </div>
          ),
          disabled: true
        },
        {
          type: 'divider'
        },
        {
          key: 'login',
          label: <div className="px-2 py-1 text-blue-600 hover:text-blue-700">立即登录</div>,
          icon: <LoginOutlined />,
          onClick: () => {
            navigate('/login')
          }
        }
      ]

  return (
    <>
      {/* 用户头像及信息浮窗，hover触发 */}
      <Dropdown
        menu={{ items: userMenuItems }}
        placement="bottomRight"
        trigger={['hover']} // hover触发
        overlayClassName="user-info-dropdown"
      >
        <div
          className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 transition-colors hover:bg-white/10"
          title={user?.name || '访客'}
        >
          {/* 用户头像带通知徽章 */}
          <Badge
            count={unreadCount}
            size="small"
          >
            <Avatar
              icon={<UserOutlined />}
              className={`h-8 w-8 cursor-pointer text-sm hover:opacity-80 ${
                isLoggedIn ? 'bg-blue-500 hover:bg-blue-600' : 'bg-gray-500 hover:bg-gray-600'
              }`}
              style={{ width: 32, height: 32 }}
            />
          </Badge>
          {/* 用户名显示在头像旁边 */}
          <span className="max-w-[120px] truncate text-sm font-medium text-white">
            {user?.name || '访客'}
          </span>
        </div>
      </Dropdown>

      {/* 修改密码弹窗 */}
      <ChangePasswordModal
        open={changePasswordModalOpen}
        onCancel={() => setChangePasswordModalOpen(false)}
        userId={user?.id}
        title="修改密码"
      />
    </>
  )
}

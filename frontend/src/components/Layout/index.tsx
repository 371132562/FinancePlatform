import { KeyOutlined, LoginOutlined, LogoutOutlined, UserOutlined } from '@ant-design/icons' // 导入图标
import {
  Avatar,
  Badge,
  Breadcrumb,
  Button,
  Dropdown,
  FloatButton,
  Layout,
  Menu,
  MenuProps,
  message
} from 'antd'
import { FC, ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { Link, useLocation, useNavigate, useOutlet } from 'react-router'

import ChangePasswordModal from '@/components/ChangePasswordModal'
import ErrorPage from '@/components/Error'
import Forbidden from '@/components/Forbidden'
import { isFullPermissionRole } from '@/config/roleNames'
import {
  getAllRoutes,
  getBreadcrumbItems,
  getSideMenuRoutes,
  getTopMenuRoutes
} from '@/router/routesConfig'
import { useAuthStore } from '@/stores/authStore'
import { useNotificationStore } from '@/stores/notificationStore'
import { dayjs } from '@/utils/dayjs'

const { Header, Sider, Content /* Footer */ } = Layout

export const Component: FC = () => {
  const outlet = useOutlet()
  const navigate = useNavigate()
  const user = useAuthStore(state => state.user)
  const token = useAuthStore(state => state.token)
  const fetchProfile = useAuthStore(state => state.fetchProfile)
  const topRoutes = getTopMenuRoutes()
  const sideRoutes = getSideMenuRoutes(
    user?.role && user.role.name
      ? { name: user.role.name, allowedRoutes: user.role.allowedRoutes || [] }
      : undefined
  )
  const logout = useAuthStore(state => state.logout)
  const [collapsed, setCollapsed] = useState(false)
  const [openKeys, setOpenKeys] = useState<string[]>([])
  const [changePasswordModalOpen, setChangePasswordModalOpen] = useState(false)
  const { pathname } = useLocation()
  const scrollRef = useRef<HTMLDivElement | null>(null)

  // 通知相关状态
  const unreadCount = useNotificationStore(state => state.unreadCount)
  const unreadNotifications = useNotificationStore(state => state.unreadNotifications)
  const fetchUnreadNotifications = useNotificationStore(state => state.fetchUnreadNotifications)
  const markAsRead = useNotificationStore(state => state.markAsRead)
  const markAllAsRead = useNotificationStore(state => state.markAllAsRead)
  const clearNotifications = useNotificationStore(state => state.clearNotifications)

  // 主动获取用户信息
  useEffect(() => {
    // 有token时，无条件获取用户信息来验证token有效性
    if (token) {
      fetchProfile()
    }
  }, [token])

  // 获取未读通知（定时轮询）
  useEffect(() => {
    if (token) {
      // 初始加载
      fetchUnreadNotifications()

      // 每30秒轮询一次
      const interval = setInterval(() => {
        fetchUnreadNotifications()
      }, 30000)
      return () => clearInterval(interval)
    }
  }, [token, fetchUnreadNotifications])

  const handleMenuClick: MenuProps['onClick'] = e => {
    navigate(e.key)
  }

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

    return (
      <div
        className={`cursor-pointer rounded p-3 hover:bg-gray-50 ${!notification.isRead ? 'border-l-4 border-blue-400 bg-blue-50' : ''}`}
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
        <div className="font-medium">{notification.title}</div>
        <div className="mt-1 text-gray-400">
          {dayjs(notification.createTime).format('YYYY年MM月DD日 HH:mm:ss')}
        </div>
        <div className="mt-1 text-gray-600">{notification.content}</div>
      </div>
    )
  }

  // 用户下拉菜单项，hover触发，内容更丰富
  const userMenuItems: MenuProps['items'] = user
    ? [
        {
          key: 'userInfo',
          label: (
            <div
              className="min-w-[280px] max-w-[340px] rounded-lg bg-white px-4 py-3"
              style={{ lineHeight: 1.6 }}
            >
              {/* 用户名 */}
              <div className="mb-2 text-base font-semibold text-gray-800">{user.name}</div>
              {/* 用户名 */}
              <div className="mb-2 flex items-center text-sm text-gray-600">
                <span className="mr-2 text-gray-400">用户名：</span>
                <span className="font-mono">{user.code || '-'}</span>
              </div>
              {/* 角色名称 */}
              <div className="mb-2 flex items-center text-sm text-gray-600">
                <span className="mr-2 text-gray-400">角色：</span>
                <span>{user.role?.name || '-'}</span>
              </div>
              {/* 所属部门 */}
              <div className="flex items-center text-sm text-gray-600">
                <span className="mr-2 text-gray-400">部门：</span>
                <span>{user.department || '-'}</span>
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
            <div className="min-w-[320px] max-w-[400px] rounded-lg bg-white">
              <div className="border-b px-4 py-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium">通知消息</span>
                  <div className="flex items-center !space-x-2">
                    <Badge count={unreadCount} />
                    {unreadCount > 0 && (
                      <Button
                        variant="outlined"
                        size="small"
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
              </div>
              <div className="max-h-64 overflow-y-auto">
                {unreadNotifications.length > 0 ? (
                  <>
                    {unreadNotifications.slice(0, 3).map(notification => (
                      <NotificationItem
                        key={notification.id}
                        notification={notification}
                      />
                    ))}
                    {unreadNotifications.length > 3 && (
                      <div className="p-3 text-center">
                        <div className="text-gray-500">
                          还有 {unreadNotifications.length - 3} 条未读通知
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="p-4 text-center text-sm text-gray-500">暂无新通知</div>
                )}
              </div>
              <div className="border-t px-4 py-2 text-center">
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => navigate('/notifications')}
                >
                  查看全部
                </Button>
              </div>
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

  // 计算顶部导航菜单的激活项
  const topNavSelectedKey = useMemo(() => {
    const pathSegments = pathname.split('/').filter(Boolean)
    if (pathSegments.length === 0) return ['/home']
    return [`/${pathSegments[0]}`]
  }, [pathname])

  // 根据当前路径计算应该展开的菜单项
  const defaultOpenKeys = useMemo(() => {
    const pathSegments = pathname.split('/').filter(i => i)
    if (pathSegments.length > 1) {
      return [`/${pathSegments[0]}`]
    }
    return []
  }, [pathname])

  // 处理菜单展开/收起
  const handleOpenChange = (keys: string[]) => {
    setOpenKeys(keys)
  }

  // 当路由变化时，自动展开对应的父菜单
  useEffect(() => {
    setOpenKeys(defaultOpenKeys)
  }, [defaultOpenKeys])

  // 根据路由配置生成顶部菜单项
  const topMenuItems: MenuProps['items'] = topRoutes.map(route => ({
    key: route.path,
    label: route.title,
    icon: route.icon
  }))

  // 根据路由配置生成侧边菜单项
  const menuItems: MenuProps['items'] = sideRoutes.map(route => {
    const item: {
      key: string
      icon?: ReactNode
      label: ReactNode
      children?: { key: string; label: ReactNode }[]
    } = {
      key: route.path,
      icon: route.icon,
      label: route.title
    }

    if (route.children && route.children.filter(child => !child.hideInMenu).length > 0) {
      item.children = route.children
        .filter(child => !child.hideInMenu)
        .map(child => ({
          key: child.path,
          label: child.title
        }))
    }

    return item
  })

  // 获取面包屑项
  const breadcrumbItems = useMemo(() => {
    return getBreadcrumbItems(pathname).map(item => ({
      title:
        item.component && item.path !== pathname ? (
          <Link to={item.path}>{item.title}</Link>
        ) : (
          item.title
        )
    }))
  }, [pathname])

  // 路由守卫：检查权限
  const hasPermission = useMemo(() => {
    // 顶部菜单对所有用户开放，无需权限检查
    const topMenuPaths = topRoutes.map(route => route.path)
    const isTopMenuRoute = topMenuPaths.some(
      path => pathname === path || pathname.startsWith(path + '/')
    )

    if (isTopMenuRoute) {
      return true
    }

    // 侧边栏菜单需要登录用户才能访问
    if (!user) {
      return false
    }

    // 超管和老板可以访问所有侧边栏菜单
    if (isFullPermissionRole(user.role?.name || '')) return true

    // 检查是否为hideInMenu的路由（无条件允许访问）
    const allRoutes = getAllRoutes()
    const currentRoute = allRoutes.find(route => {
      // 处理动态路由参数
      const routePathPattern = route.path.replace(/\/:[^/]+/g, '/[^/]+')
      const regex = new RegExp(`^${routePathPattern}$`)
      return regex.test(pathname)
    })

    if (currentRoute?.hideInMenu) {
      return true
    }

    // 其他角色按allowedRoutes检查侧边栏菜单权限
    const allowed = user.role?.allowedRoutes || []
    // 精确匹配或以参数结尾的动态路由
    return allowed.some(route => pathname === route || pathname.startsWith(route + '/'))
  }, [user, pathname, topRoutes])

  return (
    <Layout className="h-screen w-full">
      <Header className="flex items-center !pl-[29px] text-white">
        <div className="flex-shrink-0 text-xl font-bold text-white">模版平台</div>
        <div className="flex-grow" />
        <Menu
          theme="dark"
          mode="horizontal"
          items={topMenuItems}
          selectedKeys={topNavSelectedKey}
          onClick={handleMenuClick}
          className="flex-grow-0"
          style={{ minWidth: 0 }}
        />
        <div className="flex-grow" />
        <div className="flex-shrink-0">
          {/* 用户头像及信息浮窗，hover触发 */}
          <Dropdown
            menu={{ items: userMenuItems }}
            placement="bottomRight"
            trigger={['hover']} // 改为hover触发
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
                    user ? 'bg-blue-500 hover:bg-blue-600' : 'bg-gray-500 hover:bg-gray-600'
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
        </div>
      </Header>
      <Layout className="flex-grow">
        {/* 只有登录用户才显示侧边栏 */}
        {user && (
          <Sider
            collapsible
            collapsed={collapsed}
            onCollapse={setCollapsed}
            theme="dark"
            width={220}
            className="flex flex-col"
          >
            <Menu
              theme="dark"
              mode="inline"
              items={menuItems}
              onClick={handleMenuClick}
              onOpenChange={handleOpenChange}
              // 将菜单的选中状态与路由同步
              selectedKeys={[pathname]}
              // 控制菜单展开状态，支持手动操作和路由驱动
              openKeys={openKeys}
              // 设置菜单高度和滚动，确保所有菜单项都能显示
              style={{
                height: '100%',
                overflowY: 'auto',
                overflowX: 'hidden',
                // 为滚动条预留空间，防止内容宽度变化
                scrollbarGutter: 'stable'
              }}
            />
          </Sider>
        )}
        <Layout>
          <Content className="!flex flex-grow flex-col bg-gray-100 p-6">
            {/* 添加面包屑导航 */}
            <div className="mb-2">
              <Breadcrumb items={breadcrumbItems} />
            </div>
            <div
              ref={scrollRef}
              className="box-border flex flex-grow flex-col items-center overflow-y-auto rounded-lg bg-white p-6 shadow-md"
              style={{
                // 为滚动条预留空间，防止内容宽度变化
                scrollbarGutter: 'stable'
              }}
            >
              {/* 路由守卫：无权限跳转403 */}
              {!hasPermission ? (
                <Forbidden />
              ) : (
                <ErrorBoundary FallbackComponent={ErrorPage}>{outlet}</ErrorBoundary>
              )}
            </div>
          </Content>
          <FloatButton.BackTop
            target={() => scrollRef.current as HTMLElement}
            visibilityHeight={800}
            tooltip="回到顶部"
            style={{ right: 36, bottom: 86 }}
          />
          {/* <Footer className="!pt-0">
            <div className="flex w-full justify-center">如需帮助请联系 1234567890</div>
          </Footer> */}
        </Layout>
      </Layout>

      {/* 修改密码弹窗 */}
      <ChangePasswordModal
        open={changePasswordModalOpen}
        onCancel={() => setChangePasswordModalOpen(false)}
        userId={user?.id}
        title="修改密码"
      />
    </Layout>
  )
}

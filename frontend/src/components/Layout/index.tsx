import { Breadcrumb, FloatButton, Layout, Menu, MenuProps } from 'antd'
import { FC, ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { Link, useLocation, useNavigate, useOutlet } from 'react-router'

import ErrorPage from '@/components/Error'
import Forbidden from '@/components/Forbidden'
import { UserAvatarDropdown } from '@/components/UserAvatarDropdown'
import { isFullPermissionRole } from '@/config/roleNames'
import {
  getAllRoutes,
  getBreadcrumbItems,
  getSideMenuRoutes,
  getTopMenuRoutes
} from '@/router/routesConfig'
import { useAuthStore } from '@/stores/authStore'

const { Header, Sider, Content /* Footer */ } = Layout

export const Component: FC = () => {
  // Router hooks
  const outlet = useOutlet()
  const navigate = useNavigate()
  const { pathname } = useLocation()

  // Store 取值
  const user = useAuthStore(state => state.user)
  const token = useAuthStore(state => state.token)
  const fetchProfile = useAuthStore(state => state.fetchProfile)

  // useState
  const [collapsed, setCollapsed] = useState(false)
  const [openKeys, setOpenKeys] = useState<string[]>([])

  // useRef
  const scrollRef = useRef<HTMLDivElement | null>(null)

  // useEffect
  // 主动获取用户信息
  useEffect(() => {
    // 有token时，无条件获取用户信息来验证token有效性
    if (token) {
      fetchProfile()
    }
  }, [token])

  // useMemo - 派生变量
  const topRoutes = useMemo(() => getTopMenuRoutes(), [])

  const sideRoutes = useMemo(
    () =>
      getSideMenuRoutes(
        user?.role && user.role.name
          ? { name: user.role.name, allowedRoutes: user.role.allowedRoutes || [] }
          : undefined
      ),
    [user?.role]
  )

  // 计算路径相关的状态（合并所有依赖pathname的hooks）
  const { topNavSelectedKey, sideMenuSelectedKey, defaultOpenKeys, breadcrumbItems, currentRoute } =
    useMemo(() => {
      const pathSegments = pathname.split('/').filter(Boolean)
      const allRoutes = getAllRoutes()

      // 查找当前路由
      const currentRoute = allRoutes.find(route => {
        const routePathPattern = route.path.replace(/\/:[^/]+/g, '/[^/]+')
        const regex = new RegExp(`^${routePathPattern}$`)
        return regex.test(pathname)
      })

      // 计算面包屑项
      const breadcrumbItems = getBreadcrumbItems(pathname).map(item => ({
        title:
          item.component && item.path !== pathname ? (
            <Link to={item.path}>{item.title}</Link>
          ) : (
            item.title
          )
      }))

      return {
        topNavSelectedKey: pathSegments.length === 0 ? ['/home'] : [`/${pathSegments[0]}`],
        defaultOpenKeys: pathSegments.length > 1 ? [`/${pathSegments[0]}`] : [],
        sideMenuSelectedKey: currentRoute?.menuParent ? [currentRoute.menuParent] : [pathname],
        breadcrumbItems,
        currentRoute
      }
    }, [pathname])

  // 根据路由配置生成顶部菜单项
  const topMenuItems: MenuProps['items'] = useMemo(
    () =>
      topRoutes.map(route => ({
        key: route.path,
        label: route.title,
        icon: route.icon
      })),
    [topRoutes]
  )

  // 根据路由配置生成侧边菜单项
  const menuItems: MenuProps['items'] = useMemo(
    () =>
      sideRoutes.map(route => {
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

        if (route.children && route.children.filter(child => !child.menuParent).length > 0) {
          item.children = route.children
            .filter(child => !child.menuParent)
            .map(child => ({
              key: child.path,
              label: child.title
            }))
        }

        return item
      }),
    [sideRoutes]
  )

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

    // 检查是否为menuParent的路由（无条件允许访问）
    if (currentRoute?.menuParent) {
      return true
    }

    // 其他角色按allowedRoutes检查侧边栏菜单权限
    const allowed = user.role?.allowedRoutes || []
    // 精确匹配或以参数结尾的动态路由
    return allowed.some(route => pathname === route || pathname.startsWith(route + '/'))
  }, [user, pathname, topRoutes, currentRoute])

  // useEffect - 当路由变化时，自动展开对应的父菜单
  useEffect(() => {
    setOpenKeys(defaultOpenKeys)
  }, [defaultOpenKeys])

  // 方法定义
  const handleMenuClick: MenuProps['onClick'] = e => {
    navigate(e.key)
  }

  // 处理菜单展开/收起
  const handleOpenChange = (keys: string[]) => {
    setOpenKeys(keys)
  }

  return (
    <Layout className="h-screen w-full">
      <Header className="flex items-center !pl-[29px] text-white">
        <div className="flex-shrink-0 text-xl font-bold text-white">青岛盛文财税咨询有限公司</div>
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
          <UserAvatarDropdown
            user={user}
            isLoggedIn={!!user}
          />
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
              selectedKeys={sideMenuSelectedKey}
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
    </Layout>
  )
}

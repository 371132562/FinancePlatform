import {
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  ReloadOutlined,
  SyncOutlined
} from '@ant-design/icons'
import { Button, Skeleton, Tooltip } from 'antd'
import { FC, useMemo } from 'react'

import { SystemRoleNames } from '@/config/roleNames'
import { useAuthStore } from '@/stores/authStore'
import { useScheduleStore } from '@/stores/scheduleStore'
import { dayjs } from '@/utils/dayjs'

/**
 * 日程统计看板组件
 * 展示待完成、进行中、有风险的日程数量
 * 仅系统管理员和公司管理者可见
 */
const ScheduleStatistics: FC = () => {
  // 获取当前用户信息
  const user = useAuthStore(state => state.user)

  // 从store获取数据
  const statistics = useScheduleStore(state => state.statistics)
  const statisticsLoading = useScheduleStore(state => state.statisticsLoading)
  const statisticsNextUpdateTime = useScheduleStore(state => state.statisticsNextUpdateTime)
  const statisticsUpdateTime = useScheduleStore(state => state.statisticsUpdateTime)
  const fetchStatistics = useScheduleStore(state => state.fetchStatistics)

  // 检查是否有权限查看统计看板
  const hasPermission = useMemo(() => {
    return user?.role?.name === SystemRoleNames.ADMIN || user?.role?.name === SystemRoleNames.BOSS
  }, [user?.role?.name])

  // 无权限则不显示
  if (!hasPermission) {
    return null
  }

  // 处理刷新按钮点击
  const handleRefresh = () => {
    fetchStatistics(true)
  }

  // 加载状态
  if (statisticsLoading && !statistics) {
    return (
      <div className="mb-6 rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-4 border-b border-gray-100 pb-3">
          <Skeleton
            active
            paragraph={{ rows: 0 }}
            title={{ width: 80 }}
          />
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Skeleton
              key={i}
              active
              avatar={{ size: 40 }}
              paragraph={{ rows: 2 }}
            />
          ))}
        </div>
      </div>
    )
  }

  // 无数据状态
  if (!statistics) {
    return null
  }

  // 统计项配置
  const statisticsItems = [
    {
      label: '待完成',
      value: statistics.pending,
      icon: <ClockCircleOutlined />,
      bgColor: '#e6f7ff',
      iconColor: '#1890ff',
      textColor: '#0050b3'
    },
    {
      label: '进行中',
      value: statistics.inProgress,
      icon: <SyncOutlined />,
      bgColor: '#fff7e6',
      iconColor: '#fa8c16',
      textColor: '#ad6800'
    },
    {
      label: '有风险',
      value: statistics.atRisk,
      icon: <ExclamationCircleOutlined />,
      bgColor: '#fff1f0',
      iconColor: '#ff4d4f',
      textColor: '#cf1322'
    }
  ]

  return (
    <div className="mb-6 rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      {/* 标题栏 */}
      <div className="mb-4 border-b border-gray-100 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-gray-800">日程统计</h3>
            {statisticsUpdateTime && (
              <span className="text-xs text-gray-400">
                统计时间: {dayjs(statisticsUpdateTime).format('YYYY年MM月DD日 HH:mm:ss')}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {statisticsNextUpdateTime && (
              <span className="text-xs text-gray-500">
                下次更新: {dayjs(statisticsNextUpdateTime).format('HH:mm:ss')}
              </span>
            )}
            <Tooltip title="立即刷新统计数据">
              <Button
                icon={<ReloadOutlined />}
                onClick={handleRefresh}
                loading={statisticsLoading}
                size="small"
                variant="text"
                type="text"
              >
                刷新
              </Button>
            </Tooltip>
          </div>
        </div>
      </div>

      {/* 统计卡片区域 */}
      <div className="grid grid-cols-3 gap-4">
        {statisticsItems.map((item, index) => (
          <div
            key={index}
            className="group cursor-pointer rounded-lg border border-gray-100 p-4 transition-all hover:border-gray-300 hover:shadow-md"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-lg"
                  style={{ backgroundColor: item.bgColor }}
                >
                  <span
                    className="text-base"
                    style={{ color: item.iconColor }}
                  >
                    {item.icon}
                  </span>
                </div>
                <div>
                  <div className="text-xs text-gray-500">{item.label}</div>
                  <div
                    className="mt-1 text-2xl font-semibold"
                    style={{ color: item.textColor }}
                  >
                    {item.value}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ScheduleStatistics

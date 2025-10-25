import {
  ArrowLeftOutlined,
  ClockCircleOutlined,
  SendOutlined,
  UserOutlined
} from '@ant-design/icons'
import { Badge, Button, Card, Divider, Input, message, Modal, Space } from 'antd'
import { FC, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'

import { SystemRoleNames } from '@/config/roleNames'
import { useScheduleStore } from '@/stores/scheduleStore'
import { getScheduleStatusOptions, ScheduleStatusOption } from '@/types'
import { dayjs } from '@/utils/dayjs'

const { TextArea } = Input

// 状态选项
const statusOptions: ScheduleStatusOption[] = getScheduleStatusOptions()

const ScheduleDetail: FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const currentSchedule = useScheduleStore(state => state.currentSchedule)
  const loading = useScheduleStore(state => state.loading)
  const fetchScheduleDetail = useScheduleStore(state => state.fetchScheduleDetail)
  const updateScheduleStatus = useScheduleStore(state => state.updateScheduleStatus)
  const addComment = useScheduleStore(state => state.addComment)

  const [newComment, setNewComment] = useState('')
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)

  // 获取日程详情
  useEffect(() => {
    if (id) {
      fetchScheduleDetail(id)
    }
  }, [id])

  // 更新日程状态
  const handleStatusChange = async (status: string) => {
    if (!id) return

    // 如果选择的是当前状态，不执行更新操作（静默处理）
    if (currentSchedule && status === currentSchedule.status) {
      return
    }

    // 二次确认
    Modal.confirm({
      title: '确认修改状态',
      content: `确定要将状态从"${currentSchedule?.status}"修改为"${status}"吗？`,
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        const success = await updateScheduleStatus({ id, status })
        if (success) {
          message.success('状态更新成功')
          // 重新获取任务详情以刷新状态显示
          fetchScheduleDetail(id)
        }
      }
    })
  }

  // 添加回复
  const handleAddComment = async () => {
    if (!newComment.trim() || !id) return

    setIsSubmittingComment(true)
    const success = await addComment(id, newComment.trim())
    if (success) {
      message.success('回复添加成功')
      setNewComment('')
      // 重新获取任务详情以刷新评论列表
      fetchScheduleDetail(id)
    }
    setIsSubmittingComment(false)
  }

  if (loading) {
    return <div className="flex justify-center p-8">加载中...</div>
  }

  if (!currentSchedule) {
    return <div className="flex justify-center p-8">日程不存在</div>
  }

  return (
    <div className="mx-auto w-full max-w-7xl p-4">
      {/* 返回按钮 */}
      <div className="mb-4">
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/schedule/list')}
          className="!border-gray-300 !text-gray-600 hover:!border-blue-500 hover:!text-blue-500"
        >
          返回列表
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* 左侧：日程详情 */}
        <div className="lg:col-span-2">
          <Card
            title={
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold">{currentSchedule.title}</span>
              </div>
            }
            className="!border-gray-200 !shadow-sm"
          >
            <div className="space-y-4">
              {/* 日程描述 */}
              <div>
                <div className="mb-2 text-sm font-medium text-gray-700">日程描述</div>
                <div className="rounded-lg bg-gray-50 p-4 leading-relaxed text-gray-800">
                  {currentSchedule.description}
                </div>
              </div>

              {/* 基本信息 */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <div className="mb-2 text-sm font-medium text-gray-700">创建人</div>
                  <div className="flex items-center gap-2">
                    <UserOutlined className="text-gray-400" />
                    <span className="text-gray-800">{currentSchedule.creator.name}</span>
                  </div>
                </div>
                <div>
                  <div className="mb-2 text-sm font-medium text-gray-700">创建时间</div>
                  <div className="flex items-center gap-2">
                    <ClockCircleOutlined className="text-gray-400" />
                    <span className="text-gray-800">
                      {dayjs(currentSchedule.createTime).format('YYYY年MM月DD日 HH:mm:ss')}
                    </span>
                  </div>
                </div>
              </div>

              {/* 执行人员 */}
              <div>
                <div className="mb-2 text-sm font-medium text-gray-700">执行人员</div>
                <div className="flex flex-wrap gap-2">
                  {currentSchedule.assignedUsers.map(user => (
                    <div
                      key={user.id}
                      className="flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700"
                    >
                      <UserOutlined />
                      <span>{user.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* 日程讨论 */}
          <Card
            title="日程讨论"
            className="!mt-4 !border-gray-200 !shadow-sm"
          >
            <div className="space-y-4">
              {/* 回复列表 */}
              <div className="max-h-96 space-y-3 overflow-y-auto">
                {currentSchedule.comments.map(comment => {
                  const isCommentFromBoss =
                    comment.user.role?.name === SystemRoleNames.BOSS ||
                    comment.user.role?.name === SystemRoleNames.ADMIN

                  return (
                    <div
                      key={comment.id}
                      className={`flex ${isCommentFromBoss ? 'justify-start' : 'justify-end'}`}
                    >
                      <div
                        className={`max-w-xs rounded-lg px-4 py-3 lg:max-w-md ${
                          isCommentFromBoss
                            ? 'border border-blue-200 bg-blue-50'
                            : 'border border-green-200 bg-green-50'
                        }`}
                      >
                        <div className="mb-2 flex items-center gap-2">
                          <UserOutlined className="text-gray-400" />
                          <span className="text-sm font-medium text-gray-800">
                            {comment.user.name}
                          </span>
                        </div>
                        <div className="mb-2 text-xs text-gray-500">
                          {dayjs(comment.createTime).format('YYYY年MM月DD日 HH:mm:ss')}
                        </div>
                        <div className="whitespace-pre-wrap text-sm leading-relaxed text-gray-800">
                          {comment.content}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              <Divider />

              {/* 添加回复 */}
              <div className="!space-y-3">
                <TextArea
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  placeholder="添加回复..."
                  rows={5}
                  className="!border-gray-300 focus:!border-blue-500"
                />
                <div className="flex justify-end">
                  <Button
                    variant="outlined"
                    color="primary"
                    icon={<SendOutlined />}
                    onClick={handleAddComment}
                    loading={isSubmittingComment}
                    disabled={!newComment.trim()}
                  >
                    发送回复
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* 右侧：状态信息 */}
        <div className="lg:col-span-1">
          <Card
            title="状态信息"
            className="!border-gray-200 !shadow-sm"
          >
            <div className="space-y-4">
              <div>
                <div className="mb-2 text-sm font-medium text-gray-700">当前状态</div>
                <Badge
                  status="processing"
                  text={
                    <span className="text-lg font-medium text-gray-800">
                      {currentSchedule.status}
                    </span>
                  }
                />
              </div>

              <Divider className="!my-4" />

              <div>
                <div className="mb-3 text-sm font-medium text-gray-700">更新日程状态</div>
                <Space
                  direction="vertical"
                  className="w-full"
                >
                  {statusOptions.map(option => (
                    <Button
                      key={option.value}
                      variant={currentSchedule.status === option.value ? 'solid' : 'outlined'}
                      color={currentSchedule.status === option.value ? 'primary' : 'default'}
                      onClick={() => handleStatusChange(option.value)}
                      className={`w-full !text-left`}
                    >
                      {option.label}
                    </Button>
                  ))}
                </Space>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default ScheduleDetail

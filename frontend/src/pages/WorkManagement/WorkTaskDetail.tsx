import { ArrowLeftOutlined, SendOutlined } from '@ant-design/icons'
import { Avatar, Button, Input, message, Select, Tag } from 'antd'
import { FC, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'

import { useAuthStore } from '@/stores/authStore'
import { useWorkTaskStore } from '@/stores/workTaskStore'

const { Option } = Select
const { TextArea } = Input

// 状态选项
const statusOptions = [
  { value: '未完成', label: '未完成' },
  { value: '进行中', label: '进行中' },
  { value: '有风险', label: '有风险' },
  { value: '已完成', label: '已完成' },
  { value: '已停止', label: '已停止' }
]

const WorkTaskDetail: FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { currentTask, loading, fetchTaskDetail, updateTask, addComment, deleteComment } =
    useWorkTaskStore()
  const { user } = useAuthStore()

  const [newComment, setNewComment] = useState('')
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)

  // 获取工作项详情
  useEffect(() => {
    if (id) {
      fetchTaskDetail(id)
    }
  }, [id, fetchTaskDetail])

  // 更新工作项状态
  const handleStatusChange = async (status: string) => {
    if (!id) return

    const success = await updateTask({ id, status })
    if (success) {
      message.success('状态更新成功')
    }
  }

  // 添加评论
  const handleAddComment = async () => {
    if (!newComment.trim() || !id) return

    setIsSubmittingComment(true)
    const success = await addComment(id, newComment.trim())
    if (success) {
      message.success('评论添加成功')
      setNewComment('')
    }
    setIsSubmittingComment(false)
  }

  // 删除评论
  const handleDeleteComment = async (commentId: string) => {
    const success = await deleteComment(commentId)
    if (success) {
      message.success('评论删除成功')
    }
  }

  if (loading) {
    return <div className="flex justify-center p-8">加载中...</div>
  }

  if (!currentTask) {
    return <div className="flex justify-center p-8">工作项不存在</div>
  }

  return (
    <div className="w-full max-w-7xl">
      {/* 返回按钮 */}
      <div className="mb-4">
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/work/list')}
        >
          返回列表
        </Button>
      </div>

      {/* 工作项信息 */}
      <div className="mb-6 rounded-lg border bg-white p-6">
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold">{currentTask.title}</h2>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">工作描述</label>
            <div className="rounded border bg-gray-50 p-3">{currentTask.description}</div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium">状态</label>
              <Select
                value={currentTask.status}
                onChange={handleStatusChange}
                style={{ width: '100%' }}
              >
                {statusOptions.map(option => (
                  <Option
                    key={option.value}
                    value={option.value}
                  >
                    {option.label}
                  </Option>
                ))}
              </Select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">创建人</label>
              <div className="flex items-center space-x-2">
                <Avatar size="small">{currentTask.creator.name.charAt(0)}</Avatar>
                <span>{currentTask.creator.name}</span>
              </div>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">关联人员</label>
            <div className="flex flex-wrap gap-2">
              {currentTask.assignedUsers.map(user => (
                <div
                  key={user.id}
                  className="flex items-center space-x-1 rounded bg-blue-50 px-2 py-1"
                >
                  <Avatar size="small">{user.name.charAt(0)}</Avatar>
                  <span className="text-sm">{user.name}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="text-sm text-gray-500">
            创建时间：{new Date(currentTask.createTime).toLocaleString()}
          </div>
        </div>
      </div>

      {/* 评论区域 */}
      <div className="rounded-lg border bg-white p-6">
        <h3 className="mb-4 text-lg font-semibold">工作讨论</h3>
        <div className="space-y-4">
          {/* 评论列表 */}
          <div className="max-h-96 space-y-3 overflow-y-auto">
            {currentTask.comments.map(comment => {
              const isCommentFromBoss =
                comment.user.role?.name === 'boss' || comment.user.role?.name === 'admin'
              const isCurrentUserComment = comment.user.id === user?.id

              return (
                <div
                  key={comment.id}
                  className={`flex ${isCommentFromBoss ? 'justify-start' : 'justify-end'}`}
                >
                  <div
                    className={`max-w-xs rounded-lg px-4 py-2 lg:max-w-md ${
                      isCommentFromBoss
                        ? 'bg-blue-100 text-blue-900'
                        : 'bg-green-100 text-green-900'
                    }`}
                  >
                    <div className="mb-1 flex items-center space-x-2">
                      <Avatar size="small">{comment.user.name.charAt(0)}</Avatar>
                      <span className="text-sm font-medium">{comment.user.name}</span>
                      <Tag color={isCommentFromBoss ? 'blue' : 'green'}>
                        {isCommentFromBoss ? '老板' : '员工'}
                      </Tag>
                      {(isCurrentUserComment ||
                        user?.role?.name === 'boss' ||
                        user?.role?.name === 'admin') && (
                        <Button
                          type="link"
                          size="small"
                          danger
                          onClick={() => handleDeleteComment(comment.id)}
                        >
                          删除
                        </Button>
                      )}
                    </div>
                    <div className="whitespace-pre-wrap text-sm">{comment.content}</div>
                    <div className="mt-1 text-xs text-gray-500">
                      {new Date(comment.createTime).toLocaleString()}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* 添加评论 */}
          <div className="border-t pt-4">
            <div className="space-y-2">
              <TextArea
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                placeholder="添加评论..."
                rows={3}
              />
              <div className="flex justify-end">
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  onClick={handleAddComment}
                  loading={isSubmittingComment}
                  disabled={!newComment.trim()}
                >
                  发送
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default WorkTaskDetail

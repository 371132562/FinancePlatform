import { PlusOutlined } from '@ant-design/icons'
import { Button, Form, Input, message, Modal, Select, Spin, Table, Tag } from 'antd'
import { FC, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'

import { SystemRoleNames } from '@/config/roleNames'
import { useAuthStore } from '@/stores/authStore'
import { useNotificationStore } from '@/stores/notificationStore'
import { useScheduleStore } from '@/stores/scheduleStore'
import { useUserStore } from '@/stores/userStore'
import type { ScheduleList } from '@/types'
import { getScheduleStatusOptions, ScheduleItem } from '@/types'
import { dayjs } from '@/utils/dayjs'

import ScheduleStatistics from './components/ScheduleStatistics'

const { Option } = Select
const { TextArea } = Input
const { Search } = Input

// 状态选项
const statusOptions = [{ value: '', label: '全部状态' }, ...getScheduleStatusOptions()]

const ScheduleList: FC = () => {
  // Router hooks
  const navigate = useNavigate()

  // Store 取值
  const scheduleList = useScheduleStore(state => state.scheduleList)
  const loading = useScheduleStore(state => state.loading)
  const fetchScheduleList = useScheduleStore(state => state.fetchScheduleList)
  const createSchedule = useScheduleStore(state => state.createSchedule)
  const updateScheduleStatus = useScheduleStore(state => state.updateScheduleStatus)
  const deleteSchedule = useScheduleStore(state => state.deleteSchedule)
  const fetchStatistics = useScheduleStore(state => state.fetchStatistics)

  const userList = useUserStore(state => state.userList)
  const fetchUserList = useUserStore(state => state.fetchUserList)
  const user = useAuthStore(state => state.user)
  const fetchUnreadNotifications = useNotificationStore(state => state.fetchUnreadNotifications)

  // useState
  const [searchParams, setSearchParams] = useState<ScheduleList>({
    page: 1,
    pageSize: 10,
    status: '',
    keyword: ''
  })

  const [createModalVisible, setCreateModalVisible] = useState(false)
  const [form] = Form.useForm()

  // useEffect
  useEffect(() => {
    fetchScheduleList(searchParams)
    fetchUserList()
    // 只有管理员才获取统计数据
    if (canDelete) {
      fetchStatistics()
    }
  }, [])

  // useMemo - 派生变量
  // 检查是否有删除权限
  const canDelete = useMemo(
    () => user?.role?.name === SystemRoleNames.ADMIN || user?.role?.name === SystemRoleNames.BOSS,
    [user?.role?.name]
  )

  const columns = useMemo(
    () => [
      {
        title: '日程标题',
        dataIndex: 'title',
        key: 'title',
        ellipsis: true,
        render: (text: string, record: ScheduleItem) => (
          <Button
            variant="link"
            color="primary"
            onClick={() => navigate(`/schedule/detail/${record.id}`)}
          >
            {text}
          </Button>
        )
      },
      {
        title: '状态',
        dataIndex: 'status',
        key: 'status',
        width: 150,
        render: (status: string, record: ScheduleItem) => (
          <Select
            value={status}
            style={{ width: 120 }}
            onChange={value => {
              if (value !== status) {
                // 使用Popconfirm进行二次确认
                Modal.confirm({
                  title: '确认修改状态',
                  content: `确定要将状态从"${status}"修改为"${value}"吗？`,
                  okText: '确认',
                  cancelText: '取消',
                  onOk: () => handleStatusUpdate(record.id, value)
                })
              }
            }}
          >
            {statusOptions.slice(1).map(option => (
              <Option
                key={option.value}
                value={option.value}
              >
                {option.label}
              </Option>
            ))}
          </Select>
        )
      },
      {
        title: '创建人',
        dataIndex: 'creator',
        key: 'creator',
        width: 120,
        render: (creator: ScheduleItem['creator']) => creator?.name || '-'
      },
      {
        title: '执行人员',
        dataIndex: 'assignedUsers',
        key: 'assignedUsers',
        width: 200,
        render: (assignedUsers: ScheduleItem['assignedUsers']) => (
          <div>
            {assignedUsers?.slice(0, 2).map(user => (
              <Tag key={user.id}>{user.name}</Tag>
            ))}
            {assignedUsers && assignedUsers.length > 2 && <Tag>+{assignedUsers.length - 2}</Tag>}
          </div>
        )
      },
      {
        title: '创建时间',
        dataIndex: 'createTime',
        key: 'createTime',
        width: 150,
        render: (time: Date) => dayjs(time).format('YYYY年MM月DD日 HH:mm:ss')
      },
      // 只有有权限的用户才显示操作列
      ...(canDelete
        ? [
            {
              title: '操作',
              key: 'action',
              width: 100,
              render: (record: ScheduleItem) => {
                return (
                  <Button
                    variant="outlined"
                    danger
                    onClick={() => {
                      Modal.confirm({
                        title: '确认删除',
                        content: '删除日程后，相关通知也会被删除，此操作不可恢复，确定要删除吗？',
                        okText: '确定',
                        cancelText: '取消',
                        okButtonProps: { danger: true },
                        onOk: () => handleDeleteTask(record.id)
                      })
                    }}
                  >
                    删除
                  </Button>
                )
              }
            }
          ]
        : [])
    ],
    [navigate, canDelete]
  )

  // 方法定义
  const handleSearch = (value: string) => {
    setSearchParams(prev => ({ ...prev, keyword: value, page: 1 }))
    fetchScheduleList({ ...searchParams, keyword: value, page: 1 })
  }

  const handleStatusChange = (value: string) => {
    setSearchParams(prev => ({ ...prev, status: value, page: 1 }))
    fetchScheduleList({ ...searchParams, status: value, page: 1 })
  }

  const handleCreateTask = async () => {
    try {
      const values = await form.validateFields()
      const success = await createSchedule(values)
      if (success) {
        message.success('日程创建成功')
        setCreateModalVisible(false)
        form.resetFields()
        fetchScheduleList(searchParams)
      }
    } catch (error) {
      console.error('表单验证失败:', error)
    }
  }

  const handleStatusUpdate = async (taskId: string, newStatus: string) => {
    const success = await updateScheduleStatus({ id: taskId, status: newStatus })
    if (success) {
      message.success('状态更新成功')
      fetchScheduleList(searchParams)
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    const success = await deleteSchedule(taskId)
    if (success) {
      message.success('日程删除成功')
      fetchScheduleList(searchParams)
      // 刷新未读通知（因为相关通知可能被删除）
      fetchUnreadNotifications()
    }
  }

  return (
    <div className="w-full max-w-7xl">
      {/* 统计看板 */}
      <ScheduleStatistics />

      {/* 搜索和筛选区域 */}
      <div className="mb-4 flex justify-between">
        <div className="flex items-center space-x-4">
          <Search
            placeholder="搜索日程标题或描述"
            onSearch={handleSearch}
            style={{ width: 200 }}
            allowClear
          />
          <Select
            placeholder="选择状态"
            value={searchParams.status}
            onChange={handleStatusChange}
            style={{ width: 120 }}
            allowClear
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
        <Button
          variant="outlined"
          color="primary"
          icon={<PlusOutlined />}
          onClick={() => setCreateModalVisible(true)}
        >
          新建日程
        </Button>
      </div>

      <Spin spinning={loading}>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={scheduleList}
          pagination={{
            current: searchParams.page,
            pageSize: searchParams.pageSize,
            total: scheduleList.length,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: total => `共 ${total} 条记录`,
            onChange: (page, pageSize) => {
              setSearchParams(prev => ({ ...prev, page, pageSize: pageSize || 10 }))
            }
          }}
        />
      </Spin>

      {/* 创建日程弹窗 */}
      <Modal
        title="新建日程"
        open={createModalVisible}
        onCancel={() => {
          setCreateModalVisible(false)
          form.resetFields()
        }}
        footer={[
          <Button
            key="cancel"
            onClick={() => {
              setCreateModalVisible(false)
              form.resetFields()
            }}
          >
            取消
          </Button>,
          <Button
            key="create"
            variant="outlined"
            color="primary"
            onClick={handleCreateTask}
          >
            创建
          </Button>
        ]}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{ title: '', description: '', assignedUserIds: [] }}
        >
          <Form.Item
            name="title"
            label="日程标题"
            rules={[{ required: true, message: '请输入日程标题' }]}
          >
            <Input
              placeholder="请输入日程标题"
              maxLength={100}
            />
          </Form.Item>

          <Form.Item
            name="description"
            label="日程描述"
            rules={[{ required: true, message: '请输入日程描述' }]}
          >
            <TextArea
              placeholder="请输入日程描述"
              rows={4}
              maxLength={500}
            />
          </Form.Item>

          <Form.Item
            name="assignedUserIds"
            label="执行人员"
            rules={[{ required: true, message: '请选择执行人员' }]}
          >
            <Select
              mode="multiple"
              placeholder="请选择执行人员"
              style={{ width: '100%' }}
            >
              {userList
                .filter(
                  user =>
                    user.role?.name !== SystemRoleNames.ADMIN &&
                    user.role?.name !== SystemRoleNames.BOSS
                )
                .map(user => (
                  <Option
                    key={user.id}
                    value={user.id}
                  >
                    {user.name}
                  </Option>
                ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default ScheduleList

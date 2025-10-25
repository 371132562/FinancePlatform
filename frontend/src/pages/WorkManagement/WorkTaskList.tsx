import { PlusOutlined } from '@ant-design/icons'
import { Button, Form, Input, message, Modal, Select, Spin, Table, Tag } from 'antd'
import { FC, useEffect, useState } from 'react'
import { useNavigate } from 'react-router'

import { SystemRoleNames } from '@/config/roleNames'
import { useUserStore } from '@/stores/userStore'
import { useWorkTaskStore } from '@/stores/workTaskStore'
import type { WorkTaskItem, WorkTaskList } from '@/types'

const { Option } = Select
const { TextArea } = Input
const { Search } = Input

// 状态选项
const statusOptions = [
  { value: '', label: '全部状态' },
  { value: '未完成', label: '未完成' },
  { value: '进行中', label: '进行中' },
  { value: '有风险', label: '有风险' },
  { value: '已完成', label: '已完成' },
  { value: '已停止', label: '已停止' }
]

// 状态颜色映射
const statusColorMap: Record<string, string> = {
  未完成: 'default',
  进行中: 'processing',
  有风险: 'warning',
  已完成: 'success',
  已停止: 'error'
}

const WorkTaskList: FC = () => {
  const navigate = useNavigate()
  const { taskList, loading, fetchTaskList, createTask } = useWorkTaskStore()
  const { userList, fetchUserList } = useUserStore()

  const [searchParams, setSearchParams] = useState<WorkTaskList>({
    page: 1,
    pageSize: 10,
    status: '',
    keyword: ''
  })

  const [createModalVisible, setCreateModalVisible] = useState(false)
  const [form] = Form.useForm()

  useEffect(() => {
    fetchTaskList(searchParams)
    fetchUserList()
  }, [fetchTaskList, fetchUserList])

  const handleSearch = (value: string) => {
    setSearchParams(prev => ({ ...prev, keyword: value, page: 1 }))
    fetchTaskList({ ...searchParams, keyword: value, page: 1 })
  }

  const handleStatusChange = (value: string) => {
    setSearchParams(prev => ({ ...prev, status: value, page: 1 }))
    fetchTaskList({ ...searchParams, status: value, page: 1 })
  }

  const handleCreateTask = async () => {
    try {
      const values = await form.validateFields()
      const success = await createTask(values)
      if (success) {
        message.success('工作项创建成功')
        setCreateModalVisible(false)
        form.resetFields()
        fetchTaskList(searchParams)
      }
    } catch (error) {
      console.error('表单验证失败:', error)
    }
  }

  const columns = [
    {
      title: '工作标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      render: (text: string, record: WorkTaskItem) => (
        <Button
          type="link"
          onClick={() => navigate(`/work/detail/${record.id}`)}
          style={{ padding: 0, height: 'auto' }}
        >
          {text}
        </Button>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => <Tag color={statusColorMap[status] || 'default'}>{status}</Tag>
    },
    {
      title: '创建人',
      dataIndex: 'creator',
      key: 'creator',
      width: 120,
      render: (creator: WorkTaskItem['creator']) => creator?.name || '-'
    },
    {
      title: '执行人员',
      dataIndex: 'assignedUsers',
      key: 'assignedUsers',
      width: 200,
      render: (assignedUsers: WorkTaskItem['assignedUsers']) => (
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
      render: (time: Date) => new Date(time).toLocaleString()
    }
  ]

  return (
    <div className="w-full max-w-7xl">
      {/* 搜索和筛选区域 */}
      <div className="mb-4 flex justify-between">
        <div className="flex items-center space-x-4">
          <Search
            placeholder="搜索工作标题或描述"
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
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setCreateModalVisible(true)}
        >
          新建工作
        </Button>
      </div>

      <Spin spinning={loading}>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={taskList}
          pagination={{
            current: searchParams.page,
            pageSize: searchParams.pageSize,
            total: taskList.length,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: total => `共 ${total} 条记录`,
            onChange: (page, pageSize) => {
              setSearchParams(prev => ({ ...prev, page, pageSize: pageSize || 10 }))
            }
          }}
        />
      </Spin>

      {/* 创建工作项弹窗 */}
      <Modal
        title="新建工作项"
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
            type="primary"
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
            label="工作标题"
            rules={[{ required: true, message: '请输入工作标题' }]}
          >
            <Input
              placeholder="请输入工作标题"
              maxLength={100}
            />
          </Form.Item>

          <Form.Item
            name="description"
            label="工作描述"
            rules={[{ required: true, message: '请输入工作描述' }]}
          >
            <TextArea
              placeholder="请输入工作描述"
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

export default WorkTaskList

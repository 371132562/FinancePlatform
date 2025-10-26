import { Button, Form, Input, message, Modal } from 'antd'
import { FC, useState } from 'react'

import { useUserStore } from '@/stores/userStore'

interface ChangePasswordModalProps {
  /** 是否显示弹窗 */
  open: boolean
  /** 关闭弹窗回调 */
  onCancel: () => void
  /** 修改成功回调 */
  onSuccess?: () => void
  /** 用户ID，如果不传则修改当前用户密码 */
  userId?: string
  /** 弹窗标题 */
  title?: string
}

/**
 * 修改密码弹窗组件
 */
const ChangePasswordModal: FC<ChangePasswordModalProps> = ({
  open,
  onCancel,
  onSuccess,
  userId,
  title = '修改密码'
}) => {
  // Store 取值
  const { resetUserPassword } = useUserStore()

  // useState
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)

  // 方法定义
  // 处理表单提交
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      setLoading(true)

      // 如果没有传入userId，说明是修改当前用户密码，需要获取当前用户ID
      if (!userId) {
        message.error('无法获取用户信息，请重新登录')
        return
      }

      const success = await resetUserPassword({
        id: userId,
        newPassword: values.newPassword
      })

      if (success) {
        message.success('密码修改成功')
        form.resetFields()
        onSuccess?.()
        onCancel()
      }
    } catch (error) {
      console.error('密码修改失败:', error)
    } finally {
      setLoading(false)
    }
  }

  // 处理弹窗关闭
  const handleCancel = () => {
    form.resetFields()
    onCancel()
  }

  return (
    <Modal
      title={title}
      open={open}
      onCancel={handleCancel}
      footer={[
        <Button
          key="cancel"
          onClick={handleCancel}
        >
          取消
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={loading}
          onClick={handleSubmit}
        >
          确认修改
        </Button>
      ]}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          newPassword: '',
          confirmPassword: ''
        }}
      >
        <Form.Item
          name="newPassword"
          label="新密码"
          rules={[{ required: true, message: '请输入新密码' }]}
        >
          <Input.Password
            placeholder="请输入新密码"
            maxLength={32}
          />
        </Form.Item>

        <Form.Item
          name="confirmPassword"
          label="重复新密码"
          dependencies={['newPassword']}
          rules={[
            { required: true, message: '请再次输入新密码' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('newPassword') === value) {
                  return Promise.resolve()
                }
                return Promise.reject(new Error('两次输入的密码不一致'))
              }
            })
          ]}
        >
          <Input.Password
            placeholder="请再次输入新密码"
            maxLength={32}
          />
        </Form.Item>
      </Form>
    </Modal>
  )
}

export default ChangePasswordModal

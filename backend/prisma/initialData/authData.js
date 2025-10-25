const bcrypt = require('bcrypt')

// 系统内置角色名称常量
const SystemRoleNames = {
  ADMIN: '系统管理员',
  BOSS: '公司管理者',
  EMPLOYEE: '员工'
}

// 生成加密密码
const generatePassword = async (password) => {
  const saltRounds = 10
  return await bcrypt.hash(password, saltRounds)
}

// 角色定义：系统管理员、公司管理者、员工
const roles = [
  {
    name: SystemRoleNames.ADMIN,
    description: '系统管理员角色，拥有所有权限，可以访问所有功能模块',
    allowedRoutes: [],
  },
  {
    name: SystemRoleNames.BOSS,
    description: '公司管理者角色，拥有所有权限，可以访问所有功能模块',
    allowedRoutes: [],
  },
  {
    name: SystemRoleNames.EMPLOYEE,
    description: '员工角色，拥有员工日程管理和通知消息权限',
    allowedRoutes: ['/schedule/list', '/schedule/detail', '/notifications'],
  },
]

// 用户定义：系统管理员、管理者、员工
const users = [
  {
    code: '88888888',
    name: SystemRoleNames.ADMIN,
    department: SystemRoleNames.ADMIN,
    email: '',
    phone: '',
    password: '88888888',
  },
  {
    code: 'b1',
    name: '管理者1',
    department: '管理部',
    email: '',
    phone: '',
    password: 'b1',
  },
  {
    code: 'b2',
    name: '管理者2',
    department: '管理部',
    email: '',
    phone: '',
    password: 'b2',
  },
  {
    code: 'e1',
    name: '员工1',
    department: '技术部',
    email: '',
    phone: '',
    password: 'e1',
  },
  {
    code: 'e2',
    name: '员工2',
    department: '技术部',
    email: '',
    phone: '',
    password: 'e2',
  },
  {
    code: 'e3',
    name: '员工3',
    department: '运营部',
    email: '',
    phone: '',
    password: 'e3',
  },
  {
    code: 'e4',
    name: '员工4',
    department: '运营部',
    email: '',
    phone: '',
    password: 'e4',
  },
]

// 生成加密后的用户数据
const generateUsers = async () => {
  const encryptedUsers = []
  
  for (const user of users) {
    const encryptedPassword = await generatePassword(user.password)
    encryptedUsers.push({
      ...user,
      password: encryptedPassword,
    })
  }
  
  return encryptedUsers
}

module.exports = {
  roles,
  users,
  generateUsers,
} 
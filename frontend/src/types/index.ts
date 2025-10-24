import { LazyExoticComponent, ReactNode } from 'react'
import type {
  // 文章管理相关类型
  ArticleItem,
  ArticleListResponse,
  ArticleMetaItem,
  // 角色管理相关类型
  AssignRoleRoutes,
  CommentItem,
  // 认证相关类型
  CreateArticle,
  CreateComment,
  CreateRole,
  // 用户管理相关类型
  CreateUserEncrypted,
  CreateWorkTask,
  DeleteArticle,
  DeleteComment,
  DeleteNotification,
  // 上传相关类型
  DeleteOrphans,
  DeleteRole,
  DeleteUser,
  DeleteWorkTask,
  ExportFormat,
  // 系统日志相关类型
  LogFileLevel,
  Login,
  LoginResponse,
  LogLineItem,
  LogUsersResDto,
  MarkRead,
  // 通知相关类型
  NotificationItem,
  NotificationList,
  NotificationListResDto,
  OrphanImagesResponse,
  PaginatedResponse,
  ReadLog,
  ReadUserLogReq,
  ResetUserPasswordEncrypted,
  RoleListItemDto,
  RoleListResDto,
  SystemLogFilesResDto,
  TokenPayloadDto,
  UnreadCountDto,
  UpdateArticle,
  UpdateRole,
  UpdateUser,
  UpdateWorkTask,
  UploadResponse,
  UserItem,
  UserListResDto,
  UserLogFilesReq,
  UserProfileDto,
  WorkTaskDetail,
  WorkTaskDetailResDto,
  // 工作项相关类型
  WorkTaskItem,
  WorkTaskList,
  WorkTaskListResDto
} from 'template-backend/types/dto'

/**
 * 路由项类型定义
 */
export type RouteItem = {
  path: string
  title: string
  icon?: ReactNode
  component?: React.ComponentType | LazyExoticComponent<React.ComponentType>
  hideInMenu?: boolean
  hideInBreadcrumb?: boolean
  children?: RouteItem[]
  adminOnly?: boolean // 仅admin可见
  /**
   * 菜单位置：用于区分顶部或侧边栏菜单。
   * 顶部/侧边的根节点需要设置；子路由可不设置（继承父级语义）。
   */
  menuPosition?: 'top' | 'side'
}

// ==================== 类型导出 ====================
// 按功能模块分组导出，便于查找和维护

// 通用类型
export type { ExportFormat, PaginatedResponse }

// 认证相关类型
export type { Login, LoginResponse, TokenPayloadDto, UserProfileDto }

// 文章管理相关类型
export type {
  ArticleItem,
  ArticleListResponse,
  ArticleMetaItem,
  CreateArticle,
  DeleteArticle,
  UpdateArticle
}

// 角色管理相关类型
export type {
  AssignRoleRoutes,
  CreateRole,
  DeleteRole,
  RoleListItemDto,
  RoleListResDto,
  UpdateRole
}

// 用户管理相关类型
export type {
  CreateUserEncrypted,
  DeleteUser,
  ResetUserPasswordEncrypted,
  UpdateUser,
  UserItem,
  UserListResDto
}

// 系统日志相关类型
export type {
  LogFileLevel,
  LogLineItem,
  LogUsersResDto,
  ReadLog,
  ReadUserLogReq,
  SystemLogFilesResDto,
  UserLogFilesReq
}

// 上传相关类型
export type { DeleteOrphans, OrphanImagesResponse, UploadResponse }

// 工作项相关类型
export type {
  CommentItem,
  CreateComment,
  CreateWorkTask,
  DeleteComment,
  DeleteWorkTask,
  UpdateWorkTask,
  WorkTaskDetail,
  WorkTaskDetailResDto,
  WorkTaskItem,
  WorkTaskList,
  WorkTaskListResDto
}

// 通知相关类型
export type {
  DeleteNotification,
  MarkRead,
  NotificationItem,
  NotificationList,
  NotificationListResDto,
  UnreadCountDto
}

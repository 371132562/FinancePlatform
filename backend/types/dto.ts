/* 统一导出所有 DTO 对应的 type，不导出 class */

// 文章模块 - 只导出类型
export type {
  ArticleItem,
  ArticleListResponse,
  ArticleMetaItem,
  CreateArticle,
  DeleteArticle,
  UpdateArticle,
} from '../src/businessModules/article/article.dto';

// 认证模块 - 只导出类型
export type {
  Login,
  LoginResponse,
  TokenPayloadDto,
  UserProfileDto,
} from '../src/commonModules/auth/auth.dto';

// 用户模块 - 只导出类型
export type {
  CreateUserEncrypted,
  DeleteUser,
  ResetUserPasswordEncrypted,
  UpdateUser,
  UserItem,
  UserListResDto,
} from '../src/businessModules/user/user.dto';

// 角色模块 - 只导出类型
export type {
  AssignRoleRoutes,
  CreateRole,
  DeleteRole,
  RoleListItemDto,
  RoleListResDto,
  UpdateRole,
} from '../src/businessModules/role/role.dto';

// 系统日志模块 - 只导出类型
export type {
  LogFileLevel,
  LogLineItem,
  LogUsersResDto,
  ReadLog,
  ReadUserLogReq,
  SystemLogFilesResDto,
  UserLogFilesReq,
} from '../src/commonModules/systemLogs/systemLogs.dto';

// 上传模块 - 只导出类型
export type {
  DeleteOrphans,
  OrphanImagesResponse,
  UploadResponse,
} from '../src/commonModules/upload/upload.dto';

// 日程模块 - 只导出类型
export type {
  CommentItem,
  CreateComment,
  CreateSchedule,
  DeleteSchedule,
  ScheduleDetail,
  ScheduleDetailResDto,
  ScheduleItem,
  ScheduleList,
  ScheduleListResDto,
  UpdateScheduleStatus,
} from '../src/businessModules/schedule/schedule.dto';

// 通知模块 - 只导出类型
export type {
  DeleteNotification,
  MarkRead,
  NotificationItem,
  NotificationList,
  NotificationListResDto,
} from '../src/commonModules/notification/notification.dto';

/**
 * 通用类型定义
 */

/**
 * 分页信息类型
 */
export type PaginationInfo = {
  page: number; // 当前页码，从1开始
  pageSize: number; // 每页数量
  total: number; // 总数量
  totalPages: number; // 总页数
};

/**
 * 分页响应类型
 */
export type PaginatedResponse<T> = {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
};

/**
 * 导出格式枚举
 */
export enum ExportFormat {
  XLSX = 'xlsx',
  CSV = 'csv',
  JSON = 'json',
}

/**
 * 日程状态枚举
 */
export enum ScheduleStatus {
  PENDING = '待完成',
  IN_PROGRESS = '进行中',
  AT_RISK = '有风险',
  COMPLETED = '已完成',
  STOPPED = '已停止',
}

/**
 * 日程状态选项类型
 */
export type ScheduleStatusOption = {
  value: ScheduleStatus;
  label: string;
};

/**
 * 通知类型枚举
 */
export enum NotificationType {
  /** 任务分配 - 新任务 */
  ASSIGNED = 'assigned',
  /** 状态更新 */
  STATUS_UPDATE = 'status_update',
  /** 新回复 */
  NEW_REPLY = 'new_reply',
}

/**
 * 通知模块枚举
 */
export enum NotificationModule {
  /** 员工日程模块 */
  SCHEDULE = 'schedule',
}

/**
 * 通知类型选项
 */
export type NotificationTypeOption = {
  value: NotificationType;
  label: string;
  color: string;
};

/**
 * 获取日程状态选项列表
 */
export const getScheduleStatusOptions = (): ScheduleStatusOption[] => [
  { value: ScheduleStatus.PENDING, label: ScheduleStatus.PENDING },
  { value: ScheduleStatus.IN_PROGRESS, label: ScheduleStatus.IN_PROGRESS },
  { value: ScheduleStatus.AT_RISK, label: ScheduleStatus.AT_RISK },
  { value: ScheduleStatus.COMPLETED, label: ScheduleStatus.COMPLETED },
  { value: ScheduleStatus.STOPPED, label: ScheduleStatus.STOPPED },
];

/**
 * 获取通知类型选项列表
 */
export const getNotificationTypeOptions = (): NotificationTypeOption[] => [
  { value: NotificationType.ASSIGNED, label: '日程分配', color: 'blue' },
  { value: NotificationType.STATUS_UPDATE, label: '状态更新', color: 'green' },
  { value: NotificationType.NEW_REPLY, label: '新回复', color: 'orange' },
];

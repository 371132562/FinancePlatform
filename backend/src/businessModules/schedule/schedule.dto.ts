import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

/**
 * 日程相关 DTO 类定义
 */

// 日程最小字段集（列表/业务使用）
export type ScheduleItem = {
  id: string;
  title: string;
  description: string;
  status: string;
  creatorId: string;
  creator: {
    id: string;
    name: string;
    code: string;
    department: string | null;
  };
  assignedUserIds: string[];
  assignedUsers: Array<{
    id: string;
    name: string;
    code: string;
    department: string | null;
  }>;
  companyId?: string | null;
  createTime: Date;
  updateTime: Date;
};

// 日程详情（包含回复）
export type ScheduleDetail = ScheduleItem & {
  comments: CommentItem[];
};

// 回复项
export type CommentItem = {
  id: string;
  content: string;
  createTime: Date;
  updateTime: Date;
  user: {
    id: string;
    name: string;
    code: string;
    department: string | null;
    role?: {
      name: string;
    } | null;
  };
};

/**
 * 创建日程 DTO
 */
export class CreateScheduleDto {
  @IsString()
  @IsNotEmpty({ message: '日程标题不能为空' })
  title: string;

  @IsString()
  @IsNotEmpty({ message: '日程描述不能为空' })
  description: string;

  @IsArray()
  @IsString({ each: true })
  assignedUserIds: string[];

  @IsOptional()
  @IsString()
  companyId?: string;
}
export type CreateSchedule = InstanceType<typeof CreateScheduleDto>;

/**
 * 更新日程状态 DTO
 */
export class UpdateScheduleStatusDto {
  @IsString()
  @IsNotEmpty({ message: '日程ID不能为空' })
  id: string;

  @IsString()
  @IsNotEmpty({ message: '状态不能为空' })
  status: string;
}
export type UpdateScheduleStatus = InstanceType<typeof UpdateScheduleStatusDto>;

/**
 * 日程列表查询 DTO
 */
export class ScheduleListDto {
  @IsOptional()
  @Type(() => Number)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  pageSize?: number;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  keyword?: string;
}
export type ScheduleList = InstanceType<typeof ScheduleListDto>;

/**
 * 日程详情查询 DTO
 */
export class ScheduleDetailQueryDto {
  @IsString()
  @IsNotEmpty({ message: '日程ID不能为空' })
  id: string;
}
export type ScheduleDetailQuery = InstanceType<typeof ScheduleDetailQueryDto>;

/**
 * 删除日程 DTO
 */
export class DeleteScheduleDto {
  @IsString()
  @IsNotEmpty({ message: '日程ID不能为空' })
  id: string;
}
export type DeleteSchedule = InstanceType<typeof DeleteScheduleDto>;

/**
 * 创建回复 DTO
 */
export class CreateCommentDto {
  @IsString()
  @IsNotEmpty({ message: '日程ID不能为空' })
  scheduleId: string;

  @IsString()
  @IsNotEmpty({ message: '回复内容不能为空' })
  content: string;
}
export type CreateComment = InstanceType<typeof CreateCommentDto>;

/**
 * 日程列表响应类型
 */
export type ScheduleListResDto = ScheduleItem[];

/**
 * 日程详情响应类型
 */
export type ScheduleDetailResDto = ScheduleDetail;

/**
 * 日程统计响应类型
 */
export type ScheduleStatisticsDto = {
  pending: number; // 待完成数量
  inProgress: number; // 进行中数量
  atRisk: number; // 有风险数量
};
export type ScheduleStatistics = ScheduleStatisticsDto;

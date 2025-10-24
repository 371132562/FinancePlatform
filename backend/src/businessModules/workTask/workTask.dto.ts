import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

/**
 * 工作项相关 DTO 类定义
 */

// 工作项最小字段集（列表/业务使用）
export type WorkTaskItem = {
  id: string;
  title: string;
  description: string;
  status: string;
  creatorId: string;
  creator: {
    id: string;
    name: string;
    code: string;
    department: string;
  };
  assignedUserIds: string[];
  assignedUsers: Array<{
    id: string;
    name: string;
    code: string;
    department: string;
  }>;
  companyId?: string | null;
  createTime: Date;
  updateTime: Date;
};

// 工作项详情（包含评论）
export type WorkTaskDetail = WorkTaskItem & {
  comments: CommentItem[];
};

// 评论项
export type CommentItem = {
  id: string;
  content: string;
  createTime: Date;
  updateTime: Date;
  user: {
    id: string;
    name: string;
    code: string;
    department: string;
    role?: {
      name: string;
    } | null;
  };
};

/**
 * 创建工作项 DTO
 */
export class CreateWorkTaskDto {
  @IsString()
  @IsNotEmpty({ message: '工作标题不能为空' })
  title: string;

  @IsString()
  @IsNotEmpty({ message: '工作描述不能为空' })
  description: string;

  @IsArray()
  @IsString({ each: true })
  assignedUserIds: string[];

  @IsOptional()
  @IsString()
  companyId?: string;
}
export type CreateWorkTask = InstanceType<typeof CreateWorkTaskDto>;

/**
 * 更新工作项 DTO（仅允许更新状态和关联人员）
 */
export class UpdateWorkTaskDto {
  @IsString()
  @IsNotEmpty({ message: '工作项ID不能为空' })
  id: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  assignedUserIds?: string[];
}
export type UpdateWorkTask = InstanceType<typeof UpdateWorkTaskDto>;

/**
 * 工作项列表查询 DTO
 */
export class WorkTaskListDto {
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
export type WorkTaskList = InstanceType<typeof WorkTaskListDto>;

/**
 * 工作项详情查询 DTO
 */
export class WorkTaskDetailQueryDto {
  @IsString()
  @IsNotEmpty({ message: '工作项ID不能为空' })
  id: string;
}
export type WorkTaskDetailQuery = InstanceType<typeof WorkTaskDetailQueryDto>;

/**
 * 删除工作项 DTO
 */
export class DeleteWorkTaskDto {
  @IsString()
  @IsNotEmpty({ message: '工作项ID不能为空' })
  id: string;
}
export type DeleteWorkTask = InstanceType<typeof DeleteWorkTaskDto>;

/**
 * 创建评论 DTO
 */
export class CreateCommentDto {
  @IsString()
  @IsNotEmpty({ message: '工作项ID不能为空' })
  taskId: string;

  @IsString()
  @IsNotEmpty({ message: '评论内容不能为空' })
  content: string;
}
export type CreateComment = InstanceType<typeof CreateCommentDto>;

/**
 * 删除评论 DTO
 */
export class DeleteCommentDto {
  @IsString()
  @IsNotEmpty({ message: '评论ID不能为空' })
  id: string;
}
export type DeleteComment = InstanceType<typeof DeleteCommentDto>;

/**
 * 工作项列表响应类型
 */
export type WorkTaskListResDto = WorkTaskItem[];

/**
 * 工作项详情响应类型
 */
export type WorkTaskDetailResDto = WorkTaskDetail;

import { Type } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

/**
 * 通知相关 DTO 类定义
 */

// 通知项
export type NotificationItem = {
  id: string;
  module: string;
  type: string;
  title: string;
  content: string;
  relatedId?: string | null;
  isRead: number;
  createTime: Date;
  updateTime: Date;
};

/**
 * 通知列表查询 DTO
 */
export class NotificationListDto {
  @IsOptional()
  @Type(() => Number)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  pageSize?: number;

  @IsOptional()
  @Type(() => Number)
  isRead?: number;
}
export type NotificationList = InstanceType<typeof NotificationListDto>;

/**
 * 标记已读 DTO
 */
export class MarkReadDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsOptional()
  @IsString({ each: true })
  ids?: string[];
}
export type MarkRead = InstanceType<typeof MarkReadDto>;

/**
 * 通知列表响应类型
 */
export type NotificationListResDto = NotificationItem[];

/**
 * 删除通知 DTO
 */
export class DeleteNotificationDto {
  @IsString()
  @IsNotEmpty({ message: '通知ID不能为空' })
  id: string;
}
export type DeleteNotification = InstanceType<typeof DeleteNotificationDto>;

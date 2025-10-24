import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../prisma/prisma.service';
import { ErrorCode } from '../../../types/response';
import { BusinessException } from '../../common/exceptions/businessException';
import { WinstonLoggerService } from '../../common/services/winston-logger.service';
import {
  DeleteNotificationDto,
  MarkReadDto,
  NotificationListDto,
  NotificationListResDto,
  UnreadCountDto,
} from './notification.dto';

@Injectable()
export class NotificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: WinstonLoggerService,
  ) {}

  /**
   * 创建工作派发通知
   */
  async createTaskAssignNotification(
    taskId: string,
    creatorId: string,
    assignedUserIds: string[],
  ) {
    this.logger.log(
      `[操作] 创建工作派发通知 - 工作项ID: ${taskId}, 关联用户: ${assignedUserIds.length}个`,
    );

    try {
      // 获取工作项信息
      const task = await this.prisma.workTask.findUnique({
        where: { id: taskId },
        select: { title: true },
      });

      if (!task) {
        this.logger.warn(
          `[验证失败] 创建工作派发通知 - 工作项ID ${taskId} 不存在`,
        );
        return;
      }

      // 为每个关联用户创建通知（排除创建者自己）
      const notifications: Array<{
        userId: string;
        module: string;
        type: string;
        title: string;
        content: string;
        relatedId: string;
      }> = [];
      for (const userId of assignedUserIds) {
        if (userId !== creatorId) {
          notifications.push({
            userId,
            module: 'work',
            type: 'assigned',
            title: '新的工作任务',
            content: `您有新的工作任务：${task.title}`,
            relatedId: taskId,
          });
        }
      }

      if (notifications.length > 0) {
        await this.prisma.notification.createMany({
          data: notifications,
        });

        this.logger.log(
          `[操作] 创建工作派发通知成功 - 共创建 ${notifications.length} 条通知`,
        );
      }
    } catch (error) {
      this.logger.error(
        `[失败] 创建工作派发通知 - ${error instanceof Error ? error.message : '未知错误'}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  /**
   * 获取用户通知列表
   */
  async getNotificationList(
    userId: string,
    dto: NotificationListDto,
  ): Promise<NotificationListResDto> {
    this.logger.log(`[操作] 获取通知列表 - 用户: ${userId}`);

    try {
      const where: any = {
        userId,
        delete: 0,
      };

      if (dto.isRead !== undefined) {
        where.isRead = dto.isRead;
      }

      const notifications = await this.prisma.notification.findMany({
        where,
        orderBy: { createTime: 'desc' },
        skip: dto.page ? (dto.page - 1) * (dto.pageSize || 10) : 0,
        take: dto.pageSize || 10,
      });

      this.logger.log(
        `[操作] 获取通知列表成功 - 共 ${notifications.length} 条通知`,
      );
      return notifications;
    } catch (error) {
      this.logger.error(
        `[失败] 获取通知列表 - ${error instanceof Error ? error.message : '未知错误'}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  /**
   * 获取用户未读通知数量
   */
  async getUnreadCount(userId: string): Promise<UnreadCountDto> {
    this.logger.log(`[操作] 获取未读通知数量 - 用户: ${userId}`);

    try {
      const count = await this.prisma.notification.count({
        where: {
          userId,
          isRead: 0,
          delete: 0,
        },
      });

      this.logger.log(`[操作] 获取未读通知数量成功 - 未读数量: ${count}`);
      return { count };
    } catch (error) {
      this.logger.error(
        `[失败] 获取未读通知数量 - ${error instanceof Error ? error.message : '未知错误'}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  /**
   * 标记通知为已读
   */
  async markAsRead(userId: string, dto: MarkReadDto) {
    this.logger.log(`[操作] 标记通知已读 - 用户: ${userId}`);

    try {
      if (dto.id) {
        // 标记单个通知
        await this.prisma.notification.updateMany({
          where: {
            id: dto.id,
            userId,
            delete: 0,
          },
          data: { isRead: 1 },
        });
        this.logger.log(`[操作] 标记通知已读成功 - 通知ID: ${dto.id}`);
      } else if (dto.ids && dto.ids.length > 0) {
        // 标记多个通知
        await this.prisma.notification.updateMany({
          where: {
            id: { in: dto.ids },
            userId,
            delete: 0,
          },
          data: { isRead: 1 },
        });
        this.logger.log(
          `[操作] 标记通知已读成功 - 通知数量: ${dto.ids.length}`,
        );
      }

      return true;
    } catch (error) {
      this.logger.error(
        `[失败] 标记通知已读 - ${error instanceof Error ? error.message : '未知错误'}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  /**
   * 标记所有通知为已读
   */
  async markAllAsRead(userId: string) {
    this.logger.log(`[操作] 标记所有通知已读 - 用户: ${userId}`);

    try {
      await this.prisma.notification.updateMany({
        where: {
          userId,
          isRead: 0,
          delete: 0,
        },
        data: { isRead: 1 },
      });

      this.logger.log(`[操作] 标记所有通知已读成功 - 用户: ${userId}`);
      return true;
    } catch (error) {
      this.logger.error(
        `[失败] 标记所有通知已读 - ${error instanceof Error ? error.message : '未知错误'}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  /**
   * 删除通知
   */
  async deleteNotification(userId: string, dto: DeleteNotificationDto) {
    this.logger.log(`[操作] 删除通知 - ID: ${dto.id}, 用户: ${userId}`);

    try {
      const notification = await this.prisma.notification.findFirst({
        where: {
          id: dto.id,
          userId,
          delete: 0,
        },
      });

      if (!notification) {
        this.logger.warn(
          `[验证失败] 删除通知 - 通知ID ${dto.id} 不存在或无权限`,
        );
        throw new BusinessException(
          ErrorCode.NOTIFICATION_NOT_FOUND,
          '通知不存在',
        );
      }

      await this.prisma.notification.update({
        where: { id: dto.id },
        data: { delete: 1 },
      });

      this.logger.log(`[操作] 删除通知成功 - ID: ${dto.id}`);
      return true;
    } catch (error) {
      if (error instanceof BusinessException) {
        throw error;
      }
      this.logger.error(
        `[失败] 删除通知 - ${error instanceof Error ? error.message : '未知错误'}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }
}

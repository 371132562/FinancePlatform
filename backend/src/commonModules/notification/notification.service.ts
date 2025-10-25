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
} from './notification.dto';

@Injectable()
export class NotificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: WinstonLoggerService,
  ) {}

  /**
   * 创建工作派发通知
   * @param taskId 工作项ID
   * @param creatorId 创建者ID
   * @param assignedUserIds 执行人员ID列表
   * @param isUpdate 是否为更新操作（默认为false，表示创建）
   */
  async createTaskAssignNotification(
    taskId: string,
    creatorId: string,
    assignedUserIds: string[],
    isUpdate: boolean = false,
  ) {
    this.logger.log(
      `[操作] 创建工作派发通知 - 工作项ID: ${taskId}, 关联用户: ${assignedUserIds.length}个, 是否更新: ${isUpdate}`,
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

      // 为执行人员创建通知
      for (const userId of assignedUserIds) {
        if (userId !== creatorId) {
          notifications.push({
            userId,
            module: 'work',
            type: 'assigned',
            title: isUpdate ? '工作任务更新' : '新的工作任务',
            content: isUpdate
              ? `您的工作任务有更新：${task.title}`
              : `您有新的工作任务：${task.title}`,
            relatedId: taskId,
          });
        }
      }

      // 如果是更新操作，且创建者不在执行人员列表中，给创建者发送通知
      if (isUpdate && !assignedUserIds.includes(creatorId)) {
        notifications.push({
          userId: creatorId,
          module: 'work',
          type: 'assigned',
          title: '工作项更新通知',
          content: `您的工作项已更新：${task.title}`,
          relatedId: taskId,
        });
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
      const where: Record<string, unknown> = {
        userId,
        delete: 0,
      };

      if (dto.isRead !== undefined) {
        where.isRead = dto.isRead;
      }

      const notifications = await this.prisma.notification.findMany({
        where,
        orderBy: { createTime: 'desc' },
        // 如果不传pageSize或pageSize为0，则不分页
        ...(dto.pageSize && dto.pageSize > 0
          ? {
              skip: dto.page ? (dto.page - 1) * dto.pageSize : 0,
              take: dto.pageSize,
            }
          : {}),
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

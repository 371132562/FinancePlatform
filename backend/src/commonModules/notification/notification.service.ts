import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../prisma/prisma.service';
import { NotificationModule, NotificationType } from '../../../types/dto';
import { ErrorCode } from '../../../types/response';
import { SystemRoleNames } from '../../common/config/roleNames';
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
   * 创建日程分配通知
   * @param taskId 日程ID
   * @param creatorId 创建者ID
   * @param assignedUserIds 执行人员ID列表
   * @param operationType 操作类型：'create' | 'update' | 'comment'
   * @param operatorId 操作者ID（仅在更新或回复操作时使用）
   */
  async createScheduleAssignNotification(
    taskId: string,
    creatorId: string,
    assignedUserIds: string[],
    operationType: 'create' | 'update' | 'comment' = 'create',
    operatorId?: string,
  ) {
    this.logger.log(
      `[操作] 创建日程分配通知 - 日程ID: ${taskId}, 关联用户: ${assignedUserIds.length}个, 操作类型: ${operationType}`,
    );

    try {
      // 获取日程信息
      const task = await this.prisma.schedule.findUnique({
        where: { id: taskId },
        select: { title: true },
      });

      if (!task) {
        this.logger.warn(
          `[验证失败] 创建日程分配通知 - 日程ID ${taskId} 不存在`,
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

      // 根据操作类型确定通知标题、内容和类型
      let title: string;
      let content: string;
      let notificationType: NotificationType;

      switch (operationType) {
        case 'update':
          title = '日程状态更新';
          content = `日程"${task.title}"状态已更新`;
          notificationType = NotificationType.STATUS_UPDATE;
          break;
        case 'comment':
          title = '日程有新回复';
          content = `日程"${task.title}"有新的回复`;
          notificationType = NotificationType.NEW_REPLY;
          break;
        case 'create':
        default:
          title = '新的日程任务';
          content = `您有新的日程：${task.title}`;
          notificationType = NotificationType.ASSIGNED;
          break;
      }

      // 1. 准备需要查询的用户ID列表
      const excludeUserId =
        operationType === 'create' ? creatorId : operatorId || creatorId;

      const userIdsToQuery: string[] = [];

      // 执行人员列表（排除操作者）
      for (const userId of assignedUserIds) {
        if (userId !== excludeUserId) {
          userIdsToQuery.push(userId);
        }
      }

      // 创建者（仅更新操作且特定条件下）
      const shouldNotifyCreator =
        operationType === 'update' &&
        !assignedUserIds.includes(creatorId) &&
        creatorId !== operatorId;

      if (shouldNotifyCreator) {
        userIdsToQuery.push(creatorId);
      }

      // 2. 批量查询用户角色
      const users = await this.prisma.user.findMany({
        where: { id: { in: userIdsToQuery } },
        select: { id: true, role: { select: { name: true } } },
      });

      // 3. 构建用户角色映射
      const userRoleMap = new Map(users.map((u) => [u.id, u.role?.name]));

      // 4. 为执行人员创建通知（排除系统管理员）
      for (const userId of assignedUserIds) {
        if (userId !== excludeUserId) {
          const userRole = userRoleMap.get(userId);

          // 跳过系统管理员
          if (userRole === SystemRoleNames.ADMIN) {
            continue;
          }

          notifications.push({
            userId,
            module: NotificationModule.SCHEDULE,
            type: notificationType,
            title,
            content,
            relatedId: taskId,
          });
        }
      }

      // 5. 为创建者创建通知（排除系统管理员）
      if (shouldNotifyCreator) {
        const creatorRole = userRoleMap.get(creatorId);

        // 跳过系统管理员
        if (creatorRole !== SystemRoleNames.ADMIN) {
          notifications.push({
            userId: creatorId,
            module: NotificationModule.SCHEDULE,
            type: NotificationType.STATUS_UPDATE,
            title: '日程更新通知',
            content: `您的日程已更新：${task.title}`,
            relatedId: taskId,
          });
        }
      }

      if (notifications.length > 0) {
        await this.prisma.notification.createMany({
          data: notifications,
        });

        this.logger.log(
          `[操作] 创建日程分配通知成功 - 共创建 ${notifications.length} 条通知`,
        );
      }
    } catch (error) {
      this.logger.error(
        `[失败] 创建日程分配通知 - ${error instanceof Error ? error.message : '未知错误'}`,
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

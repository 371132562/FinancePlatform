import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../prisma/prisma.service';
import { NotificationModule } from '../../../types/dto';
import { ErrorCode } from '../../../types/response';
import {
  isFullPermissionRole,
  isRestrictedRole,
} from '../../common/config/roleNames';
import { BusinessException } from '../../common/exceptions/businessException';
import { WinstonLoggerService } from '../../common/services/winston-logger.service';
import { NotificationService } from '../../commonModules/notification/notification.service';
import {
  CreateCommentDto,
  CreateScheduleDto,
  DeleteScheduleDto,
  ScheduleDetailQueryDto,
  ScheduleDetailResDto,
  ScheduleListDto,
  ScheduleListResDto,
  UpdateScheduleStatusDto,
} from './schedule.dto';

@Injectable()
export class ScheduleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: WinstonLoggerService,
    private readonly notificationService: NotificationService,
  ) {}

  /**
   * 获取日程列表，根据角色过滤
   */
  async getScheduleList(
    userId: string,
    roleName: string,
    dto: ScheduleListDto,
  ): Promise<ScheduleListResDto> {
    this.logger.log(`[操作] 获取日程列表 - 用户: ${userId}, 角色: ${roleName}`);

    try {
      // 构建查询条件
      const where: Record<string, unknown> = { delete: 0 };

      // 根据角色过滤数据
      if (isFullPermissionRole(roleName)) {
        // 全权限角色：可以查看所有日程
      } else {
        // 受限角色：只能查看与自己关联的日程
        where.OR = [
          { creatorId: userId },
          { assignedUserIds: { path: '$', string_contains: `"${userId}"` } },
        ];
      }

      // 添加状态筛选
      if (dto.status) {
        where.status = dto.status;
      }

      // 添加关键词搜索
      if (dto.keyword) {
        const searchConditions = [
          { title: { contains: dto.keyword } },
          { description: { contains: dto.keyword } },
        ];

        // 如果有权限过滤条件，需要将搜索条件与权限条件组合
        if (isRestrictedRole(roleName)) {
          // 受限角色：搜索条件必须与权限条件同时满足
          where.AND = [{ OR: where.OR }, { OR: searchConditions }];
          delete where.OR;
        } else {
          // 全权限角色：直接添加搜索条件
          where.OR = searchConditions;
        }
      }

      const schedules = await this.prisma.schedule.findMany({
        where,
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              code: true,
              department: true,
            },
          },
          comments: {
            where: { delete: 0 },
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  code: true,
                  department: true,
                  role: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
            },
            orderBy: { createTime: 'asc' },
          },
        },
        orderBy: { createTime: 'desc' },
        skip: dto.page ? (dto.page - 1) * (dto.pageSize || 10) : 0,
        take: dto.pageSize || 10,
      });

      // 获取关联用户信息
      const scheduleList = await Promise.all(
        schedules.map(async (schedule) => {
          const assignedUserIds = JSON.parse(
            schedule.assignedUserIds as string,
          ) as string[];
          const assignedUsers = await this.prisma.user.findMany({
            where: {
              id: { in: assignedUserIds },
              delete: 0,
            },
            select: {
              id: true,
              name: true,
              code: true,
              department: true,
            },
          });

          return {
            id: schedule.id,
            title: schedule.title,
            description: schedule.description,
            status: schedule.status,
            creatorId: schedule.creatorId,
            creator: schedule.creator,
            assignedUserIds,
            assignedUsers,
            companyId: schedule.companyId,
            createTime: schedule.createTime,
            updateTime: schedule.updateTime,
          };
        }),
      );

      this.logger.log(
        `[操作] 获取日程列表成功 - 共 ${scheduleList.length} 个日程`,
      );
      return scheduleList;
    } catch (error) {
      this.logger.error(
        `[失败] 获取日程列表 - ${error instanceof Error ? error.message : '未知错误'}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  /**
   * 获取日程详情
   */
  async getScheduleDetail(
    userId: string,
    roleName: string,
    dto: ScheduleDetailQueryDto,
  ): Promise<ScheduleDetailResDto> {
    this.logger.log(`[操作] 获取日程详情 - ID: ${dto.id}, 用户: ${userId}`);

    try {
      const schedule = await this.prisma.schedule.findFirst({
        where: {
          id: dto.id,
          delete: 0,
        },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              code: true,
              department: true,
            },
          },
          comments: {
            where: { delete: 0 },
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  code: true,
                  department: true,
                  role: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
            },
            orderBy: { createTime: 'asc' },
          },
        },
      });

      if (!schedule) {
        this.logger.warn(`[验证失败] 获取日程详情 - 日程ID ${dto.id} 不存在`);
        throw new BusinessException(ErrorCode.TASK_NOT_FOUND, '日程不存在');
      }

      // 获取关联用户信息
      const assignedUserIds = JSON.parse(
        schedule.assignedUserIds as string,
      ) as string[];
      const assignedUsers = await this.prisma.user.findMany({
        where: {
          id: { in: assignedUserIds },
          delete: 0,
        },
        select: {
          id: true,
          name: true,
          code: true,
          department: true,
        },
      });

      const scheduleDetail = {
        id: schedule.id,
        title: schedule.title,
        description: schedule.description,
        status: schedule.status,
        creatorId: schedule.creatorId,
        creator: schedule.creator,
        assignedUserIds,
        assignedUsers,
        companyId: schedule.companyId,
        createTime: schedule.createTime,
        updateTime: schedule.updateTime,
        comments: schedule.comments.map((comment) => ({
          id: comment.id,
          content: comment.content,
          createTime: comment.createTime,
          updateTime: comment.updateTime,
          user: comment.user,
        })),
      };

      this.logger.log(`[操作] 获取日程详情成功 - ID: ${dto.id}`);
      return scheduleDetail;
    } catch (error) {
      if (error instanceof BusinessException) {
        throw error;
      }
      this.logger.error(
        `[失败] 获取日程详情 - ${error instanceof Error ? error.message : '未知错误'}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  /**
   * 创建日程
   */
  async createSchedule(userId: string, dto: CreateScheduleDto) {
    this.logger.log(`[操作] 创建日程 - 标题: ${dto.title}, 创建人: ${userId}`);

    try {
      const schedule = await this.prisma.schedule.create({
        data: {
          title: dto.title,
          description: dto.description,
          creatorId: userId,
          assignedUserIds: JSON.stringify(dto.assignedUserIds),
          companyId: dto.companyId,
        },
      });

      // 创建通知
      if (dto.assignedUserIds.length > 0) {
        await this.notificationService.createScheduleAssignNotification(
          schedule.id,
          userId,
          dto.assignedUserIds,
          'create', // 创建操作
        );
      }

      this.logger.log(
        `[操作] 创建日程成功 - ID: ${schedule.id}, 标题: ${dto.title}`,
      );
      return schedule;
    } catch (error) {
      this.logger.error(
        `[失败] 创建日程 - ${error instanceof Error ? error.message : '未知错误'}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  /**
   * 更新日程状态
   */
  async updateScheduleStatus(
    userId: string,
    roleName: string,
    dto: UpdateScheduleStatusDto,
  ) {
    this.logger.log(`[操作] 更新日程 - ID: ${dto.id}, 用户: ${userId}`);

    try {
      const schedule = await this.prisma.schedule.findFirst({
        where: {
          id: dto.id,
          delete: 0,
        },
      });

      if (!schedule) {
        this.logger.warn(`[验证失败] 更新日程 - 日程ID ${dto.id} 不存在`);
        throw new BusinessException(ErrorCode.TASK_NOT_FOUND, '日程不存在');
      }

      // 检查权限：系统管理员和公司管理者可以修改所有日程，其他角色只能修改与自己关联的日程
      if (!isFullPermissionRole(roleName)) {
        // 检查是否为创建者
        const isCreator = schedule.creatorId === userId;

        // 检查是否为关联人员
        const assignedUserIds = JSON.parse(
          schedule.assignedUserIds as string,
        ) as string[];
        const isAssignedUser = assignedUserIds.includes(userId);

        if (!isCreator && !isAssignedUser) {
          this.logger.warn(
            `[权限拒绝] 更新日程 - 用户 ${userId} 无权限修改日程 ${dto.id}`,
          );
          throw new BusinessException(
            ErrorCode.TASK_NO_PERMISSION,
            '无权限修改该日程',
          );
        }
      }

      const updatedSchedule = await this.prisma.schedule.update({
        where: { id: dto.id },
        data: {
          status: dto.status,
        },
      });

      // 自动创建状态更新回复
      await this.createStatusUpdateComment(
        dto.id,
        userId,
        schedule.status,
        dto.status,
      );

      // 创建状态更新通知
      const assignedUserIds = JSON.parse(
        updatedSchedule.assignedUserIds as string,
      ) as string[];
      if (assignedUserIds.length > 0) {
        await this.notificationService.createScheduleAssignNotification(
          dto.id,
          updatedSchedule.creatorId, // 创建者ID
          assignedUserIds,
          'update', // 更新操作
          userId, // 更新者ID
        );
      }

      this.logger.log(`[操作] 更新日程成功 - ID: ${dto.id}`);
      return updatedSchedule;
    } catch (error) {
      if (error instanceof BusinessException) {
        throw error;
      }
      this.logger.error(
        `[失败] 更新日程 - ${error instanceof Error ? error.message : '未知错误'}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  /**
   * 删除日程（软删除）
   */
  async deleteSchedule(
    userId: string,
    roleName: string,
    dto: DeleteScheduleDto,
  ) {
    this.logger.log(`[操作] 删除日程 - ID: ${dto.id}, 用户: ${userId}`);

    try {
      // 权限检查：只允许系统管理员和公司管理者删除
      if (!isFullPermissionRole(roleName)) {
        this.logger.warn(
          `[权限拒绝] 删除日程 - 用户 ${userId} 无权限删除日程 ${dto.id}`,
        );
        throw new BusinessException(
          ErrorCode.FORBIDDEN,
          '仅系统管理员和公司管理者可以删除日程',
        );
      }

      const schedule = await this.prisma.schedule.findFirst({
        where: {
          id: dto.id,
          delete: 0,
        },
      });

      if (!schedule) {
        this.logger.warn(`[验证失败] 删除日程 - 日程ID ${dto.id} 不存在`);
        throw new BusinessException(ErrorCode.TASK_NOT_FOUND, '日程不存在');
      }

      // 软删除日程
      await this.prisma.schedule.update({
        where: { id: dto.id },
        data: { delete: 1 },
      });

      // 软删除相关通知
      await this.prisma.notification.updateMany({
        where: {
          relatedId: dto.id,
          module: NotificationModule.SCHEDULE,
          delete: 0,
        },
        data: { delete: 1 },
      });

      this.logger.log(`[操作] 删除日程成功 - ID: ${dto.id}`);
      return true;
    } catch (error) {
      if (error instanceof BusinessException) {
        throw error;
      }
      this.logger.error(
        `[失败] 删除日程 - ${error instanceof Error ? error.message : '未知错误'}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  /**
   * 添加回复
   */
  async createComment(userId: string, dto: CreateCommentDto) {
    this.logger.log(
      `[操作] 添加回复 - 日程ID: ${dto.scheduleId}, 用户: ${userId}`,
    );

    try {
      // 检查日程是否存在且有权限访问
      const schedule = await this.prisma.schedule.findFirst({
        where: {
          id: dto.scheduleId,
          delete: 0,
        },
      });

      if (!schedule) {
        this.logger.warn(
          `[验证失败] 添加回复 - 日程ID ${dto.scheduleId} 不存在`,
        );
        throw new BusinessException(ErrorCode.TASK_NOT_FOUND, '日程不存在');
      }

      const comment = await this.prisma.scheduleComment.create({
        data: {
          scheduleId: dto.scheduleId,
          userId: userId,
          content: dto.content,
        },
      });

      // 创建回复通知
      const assignedUserIds = JSON.parse(
        schedule.assignedUserIds as string,
      ) as string[];
      if (assignedUserIds.length > 0) {
        await this.notificationService.createScheduleAssignNotification(
          dto.scheduleId,
          schedule.creatorId, // 创建者ID
          assignedUserIds,
          'comment', // 回复操作
          userId, // 回复者ID
        );
      }

      this.logger.log(`[操作] 添加回复成功 - ID: ${comment.id}`);
      return comment;
    } catch (error) {
      if (error instanceof BusinessException) {
        throw error;
      }
      this.logger.error(
        `[失败] 添加回复 - ${error instanceof Error ? error.message : '未知错误'}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  /**
   * 检查用户是否有权限访问日程
   */
  private checkSchedulePermission(
    userId: string,
    roleName: string,
    schedule: { creatorId: string; assignedUserIds: string },
  ): boolean {
    // admin 和 boss 可以访问所有日程
    if (isFullPermissionRole(roleName)) {
      return true;
    }

    // 其他角色都执行相同的权限检查
    const assignedUserIds = JSON.parse(schedule.assignedUserIds) as string[];
    return schedule.creatorId === userId || assignedUserIds.includes(userId);
  }

  /**
   * 创建状态更新回复
   */
  private async createStatusUpdateComment(
    scheduleId: string,
    userId: string,
    oldStatus: string,
    newStatus: string,
  ): Promise<void> {
    try {
      const content = `状态已从"${oldStatus}"更新为"${newStatus}"`;

      await this.prisma.scheduleComment.create({
        data: {
          scheduleId,
          userId,
          content,
        },
      });

      this.logger.log(
        `[操作] 自动创建状态更新回复 - 日程ID: ${scheduleId}, 用户: ${userId}`,
      );
    } catch (error) {
      this.logger.error(
        `[失败] 创建状态更新回复 - ${error instanceof Error ? error.message : '未知错误'}`,
        error instanceof Error ? error.stack : undefined,
      );
      // 不抛出错误，避免影响状态更新主流程
    }
  }
}

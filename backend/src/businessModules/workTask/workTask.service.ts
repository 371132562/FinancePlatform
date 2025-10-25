import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../prisma/prisma.service';
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
  CreateWorkTaskDto,
  DeleteCommentDto,
  DeleteWorkTaskDto,
  UpdateWorkTaskDto,
  WorkTaskDetailQueryDto,
  WorkTaskDetailResDto,
  WorkTaskListDto,
  WorkTaskListResDto,
} from './workTask.dto';

@Injectable()
export class WorkTaskService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: WinstonLoggerService,
    private readonly notificationService: NotificationService,
  ) {}

  /**
   * 获取工作项列表，根据角色过滤
   */
  async getTaskList(
    userId: string,
    roleName: string,
    dto: WorkTaskListDto,
  ): Promise<WorkTaskListResDto> {
    this.logger.log(
      `[操作] 获取工作项列表 - 用户: ${userId}, 角色: ${roleName}`,
    );

    try {
      // 构建查询条件
      const where: Record<string, unknown> = { delete: 0 };

      // 根据角色过滤数据
      if (isFullPermissionRole(roleName)) {
        // 全权限角色：可以查看所有工作项
      } else {
        // 受限角色：只能查看与自己关联的工作项
        where.OR = [
          { creatorId: userId },
          { assignedUserIds: { string_contains: userId } },
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

      const tasks = await this.prisma.workTask.findMany({
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
      const taskList = await Promise.all(
        tasks.map(async (task) => {
          const assignedUserIds = JSON.parse(
            task.assignedUserIds as string,
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
            id: task.id,
            title: task.title,
            description: task.description,
            status: task.status,
            creatorId: task.creatorId,
            creator: task.creator,
            assignedUserIds,
            assignedUsers,
            companyId: task.companyId,
            createTime: task.createTime,
            updateTime: task.updateTime,
          };
        }),
      );

      this.logger.log(
        `[操作] 获取工作项列表成功 - 共 ${taskList.length} 个工作项`,
      );
      return taskList;
    } catch (error) {
      this.logger.error(
        `[失败] 获取工作项列表 - ${error instanceof Error ? error.message : '未知错误'}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  /**
   * 获取工作项详情
   */
  async getTaskDetail(
    userId: string,
    roleName: string,
    dto: WorkTaskDetailQueryDto,
  ): Promise<WorkTaskDetailResDto> {
    this.logger.log(`[操作] 获取工作项详情 - ID: ${dto.id}, 用户: ${userId}`);

    try {
      const task = await this.prisma.workTask.findFirst({
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

      if (!task) {
        this.logger.warn(
          `[验证失败] 获取工作项详情 - 工作项ID ${dto.id} 不存在`,
        );
        throw new BusinessException(ErrorCode.TASK_NOT_FOUND, '工作项不存在');
      }

      // 获取关联用户信息
      const assignedUserIds = JSON.parse(
        task.assignedUserIds as string,
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

      const taskDetail = {
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        creatorId: task.creatorId,
        creator: task.creator,
        assignedUserIds,
        assignedUsers,
        companyId: task.companyId,
        createTime: task.createTime,
        updateTime: task.updateTime,
        comments: task.comments.map((comment) => ({
          id: comment.id,
          content: comment.content,
          createTime: comment.createTime,
          updateTime: comment.updateTime,
          user: comment.user,
        })),
      };

      this.logger.log(`[操作] 获取工作项详情成功 - ID: ${dto.id}`);
      return taskDetail;
    } catch (error) {
      if (error instanceof BusinessException) {
        throw error;
      }
      this.logger.error(
        `[失败] 获取工作项详情 - ${error instanceof Error ? error.message : '未知错误'}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  /**
   * 创建工作项
   */
  async createTask(userId: string, dto: CreateWorkTaskDto) {
    this.logger.log(
      `[操作] 创建工作项 - 标题: ${dto.title}, 创建人: ${userId}`,
    );

    try {
      const task = await this.prisma.workTask.create({
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
        await this.notificationService.createTaskAssignNotification(
          task.id,
          userId,
          dto.assignedUserIds,
          false, // 创建操作
        );
      }

      this.logger.log(
        `[操作] 创建工作项成功 - ID: ${task.id}, 标题: ${dto.title}`,
      );
      return task;
    } catch (error) {
      this.logger.error(
        `[失败] 创建工作项 - ${error instanceof Error ? error.message : '未知错误'}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  /**
   * 更新工作项（仅允许更新状态和关联人员）
   */
  async updateTask(userId: string, roleName: string, dto: UpdateWorkTaskDto) {
    this.logger.log(`[操作] 更新工作项 - ID: ${dto.id}, 用户: ${userId}`);

    try {
      const task = await this.prisma.workTask.findFirst({
        where: {
          id: dto.id,
          delete: 0,
        },
      });

      if (!task) {
        this.logger.warn(`[验证失败] 更新工作项 - 工作项ID ${dto.id} 不存在`);
        throw new BusinessException(ErrorCode.TASK_NOT_FOUND, '工作项不存在');
      }

      const updateData: {
        status?: string;
        assignedUserIds?: string;
      } = {};
      if (dto.status) {
        updateData.status = dto.status;
      }
      if (dto.assignedUserIds) {
        updateData.assignedUserIds = JSON.stringify(dto.assignedUserIds);
      }

      const updatedTask = await this.prisma.workTask.update({
        where: { id: dto.id },
        data: updateData,
      });

      // 如果更新了执行人员，发送通知
      if (dto.assignedUserIds && dto.assignedUserIds.length > 0) {
        await this.notificationService.createTaskAssignNotification(
          dto.id,
          userId,
          dto.assignedUserIds,
          true, // 更新操作
        );
      }

      this.logger.log(`[操作] 更新工作项成功 - ID: ${dto.id}`);
      return updatedTask;
    } catch (error) {
      if (error instanceof BusinessException) {
        throw error;
      }
      this.logger.error(
        `[失败] 更新工作项 - ${error instanceof Error ? error.message : '未知错误'}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  /**
   * 删除工作项（软删除）
   */
  async deleteTask(userId: string, roleName: string, dto: DeleteWorkTaskDto) {
    this.logger.log(`[操作] 删除工作项 - ID: ${dto.id}, 用户: ${userId}`);

    try {
      const task = await this.prisma.workTask.findFirst({
        where: {
          id: dto.id,
          delete: 0,
        },
      });

      if (!task) {
        this.logger.warn(`[验证失败] 删除工作项 - 工作项ID ${dto.id} 不存在`);
        throw new BusinessException(ErrorCode.TASK_NOT_FOUND, '工作项不存在');
      }

      await this.prisma.workTask.update({
        where: { id: dto.id },
        data: { delete: 1 },
      });

      this.logger.log(`[操作] 删除工作项成功 - ID: ${dto.id}`);
      return true;
    } catch (error) {
      if (error instanceof BusinessException) {
        throw error;
      }
      this.logger.error(
        `[失败] 删除工作项 - ${error instanceof Error ? error.message : '未知错误'}`,
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
      `[操作] 添加回复 - 工作项ID: ${dto.taskId}, 用户: ${userId}`,
    );

    try {
      // 检查工作项是否存在且有权限访问
      const task = await this.prisma.workTask.findFirst({
        where: {
          id: dto.taskId,
          delete: 0,
        },
      });

      if (!task) {
        this.logger.warn(`[验证失败] 添加回复 - 工作项ID ${dto.taskId} 不存在`);
        throw new BusinessException(ErrorCode.TASK_NOT_FOUND, '工作项不存在');
      }

      const comment = await this.prisma.workTaskComment.create({
        data: {
          taskId: dto.taskId,
          userId: userId,
          content: dto.content,
        },
      });

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
   * 删除回复
   */
  async deleteComment(userId: string, roleName: string, dto: DeleteCommentDto) {
    this.logger.log(`[操作] 删除回复 - ID: ${dto.id}, 用户: ${userId}`);

    try {
      const comment = await this.prisma.workTaskComment.findFirst({
        where: {
          id: dto.id,
          delete: 0,
        },
      });

      if (!comment) {
        this.logger.warn(`[验证失败] 删除回复 - 回复ID ${dto.id} 不存在`);
        throw new BusinessException(
          ErrorCode.TASK_COMMENT_NOT_FOUND,
          '回复不存在',
        );
      }

      await this.prisma.workTaskComment.update({
        where: { id: dto.id },
        data: { delete: 1 },
      });

      this.logger.log(`[操作] 删除回复成功 - ID: ${dto.id}`);
      return true;
    } catch (error) {
      if (error instanceof BusinessException) {
        throw error;
      }
      this.logger.error(
        `[失败] 删除回复 - ${error instanceof Error ? error.message : '未知错误'}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  /**
   * 检查用户是否有权限访问工作项
   */
  private checkTaskPermission(
    userId: string,
    roleName: string,
    task: { creatorId: string; assignedUserIds: string },
  ): boolean {
    // admin 和 boss 可以访问所有工作项
    if (isFullPermissionRole(roleName)) {
      return true;
    }

    // 其他角色都执行相同的权限检查
    const assignedUserIds = JSON.parse(task.assignedUserIds) as string[];
    return task.creatorId === userId || assignedUserIds.includes(userId);
  }
}

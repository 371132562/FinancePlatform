import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

import { PrismaService } from '../../../prisma/prisma.service';
import { ErrorCode } from '../../../types/response';
import { BusinessException } from '../../common/exceptions/businessException';

/**
 * 验证工作项是否存在的管道
 */
@Injectable()
export class TaskExistsPipe implements PipeTransform {
  constructor(private readonly prisma: PrismaService) {}

  async transform(value: string) {
    if (!value) {
      throw new BadRequestException('工作项ID不能为空');
    }

    const task = await this.prisma.workTask.findFirst({
      where: {
        id: value,
        delete: 0,
      },
    });

    if (!task) {
      throw new BusinessException(ErrorCode.TASK_NOT_FOUND, '工作项不存在');
    }

    return value;
  }
}

/**
 * 验证用户是否有权限访问工作项的管道
 */
@Injectable()
export class TaskPermissionPipe implements PipeTransform {
  constructor(private readonly prisma: PrismaService) {}

  async transform(data: { taskId: string; userId: string; roleName: string }) {
    const { taskId, userId, roleName } = data;

    const task = await this.prisma.workTask.findFirst({
      where: {
        id: taskId,
        delete: 0,
      },
    });

    if (!task) {
      throw new BusinessException(ErrorCode.TASK_NOT_FOUND, '工作项不存在');
    }

    // admin 和 boss 可以访问所有工作项
    if (roleName === 'admin' || roleName === 'boss') {
      return data;
    }

    // 非全权限角色需要检查权限
    const assignedUserIds = JSON.parse(
      task.assignedUserIds as string,
    ) as string[];
    if (task.creatorId !== userId && !assignedUserIds.includes(userId)) {
      throw new BusinessException(
        ErrorCode.TASK_NO_PERMISSION,
        '无权限访问该工作项',
      );
    }

    return data;
  }
}

/**
 * 验证评论是否存在的管道
 */
@Injectable()
export class CommentExistsPipe implements PipeTransform {
  constructor(private readonly prisma: PrismaService) {}

  async transform(value: string) {
    if (!value) {
      throw new BadRequestException('评论ID不能为空');
    }

    const comment = await this.prisma.workTaskComment.findFirst({
      where: {
        id: value,
        delete: 0,
      },
    });

    if (!comment) {
      throw new BusinessException(
        ErrorCode.TASK_COMMENT_NOT_FOUND,
        '评论不存在',
      );
    }

    return value;
  }
}

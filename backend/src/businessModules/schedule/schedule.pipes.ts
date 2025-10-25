import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

import { PrismaService } from '../../../prisma/prisma.service';
import { ErrorCode } from '../../../types/response';
import { isFullPermissionRole } from '../../common/config/roleNames';
import { BusinessException } from '../../common/exceptions/businessException';

/**
 * 验证日程ID基础格式的管道
 * 职责：验证ID非空等基础数据完整性
 */
@Injectable()
export class ScheduleIdValidationPipe implements PipeTransform {
  transform(dto: { id: string }) {
    if (!dto || !dto.id) {
      throw new BadRequestException('日程ID不能为空');
    }

    return dto;
  }
}

/**
 * 验证用户是否有权限访问日程的管道
 */
@Injectable()
export class SchedulePermissionPipe implements PipeTransform {
  constructor(private readonly prisma: PrismaService) {}

  async transform(data: {
    scheduleId: string;
    userId: string;
    roleName: string;
  }) {
    const { scheduleId, userId, roleName } = data;

    const schedule = await this.prisma.schedule.findFirst({
      where: {
        id: scheduleId,
        delete: 0,
      },
    });

    if (!schedule) {
      throw new BusinessException(ErrorCode.TASK_NOT_FOUND, '日程不存在');
    }

    // admin 和 boss 可以访问所有日程
    if (isFullPermissionRole(roleName)) {
      return data;
    }

    // 非全权限角色需要检查权限
    const assignedUserIds = JSON.parse(
      schedule.assignedUserIds as string,
    ) as string[];
    if (schedule.creatorId !== userId && !assignedUserIds.includes(userId)) {
      throw new BusinessException(
        ErrorCode.TASK_NO_PERMISSION,
        '无权限访问该日程',
      );
    }

    return data;
  }
}

/**
 * 验证日程详情查询权限的管道
 * 职责：验证日程存在性和基础权限（不涉及复杂业务逻辑）
 */
@Injectable()
export class ScheduleDetailPermissionPipe implements PipeTransform {
  constructor(private readonly prisma: PrismaService) {}

  async transform(dto: { id: string }) {
    const schedule = await this.prisma.schedule.findFirst({
      where: {
        id: dto.id,
        delete: 0,
      },
    });

    if (!schedule) {
      throw new BusinessException(ErrorCode.TASK_NOT_FOUND, '日程不存在');
    }

    return dto;
  }
}

/**
 * 验证日程更新权限的管道
 * 职责：验证日程存在性（复杂权限验证在Service层处理）
 */
@Injectable()
export class ScheduleUpdatePermissionPipe implements PipeTransform {
  constructor(private readonly prisma: PrismaService) {}

  async transform(dto: { id: string }) {
    const schedule = await this.prisma.schedule.findFirst({
      where: {
        id: dto.id,
        delete: 0,
      },
    });

    if (!schedule) {
      throw new BusinessException(ErrorCode.TASK_NOT_FOUND, '日程不存在');
    }

    return dto;
  }
}

/**
 * 验证回复创建权限的管道
 * 职责：验证日程存在性（复杂权限验证在Service层处理）
 */
@Injectable()
export class CommentCreatePermissionPipe implements PipeTransform {
  constructor(private readonly prisma: PrismaService) {}

  async transform(dto: { scheduleId: string }) {
    const schedule = await this.prisma.schedule.findFirst({
      where: {
        id: dto.scheduleId,
        delete: 0,
      },
    });

    if (!schedule) {
      throw new BusinessException(ErrorCode.TASK_NOT_FOUND, '日程不存在');
    }

    return dto;
  }
}

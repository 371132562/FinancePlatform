import { Body, Controller, Post, UseGuards, UsePipes } from '@nestjs/common';

import { CurrentUser } from '../../common/auth/user.decorator';
import { JwtAuthGuard } from '../../commonModules/auth/jwt-auth.guard';
import {
  CreateCommentDto,
  CreateScheduleDto,
  DeleteScheduleDto,
  ScheduleDetailQueryDto,
  ScheduleListDto,
  UpdateScheduleStatusDto,
} from './schedule.dto';
import {
  CommentCreatePermissionPipe,
  ScheduleIdValidationPipe,
  ScheduleUpdatePermissionPipe,
} from './schedule.pipes';
import { ScheduleService } from './schedule.service';

// 定义用户类型
interface UserPayload {
  userId: string;
  roleName: string;
}

@Controller('schedule')
@UseGuards(JwtAuthGuard)
export class ScheduleController {
  constructor(private readonly scheduleService: ScheduleService) {}

  /**
   * 获取日程列表
   */
  @Post('list')
  async getScheduleList(
    @CurrentUser() user: UserPayload,
    @Body() dto: ScheduleListDto,
  ) {
    return await this.scheduleService.getScheduleList(
      user.userId,
      user.roleName,
      dto,
    );
  }

  /**
   * 获取日程详情
   * 最佳实践：Pipe负责基础验证，Service负责业务逻辑验证
   */
  @Post('detail')
  async getScheduleDetail(
    @CurrentUser() user: UserPayload,
    @Body() dto: ScheduleDetailQueryDto,
  ) {
    return await this.scheduleService.getScheduleDetail(
      user.userId,
      user.roleName,
      dto,
    );
  }

  /**
   * 创建日程
   */
  @Post('create')
  async createSchedule(
    @CurrentUser() user: UserPayload,
    @Body() dto: CreateScheduleDto,
  ) {
    return await this.scheduleService.createSchedule(user.userId, dto);
  }

  /**
   * 更新日程状态
   * 最佳实践：Pipe负责基础验证，Service负责业务逻辑验证
   */
  @Post('updateStatus')
  @UsePipes(ScheduleIdValidationPipe, ScheduleUpdatePermissionPipe)
  async updateScheduleStatus(
    @CurrentUser() user: UserPayload,
    @Body() dto: UpdateScheduleStatusDto,
  ) {
    return await this.scheduleService.updateScheduleStatus(
      user.userId,
      user.roleName,
      dto,
    );
  }

  /**
   * 删除日程
   * 最佳实践：Pipe负责基础验证，Service负责业务逻辑验证
   */
  @Post('delete')
  async deleteSchedule(
    @CurrentUser() user: UserPayload,
    @Body() dto: DeleteScheduleDto,
  ) {
    return await this.scheduleService.deleteSchedule(
      user.userId,
      user.roleName,
      dto,
    );
  }

  /**
   * 添加回复
   */
  @Post('comment/create')
  @UsePipes(CommentCreatePermissionPipe)
  async createComment(
    @CurrentUser() user: UserPayload,
    @Body() dto: CreateCommentDto,
  ) {
    return await this.scheduleService.createComment(user.userId, dto);
  }

  /**
   * 获取日程统计数据
   */
  @Post('statistics')
  async getStatistics(@CurrentUser() user: UserPayload) {
    return await this.scheduleService.getStatistics(user.userId, user.roleName);
  }
}

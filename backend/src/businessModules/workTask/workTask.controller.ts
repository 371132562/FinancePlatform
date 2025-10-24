import { Body, Controller, Post, UseGuards } from '@nestjs/common';

import { CurrentUser } from '../../common/auth/user.decorator';
import { JwtAuthGuard } from '../../commonModules/auth/jwt-auth.guard';
import {
  CreateCommentDto,
  CreateWorkTaskDto,
  DeleteCommentDto,
  DeleteWorkTaskDto,
  UpdateWorkTaskDto,
  WorkTaskDetailQueryDto,
  WorkTaskListDto,
} from './workTask.dto';
import { WorkTaskService } from './workTask.service';

// 定义用户类型
interface UserPayload {
  userId: string;
  roleName: string;
}

@Controller('workTask')
@UseGuards(JwtAuthGuard)
export class WorkTaskController {
  constructor(private readonly workTaskService: WorkTaskService) {}

  /**
   * 获取工作项列表
   */
  @Post('list')
  async getTaskList(
    @CurrentUser() user: UserPayload,
    @Body() dto: WorkTaskListDto,
  ) {
    return await this.workTaskService.getTaskList(
      user.userId,
      user.roleName,
      dto,
    );
  }

  /**
   * 获取工作项详情
   */
  @Post('detail')
  async getTaskDetail(
    @CurrentUser() user: UserPayload,
    @Body() dto: WorkTaskDetailQueryDto,
  ) {
    return await this.workTaskService.getTaskDetail(
      user.userId,
      user.roleName,
      dto,
    );
  }

  /**
   * 创建工作项
   */
  @Post('create')
  async createTask(
    @CurrentUser() user: UserPayload,
    @Body() dto: CreateWorkTaskDto,
  ) {
    return await this.workTaskService.createTask(user.userId, dto);
  }

  /**
   * 更新工作项
   */
  @Post('update')
  async updateTask(
    @CurrentUser() user: UserPayload,
    @Body() dto: UpdateWorkTaskDto,
  ) {
    return await this.workTaskService.updateTask(
      user.userId,
      user.roleName,
      dto,
    );
  }

  /**
   * 删除工作项
   */
  @Post('delete')
  async deleteTask(
    @CurrentUser() user: UserPayload,
    @Body() dto: DeleteWorkTaskDto,
  ) {
    return await this.workTaskService.deleteTask(
      user.userId,
      user.roleName,
      dto,
    );
  }

  /**
   * 添加评论
   */
  @Post('comment/create')
  async createComment(
    @CurrentUser() user: UserPayload,
    @Body() dto: CreateCommentDto,
  ) {
    return await this.workTaskService.createComment(user.userId, dto);
  }

  /**
   * 删除评论
   */
  @Post('comment/delete')
  async deleteComment(
    @CurrentUser() user: UserPayload,
    @Body() dto: DeleteCommentDto,
  ) {
    return await this.workTaskService.deleteComment(
      user.userId,
      user.roleName,
      dto,
    );
  }
}

import { Body, Controller, Post, UseGuards } from '@nestjs/common';

import { CurrentUser } from '../../common/auth/user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  DeleteNotificationDto,
  MarkReadDto,
  NotificationListDto,
} from './notification.dto';
import { NotificationService } from './notification.service';

// 定义用户类型
interface UserPayload {
  userId: string;
  roleName: string;
}

@Controller('notification')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  /**
   * 获取通知列表
   */
  @Post('list')
  async getNotificationList(
    @CurrentUser() user: UserPayload,
    @Body() dto: NotificationListDto,
  ) {
    return await this.notificationService.getNotificationList(user.userId, dto);
  }

  /**
   * 标记通知为已读
   */
  @Post('markRead')
  async markAsRead(@CurrentUser() user: UserPayload, @Body() dto: MarkReadDto) {
    return await this.notificationService.markAsRead(user.userId, dto);
  }

  /**
   * 标记所有通知为已读
   */
  @Post('markAllRead')
  async markAllAsRead(@CurrentUser() user: UserPayload) {
    return await this.notificationService.markAllAsRead(user.userId);
  }

  /**
   * 删除通知
   */
  @Post('delete')
  async deleteNotification(
    @CurrentUser() user: UserPayload,
    @Body() dto: DeleteNotificationDto,
  ) {
    return await this.notificationService.deleteNotification(user.userId, dto);
  }
}

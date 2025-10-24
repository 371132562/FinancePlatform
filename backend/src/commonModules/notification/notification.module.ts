import { Module } from '@nestjs/common';

import { PrismaService } from '../../../prisma/prisma.service';
import { WinstonLoggerService } from '../../common/services/winston-logger.service';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';

@Module({
  controllers: [NotificationController],
  providers: [NotificationService, PrismaService, WinstonLoggerService],
  exports: [NotificationService],
})
export class NotificationModule {}

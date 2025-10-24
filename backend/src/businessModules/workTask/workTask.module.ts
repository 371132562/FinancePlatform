import { Module } from '@nestjs/common';

import { PrismaService } from '../../../prisma/prisma.service';
import { WinstonLoggerService } from '../../common/services/winston-logger.service';
import { NotificationService } from '../../commonModules/notification/notification.service';
import { WorkTaskController } from './workTask.controller';
import { WorkTaskService } from './workTask.service';

@Module({
  controllers: [WorkTaskController],
  providers: [
    WorkTaskService,
    PrismaService,
    WinstonLoggerService,
    NotificationService,
  ],
  exports: [WorkTaskService],
})
export class WorkTaskModule {}

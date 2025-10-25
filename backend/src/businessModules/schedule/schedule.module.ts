import { Module } from '@nestjs/common';

import { PrismaService } from '../../../prisma/prisma.service';
import { WinstonLoggerService } from '../../common/services/winston-logger.service';
import { NotificationService } from '../../commonModules/notification/notification.service';
import { ScheduleController } from './schedule.controller';
import { ScheduleService } from './schedule.service';

@Module({
  controllers: [ScheduleController],
  providers: [
    ScheduleService,
    PrismaService,
    WinstonLoggerService,
    NotificationService,
  ],
  exports: [ScheduleService],
})
export class ScheduleModule {}

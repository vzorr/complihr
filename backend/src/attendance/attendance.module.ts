import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AttendanceService } from './attendance.service';
import { AttendanceController } from './attendance.controller';
import { ClockEvent } from './entities/clock-event.entity';
import { AttendanceRecord } from './entities/attendance-record.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([ClockEvent, AttendanceRecord]), AuthModule],
  controllers: [AttendanceController],
  providers: [AttendanceService],
  exports: [AttendanceService],
})
export class AttendanceModule {}

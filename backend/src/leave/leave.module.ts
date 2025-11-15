import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LeaveService } from './leave.service';
import { LeaveController } from './leave.controller';
import { LeaveTypesService } from './leave-types.service';
import { LeaveTypesController } from './leave-types.controller';
import { LeaveRequest } from './entities/leave-request.entity';
import { LeaveType } from './entities/leave-type.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([LeaveRequest, LeaveType]), AuthModule],
  controllers: [LeaveController, LeaveTypesController],
  providers: [LeaveService, LeaveTypesService],
  exports: [LeaveService, LeaveTypesService],
})
export class LeaveModule {}

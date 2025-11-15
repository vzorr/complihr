import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  UseGuards,
  ParseIntPipe,
  UseInterceptors,
  ClassSerializerInterceptor,
  Request,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { AttendanceService } from './attendance.service';
import { ClockInDto } from './dto/clock-in.dto';
import { ClockOutDto } from './dto/clock-out.dto';
import {
  AttendanceResponseDto,
  ClockEventResponseDto,
} from './dto/attendance-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UuidValidationPipe } from '../common/pipes/uuid-validation.pipe';

@Controller('attendance')
@UseGuards(JwtAuthGuard)
@UseInterceptors(ClassSerializerInterceptor)
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post('clock-in')
  @UseGuards(RolesGuard)
  @Roles('admin', 'hr', 'manager', 'employee')
  async clockIn(@Body() clockInDto: ClockInDto): Promise<ClockEventResponseDto> {
    const clockEvent = await this.attendanceService.clockIn(clockInDto);
    return plainToInstance(ClockEventResponseDto, clockEvent, {
      excludeExtraneousValues: true,
    });
  }

  @Post('clock-out')
  @UseGuards(RolesGuard)
  @Roles('admin', 'hr', 'manager', 'employee')
  async clockOut(@Body() clockOutDto: ClockOutDto): Promise<ClockEventResponseDto> {
    const clockEvent = await this.attendanceService.clockOut(clockOutDto);
    return plainToInstance(ClockEventResponseDto, clockEvent, {
      excludeExtraneousValues: true,
    });
  }

  @Get('clock-status')
  @UseGuards(RolesGuard)
  @Roles('admin', 'hr', 'manager', 'employee')
  async getClockStatus(
    @Request() req,
  ): Promise<{ isClockedIn: boolean; lastClockIn?: Date; lastClockOut?: Date }> {
    const employeeId = req.user.employeeId;
    return await this.attendanceService.getClockStatus(employeeId);
  }

  @Get('today')
  @UseGuards(RolesGuard)
  @Roles('admin', 'hr', 'manager', 'employee')
  async getTodayAttendance(@Request() req): Promise<AttendanceResponseDto | null> {
    const employeeId = req.user.employeeId;
    const record = await this.attendanceService.getTodayAttendance(employeeId);

    if (!record) {
      return null;
    }

    return plainToInstance(AttendanceResponseDto, record, {
      excludeExtraneousValues: true,
    });
  }

  @Get('records')
  @UseGuards(RolesGuard)
  @Roles('admin', 'hr', 'manager')
  async getRecords(
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('employeeId', new ParseIntPipe({ optional: true })) employeeId?: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const result = await this.attendanceService.getAttendanceRecords(
      page,
      limit,
      employeeId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
    return {
      ...result,
      data: result.data.map((record) =>
        plainToInstance(AttendanceResponseDto, record, {
          excludeExtraneousValues: true,
        }),
      ),
    };
  }

  @Get('records/:publicId')
  @UseGuards(RolesGuard)
  @Roles('admin', 'hr', 'manager', 'employee')
  async getRecord(
    @Param('publicId', UuidValidationPipe) publicId: string,
  ): Promise<AttendanceResponseDto> {
    const record = await this.attendanceService.getAttendanceByPublicId(publicId);
    return plainToInstance(AttendanceResponseDto, record, {
      excludeExtraneousValues: true,
    });
  }
}

import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  UseInterceptors,
  ClassSerializerInterceptor,
  Request,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { LeaveService } from './leave.service';
import { CreateLeaveRequestDto } from './dto/create-leave-request.dto';
import { UpdateLeaveRequestDto } from './dto/update-leave-request.dto';
import { LeaveRequestResponseDto } from './dto/leave-request-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UuidValidationPipe } from '../common/pipes/uuid-validation.pipe';

@Controller('leave')
@UseGuards(JwtAuthGuard)
@UseInterceptors(ClassSerializerInterceptor)
export class LeaveController {
  constructor(private readonly leaveService: LeaveService) {}

  @Post('requests')
  @UseGuards(RolesGuard)
  @Roles('admin', 'hr', 'manager', 'employee')
  async create(
    @Body() createLeaveRequestDto: CreateLeaveRequestDto,
  ): Promise<LeaveRequestResponseDto> {
    const leaveRequest = await this.leaveService.create(createLeaveRequestDto);
    return plainToInstance(LeaveRequestResponseDto, leaveRequest, {
      excludeExtraneousValues: true,
    });
  }

  @Get('requests')
  @UseGuards(RolesGuard)
  @Roles('admin', 'hr', 'manager')
  async findAll(
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('employeeId', new ParseIntPipe({ optional: true })) employeeId?: number,
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const result = await this.leaveService.findAll(
      page,
      limit,
      employeeId,
      status,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
    return {
      ...result,
      data: result.data.map((request) =>
        plainToInstance(LeaveRequestResponseDto, request, {
          excludeExtraneousValues: true,
        }),
      ),
    };
  }

  @Get('requests/my-requests')
  @UseGuards(RolesGuard)
  @Roles('admin', 'hr', 'manager', 'employee')
  async getMyRequests(
    @Request() req,
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    const employeeId = req.user.employeeId;
    const result = await this.leaveService.findByEmployee(employeeId, page, limit);
    return {
      ...result,
      data: result.data.map((request) =>
        plainToInstance(LeaveRequestResponseDto, request, {
          excludeExtraneousValues: true,
        }),
      ),
    };
  }

  @Get('requests/upcoming')
  @UseGuards(RolesGuard)
  @Roles('admin', 'hr', 'manager', 'employee')
  async getUpcoming(@Request() req): Promise<LeaveRequestResponseDto[]> {
    const employeeId = req.user.employeeId;
    const requests = await this.leaveService.getUpcomingLeaves(employeeId);
    return requests.map((request) =>
      plainToInstance(LeaveRequestResponseDto, request, {
        excludeExtraneousValues: true,
      }),
    );
  }

  @Get('requests/team-calendar')
  @UseGuards(RolesGuard)
  @Roles('admin', 'hr', 'manager')
  async getTeamCalendar(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('departmentId', new ParseIntPipe({ optional: true })) departmentId?: number,
  ): Promise<LeaveRequestResponseDto[]> {
    const requests = await this.leaveService.getTeamLeaves(
      new Date(startDate),
      new Date(endDate),
      departmentId,
    );
    return requests.map((request) =>
      plainToInstance(LeaveRequestResponseDto, request, {
        excludeExtraneousValues: true,
      }),
    );
  }

  @Get('requests/:publicId')
  @UseGuards(RolesGuard)
  @Roles('admin', 'hr', 'manager', 'employee')
  async findOne(
    @Param('publicId', UuidValidationPipe) publicId: string,
  ): Promise<LeaveRequestResponseDto> {
    const leaveRequest = await this.leaveService.findByPublicId(publicId);
    return plainToInstance(LeaveRequestResponseDto, leaveRequest, {
      excludeExtraneousValues: true,
    });
  }

  @Patch('requests/:publicId')
  @UseGuards(RolesGuard)
  @Roles('admin', 'hr', 'manager', 'employee')
  async update(
    @Param('publicId', UuidValidationPipe) publicId: string,
    @Body() updateLeaveRequestDto: UpdateLeaveRequestDto,
  ): Promise<LeaveRequestResponseDto> {
    const leaveRequest = await this.leaveService.updateByPublicId(
      publicId,
      updateLeaveRequestDto,
    );
    return plainToInstance(LeaveRequestResponseDto, leaveRequest, {
      excludeExtraneousValues: true,
    });
  }

  @Post('requests/:publicId/approve')
  @UseGuards(RolesGuard)
  @Roles('admin', 'hr', 'manager')
  async approve(
    @Param('publicId', UuidValidationPipe) publicId: string,
    @Request() req,
  ): Promise<LeaveRequestResponseDto> {
    const approverId = req.user.id;
    const leaveRequest = await this.leaveService.approve(publicId, approverId);
    return plainToInstance(LeaveRequestResponseDto, leaveRequest, {
      excludeExtraneousValues: true,
    });
  }

  @Post('requests/:publicId/reject')
  @UseGuards(RolesGuard)
  @Roles('admin', 'hr', 'manager')
  async reject(
    @Param('publicId', UuidValidationPipe) publicId: string,
    @Body('rejectionReason') rejectionReason: string,
    @Request() req,
  ): Promise<LeaveRequestResponseDto> {
    const rejecterId = req.user.id;
    const leaveRequest = await this.leaveService.reject(
      publicId,
      rejecterId,
      rejectionReason,
    );
    return plainToInstance(LeaveRequestResponseDto, leaveRequest, {
      excludeExtraneousValues: true,
    });
  }

  @Post('requests/:publicId/cancel')
  @UseGuards(RolesGuard)
  @Roles('admin', 'hr', 'manager', 'employee')
  async cancel(
    @Param('publicId', UuidValidationPipe) publicId: string,
    @Body('cancellationReason') cancellationReason?: string,
  ): Promise<LeaveRequestResponseDto> {
    const leaveRequest = await this.leaveService.cancel(publicId, cancellationReason);
    return plainToInstance(LeaveRequestResponseDto, leaveRequest, {
      excludeExtraneousValues: true,
    });
  }
}

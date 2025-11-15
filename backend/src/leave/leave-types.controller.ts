import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ParseIntPipe,
  ParseBoolPipe,
  UseInterceptors,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { LeaveTypesService } from './leave-types.service';
import { CreateLeaveTypeDto } from './dto/create-leave-type.dto';
import { UpdateLeaveTypeDto } from './dto/update-leave-type.dto';
import { LeaveTypeResponseDto } from './dto/leave-type-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UuidValidationPipe } from '../common/pipes/uuid-validation.pipe';

@Controller('leave/types')
@UseGuards(JwtAuthGuard)
@UseInterceptors(ClassSerializerInterceptor)
export class LeaveTypesController {
  constructor(private readonly leaveTypesService: LeaveTypesService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('admin', 'hr')
  async create(
    @Body() createLeaveTypeDto: CreateLeaveTypeDto,
  ): Promise<LeaveTypeResponseDto> {
    const leaveType = await this.leaveTypesService.create(createLeaveTypeDto);
    return plainToInstance(LeaveTypeResponseDto, leaveType, {
      excludeExtraneousValues: true,
    });
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles('admin', 'hr', 'manager', 'employee')
  async findAll(
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('isActive', new ParseBoolPipe({ optional: true })) isActive?: boolean,
  ) {
    const result = await this.leaveTypesService.findAll(page, limit, isActive);
    return {
      ...result,
      data: result.data.map((leaveType) =>
        plainToInstance(LeaveTypeResponseDto, leaveType, {
          excludeExtraneousValues: true,
        }),
      ),
    };
  }

  @Get(':publicId')
  @UseGuards(RolesGuard)
  @Roles('admin', 'hr', 'manager', 'employee')
  async findOne(
    @Param('publicId', UuidValidationPipe) publicId: string,
  ): Promise<LeaveTypeResponseDto> {
    const leaveType = await this.leaveTypesService.findByPublicId(publicId);
    return plainToInstance(LeaveTypeResponseDto, leaveType, {
      excludeExtraneousValues: true,
    });
  }

  @Patch(':publicId')
  @UseGuards(RolesGuard)
  @Roles('admin', 'hr')
  async update(
    @Param('publicId', UuidValidationPipe) publicId: string,
    @Body() updateLeaveTypeDto: UpdateLeaveTypeDto,
  ): Promise<LeaveTypeResponseDto> {
    const leaveType = await this.leaveTypesService.updateByPublicId(
      publicId,
      updateLeaveTypeDto,
    );
    return plainToInstance(LeaveTypeResponseDto, leaveType, {
      excludeExtraneousValues: true,
    });
  }

  @Delete(':publicId')
  @UseGuards(RolesGuard)
  @Roles('admin', 'hr')
  async remove(
    @Param('publicId', UuidValidationPipe) publicId: string,
  ): Promise<{ message: string }> {
    await this.leaveTypesService.removeByPublicId(publicId);
    return { message: 'Leave type deactivated successfully' };
  }
}

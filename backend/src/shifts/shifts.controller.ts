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
  UseInterceptors,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { ShiftsService } from './shifts.service';
import { CreateShiftDto } from './dto/create-shift.dto';
import { UpdateShiftDto } from './dto/update-shift.dto';
import { ShiftResponseDto } from './dto/shift-response.dto';
import { CreateShiftSwapDto } from './dto/create-shift-swap.dto';
import { ShiftSwapResponseDto } from './dto/shift-swap-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UuidValidationPipe } from '../common/pipes/uuid-validation.pipe';

@Controller('shifts')
@UseGuards(JwtAuthGuard)
@UseInterceptors(ClassSerializerInterceptor)
export class ShiftsController {
  constructor(private readonly shiftsService: ShiftsService) {}

  // ============ SHIFTS ============

  @Post()
  @UseGuards(RolesGuard)
  @Roles('admin', 'hr', 'manager')
  async createShift(
    @Body() createShiftDto: CreateShiftDto,
  ): Promise<ShiftResponseDto> {
    const shift = await this.shiftsService.createShift(createShiftDto);
    return plainToInstance(ShiftResponseDto, shift, {
      excludeExtraneousValues: true,
    });
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles('admin', 'hr', 'manager', 'employee')
  async findAllShifts(
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('employeeId', new ParseIntPipe({ optional: true }))
    employeeId?: number,
    @Query('departmentId', new ParseIntPipe({ optional: true }))
    departmentId?: number,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
    @Query('status') status?: string,
  ) {
    const result = await this.shiftsService.findAllShifts(
      page,
      limit,
      employeeId,
      departmentId,
      fromDate,
      toDate,
      status,
    );
    return {
      ...result,
      data: result.data.map((shift) =>
        plainToInstance(ShiftResponseDto, shift, {
          excludeExtraneousValues: true,
        }),
      ),
    };
  }

  @Get(':publicId')
  @UseGuards(RolesGuard)
  @Roles('admin', 'hr', 'manager', 'employee')
  async findOneShift(
    @Param('publicId', UuidValidationPipe) publicId: string,
  ): Promise<ShiftResponseDto> {
    const shift = await this.shiftsService.findShiftByPublicId(publicId);
    return plainToInstance(ShiftResponseDto, shift, {
      excludeExtraneousValues: true,
    });
  }

  @Patch(':publicId')
  @UseGuards(RolesGuard)
  @Roles('admin', 'hr', 'manager')
  async updateShift(
    @Param('publicId', UuidValidationPipe) publicId: string,
    @Body() updateShiftDto: UpdateShiftDto,
  ): Promise<ShiftResponseDto> {
    const shift = await this.shiftsService.updateShiftByPublicId(
      publicId,
      updateShiftDto,
    );
    return plainToInstance(ShiftResponseDto, shift, {
      excludeExtraneousValues: true,
    });
  }

  @Post(':publicId/confirm')
  @UseGuards(RolesGuard)
  @Roles('admin', 'hr', 'manager', 'employee')
  async confirmShift(
    @Param('publicId', UuidValidationPipe) publicId: string,
  ): Promise<ShiftResponseDto> {
    const shift = await this.shiftsService.confirmShift(publicId);
    return plainToInstance(ShiftResponseDto, shift, {
      excludeExtraneousValues: true,
    });
  }

  @Post(':publicId/cancel')
  @UseGuards(RolesGuard)
  @Roles('admin', 'hr', 'manager')
  async cancelShift(
    @Param('publicId', UuidValidationPipe) publicId: string,
    @Body('reason') reason?: string,
  ): Promise<ShiftResponseDto> {
    const shift = await this.shiftsService.cancelShift(publicId, reason);
    return plainToInstance(ShiftResponseDto, shift, {
      excludeExtraneousValues: true,
    });
  }

  @Delete(':publicId')
  @UseGuards(RolesGuard)
  @Roles('admin', 'hr')
  async removeShift(
    @Param('publicId', UuidValidationPipe) publicId: string,
  ): Promise<{ message: string }> {
    await this.shiftsService.removeShiftByPublicId(publicId);
    return { message: 'Shift removed successfully' };
  }

  // ============ SHIFT SWAPS ============

  @Post('swaps')
  @UseGuards(RolesGuard)
  @Roles('admin', 'hr', 'manager', 'employee')
  async createShiftSwap(
    @Body() createShiftSwapDto: CreateShiftSwapDto,
  ): Promise<ShiftSwapResponseDto> {
    const shiftSwap =
      await this.shiftsService.createShiftSwap(createShiftSwapDto);
    return plainToInstance(ShiftSwapResponseDto, shiftSwap, {
      excludeExtraneousValues: true,
    });
  }

  @Get('swaps')
  @UseGuards(RolesGuard)
  @Roles('admin', 'hr', 'manager', 'employee')
  async findAllShiftSwaps(
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('employeeId', new ParseIntPipe({ optional: true }))
    employeeId?: number,
    @Query('status') status?: string,
  ) {
    const result = await this.shiftsService.findAllShiftSwaps(
      page,
      limit,
      employeeId,
      status,
    );
    return {
      ...result,
      data: result.data.map((swap) =>
        plainToInstance(ShiftSwapResponseDto, swap, {
          excludeExtraneousValues: true,
        }),
      ),
    };
  }

  @Get('swaps/:publicId')
  @UseGuards(RolesGuard)
  @Roles('admin', 'hr', 'manager', 'employee')
  async findOneShiftSwap(
    @Param('publicId', UuidValidationPipe) publicId: string,
  ): Promise<ShiftSwapResponseDto> {
    const shiftSwap = await this.shiftsService.findShiftSwapByPublicId(publicId);
    return plainToInstance(ShiftSwapResponseDto, shiftSwap, {
      excludeExtraneousValues: true,
    });
  }

  @Post('swaps/:publicId/approve')
  @UseGuards(RolesGuard)
  @Roles('admin', 'hr', 'manager')
  async approveShiftSwap(
    @Param('publicId', UuidValidationPipe) publicId: string,
    @Body('approverId', ParseIntPipe) approverId: number,
  ): Promise<ShiftSwapResponseDto> {
    const shiftSwap = await this.shiftsService.approveShiftSwap(
      publicId,
      approverId,
    );
    return plainToInstance(ShiftSwapResponseDto, shiftSwap, {
      excludeExtraneousValues: true,
    });
  }

  @Post('swaps/:publicId/reject')
  @UseGuards(RolesGuard)
  @Roles('admin', 'hr', 'manager')
  async rejectShiftSwap(
    @Param('publicId', UuidValidationPipe) publicId: string,
    @Body('rejectionReason') rejectionReason: string,
  ): Promise<ShiftSwapResponseDto> {
    const shiftSwap = await this.shiftsService.rejectShiftSwap(
      publicId,
      rejectionReason,
    );
    return plainToInstance(ShiftSwapResponseDto, shiftSwap, {
      excludeExtraneousValues: true,
    });
  }

  @Delete('swaps/:publicId')
  @UseGuards(RolesGuard)
  @Roles('admin', 'hr')
  async removeShiftSwap(
    @Param('publicId', UuidValidationPipe) publicId: string,
  ): Promise<{ message: string }> {
    await this.shiftsService.removeShiftSwapByPublicId(publicId);
    return { message: 'Shift swap request removed successfully' };
  }
}

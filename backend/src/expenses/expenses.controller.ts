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
import { ExpensesService } from './expenses.service';
import { CreateExpenseClaimDto } from './dto/create-expense-claim.dto';
import { UpdateExpenseClaimDto } from './dto/update-expense-claim.dto';
import { ExpenseClaimResponseDto } from './dto/expense-claim-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UuidValidationPipe } from '../common/pipes/uuid-validation.pipe';

@Controller('expenses')
@UseGuards(JwtAuthGuard)
@UseInterceptors(ClassSerializerInterceptor)
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Post('claims')
  @UseGuards(RolesGuard)
  @Roles('admin', 'hr', 'manager', 'employee')
  async create(
    @Body() createExpenseClaimDto: CreateExpenseClaimDto,
  ): Promise<ExpenseClaimResponseDto> {
    const claim = await this.expensesService.create(createExpenseClaimDto);
    return plainToInstance(ExpenseClaimResponseDto, claim, {
      excludeExtraneousValues: true,
    });
  }

  @Get('claims')
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
    const result = await this.expensesService.findAll(
      page,
      limit,
      employeeId,
      status,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
    return {
      ...result,
      data: result.data.map((claim) =>
        plainToInstance(ExpenseClaimResponseDto, claim, {
          excludeExtraneousValues: true,
        }),
      ),
    };
  }

  @Get('claims/:publicId')
  @UseGuards(RolesGuard)
  @Roles('admin', 'hr', 'manager', 'employee')
  async findOne(
    @Param('publicId', UuidValidationPipe) publicId: string,
  ): Promise<ExpenseClaimResponseDto> {
    const claim = await this.expensesService.findByPublicId(publicId);
    return plainToInstance(ExpenseClaimResponseDto, claim, {
      excludeExtraneousValues: true,
    });
  }

  @Patch('claims/:publicId')
  @UseGuards(RolesGuard)
  @Roles('admin', 'hr', 'manager', 'employee')
  async update(
    @Param('publicId', UuidValidationPipe) publicId: string,
    @Body() updateExpenseClaimDto: UpdateExpenseClaimDto,
  ): Promise<ExpenseClaimResponseDto> {
    const claim = await this.expensesService.updateByPublicId(
      publicId,
      updateExpenseClaimDto,
    );
    return plainToInstance(ExpenseClaimResponseDto, claim, {
      excludeExtraneousValues: true,
    });
  }

  @Post('claims/:publicId/approve')
  @UseGuards(RolesGuard)
  @Roles('admin', 'hr', 'manager')
  async approve(
    @Param('publicId', UuidValidationPipe) publicId: string,
    @Request() req,
  ): Promise<ExpenseClaimResponseDto> {
    const approverId = req.user.id;
    const claim = await this.expensesService.approve(publicId, approverId);
    return plainToInstance(ExpenseClaimResponseDto, claim, {
      excludeExtraneousValues: true,
    });
  }

  @Post('claims/:publicId/reject')
  @UseGuards(RolesGuard)
  @Roles('admin', 'hr', 'manager')
  async reject(
    @Param('publicId', UuidValidationPipe) publicId: string,
    @Body('rejectionReason') rejectionReason: string,
    @Request() req,
  ): Promise<ExpenseClaimResponseDto> {
    const rejecterId = req.user.id;
    const claim = await this.expensesService.reject(
      publicId,
      rejecterId,
      rejectionReason,
    );
    return plainToInstance(ExpenseClaimResponseDto, claim, {
      excludeExtraneousValues: true,
    });
  }

  @Post('claims/:publicId/mark-paid')
  @UseGuards(RolesGuard)
  @Roles('admin', 'hr')
  async markPaid(
    @Param('publicId', UuidValidationPipe) publicId: string,
    @Body('paymentReference') paymentReference?: string,
  ): Promise<ExpenseClaimResponseDto> {
    const claim = await this.expensesService.markAsPaid(publicId, paymentReference);
    return plainToInstance(ExpenseClaimResponseDto, claim, {
      excludeExtraneousValues: true,
    });
  }
}

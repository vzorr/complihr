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
import { PayrollService } from './payroll.service';
import { CreatePayslipDto } from './dto/create-payslip.dto';
import { UpdatePayslipDto } from './dto/update-payslip.dto';
import { PayslipResponseDto } from './dto/payslip-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UuidValidationPipe } from '../common/pipes/uuid-validation.pipe';

@Controller('payroll')
@UseGuards(JwtAuthGuard)
@UseInterceptors(ClassSerializerInterceptor)
export class PayrollController {
  constructor(private readonly payrollService: PayrollService) {}

  @Post('payslips')
  @UseGuards(RolesGuard)
  @Roles('admin', 'hr')
  async create(
    @Body() createPayslipDto: CreatePayslipDto,
  ): Promise<PayslipResponseDto> {
    const payslip = await this.payrollService.create(createPayslipDto);
    return plainToInstance(PayslipResponseDto, payslip, {
      excludeExtraneousValues: true,
    });
  }

  @Get('payslips')
  @UseGuards(RolesGuard)
  @Roles('admin', 'hr', 'manager')
  async findAll(
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('employeeId', new ParseIntPipe({ optional: true }))
    employeeId?: number,
    @Query('paymentStatus') paymentStatus?: string,
  ) {
    const result = await this.payrollService.findAll(
      page,
      limit,
      employeeId,
      paymentStatus,
    );
    return {
      ...result,
      data: result.data.map((payslip) =>
        plainToInstance(PayslipResponseDto, payslip, {
          excludeExtraneousValues: true,
        }),
      ),
    };
  }

  @Get('payslips/my-payslips')
  @UseGuards(RolesGuard)
  @Roles('admin', 'hr', 'manager', 'employee')
  async getMyPayslips(
    @Request() req,
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    // Get the employee ID from the authenticated user
    const employeeId = req.user.employeeId; // Assuming the user object has employeeId

    const result = await this.payrollService.findByEmployee(
      employeeId,
      page,
      limit,
    );
    return {
      ...result,
      data: result.data.map((payslip) =>
        plainToInstance(PayslipResponseDto, payslip, {
          excludeExtraneousValues: true,
        }),
      ),
    };
  }

  @Get('payslips/:publicId')
  @UseGuards(RolesGuard)
  @Roles('admin', 'hr', 'manager', 'employee')
  async findOne(
    @Param('publicId', UuidValidationPipe) publicId: string,
  ): Promise<PayslipResponseDto> {
    const payslip = await this.payrollService.findByPublicId(publicId);
    return plainToInstance(PayslipResponseDto, payslip, {
      excludeExtraneousValues: true,
    });
  }

  @Patch('payslips/:publicId')
  @UseGuards(RolesGuard)
  @Roles('admin', 'hr')
  async update(
    @Param('publicId', UuidValidationPipe) publicId: string,
    @Body() updatePayslipDto: UpdatePayslipDto,
  ): Promise<PayslipResponseDto> {
    const payslip = await this.payrollService.updateByPublicId(
      publicId,
      updatePayslipDto,
    );
    return plainToInstance(PayslipResponseDto, payslip, {
      excludeExtraneousValues: true,
    });
  }

  @Patch('payslips/:publicId/payment-status')
  @UseGuards(RolesGuard)
  @Roles('admin', 'hr')
  async updatePaymentStatus(
    @Param('publicId', UuidValidationPipe) publicId: string,
    @Body('paymentStatus') paymentStatus: string,
  ): Promise<PayslipResponseDto> {
    const payslip = await this.payrollService.updatePaymentStatus(
      publicId,
      paymentStatus,
    );
    return plainToInstance(PayslipResponseDto, payslip, {
      excludeExtraneousValues: true,
    });
  }

  @Post('payslips/:publicId/generate-pdf')
  @UseGuards(RolesGuard)
  @Roles('admin', 'hr', 'manager', 'employee')
  async generatePdf(
    @Param('publicId', UuidValidationPipe) publicId: string,
  ): Promise<{ pdfUrl: string }> {
    return await this.payrollService.generatePdf(publicId);
  }
}

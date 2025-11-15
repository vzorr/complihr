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
import { EmployeesService } from './employees.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { EmployeeResponseDto } from './dto/employee-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { SelfOrRoleGuard } from '../auth/guards/self-or-role.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { SelfOrRoles } from '../auth/decorators/self-or-roles.decorator';
import { UuidValidationPipe } from '../common/pipes/uuid-validation.pipe';
import { AuditLoggingInterceptor } from '../common/interceptors/audit-logging.interceptor';

@Controller('employees')
@UseGuards(JwtAuthGuard)
@UseInterceptors(ClassSerializerInterceptor, AuditLoggingInterceptor)
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('admin')
  async create(@Body() createEmployeeDto: CreateEmployeeDto): Promise<EmployeeResponseDto> {
    const employee = await this.employeesService.create(createEmployeeDto);
    return plainToInstance(EmployeeResponseDto, employee, { excludeExtraneousValues: true });
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles('admin', 'hr')
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const result = await this.employeesService.findAll(page, limit);
    return {
      ...result,
      data: plainToInstance(EmployeeResponseDto, result.data, { excludeExtraneousValues: true }),
    };
  }

  @Get('active')
  @UseGuards(RolesGuard)
  @Roles('admin', 'hr')
  async getActive(): Promise<EmployeeResponseDto[]> {
    const employees = await this.employeesService.getActiveEmployees();
    return plainToInstance(EmployeeResponseDto, employees, { excludeExtraneousValues: true });
  }

  @Get('department/:departmentId')
  @UseGuards(RolesGuard)
  @Roles('admin', 'hr', 'manager')
  async getByDepartment(@Param('departmentId', ParseIntPipe) departmentId: number): Promise<EmployeeResponseDto[]> {
    const employees = await this.employeesService.getEmployeesByDepartment(departmentId);
    return plainToInstance(EmployeeResponseDto, employees, { excludeExtraneousValues: true });
  }

  // ✅ NEW: Use publicId instead of internal ID
  @Get(':publicId')
  @UseGuards(SelfOrRoleGuard)
  @SelfOrRoles('admin', 'hr', 'manager')
  async findOne(@Param('publicId', UuidValidationPipe) publicId: string): Promise<EmployeeResponseDto> {
    const employee = await this.employeesService.findByPublicId(publicId);
    return plainToInstance(EmployeeResponseDto, employee, { excludeExtraneousValues: true });
  }

  // ✅ NEW: Use publicId instead of internal ID
  @Patch(':publicId')
  @UseGuards(SelfOrRoleGuard)
  @SelfOrRoles('admin')
  async update(
    @Param('publicId', UuidValidationPipe) publicId: string,
    @Body() updateEmployeeDto: UpdateEmployeeDto,
  ): Promise<EmployeeResponseDto> {
    const employee = await this.employeesService.updateByPublicId(publicId, updateEmployeeDto);
    return plainToInstance(EmployeeResponseDto, employee, { excludeExtraneousValues: true });
  }

  // ✅ NEW: Use publicId instead of internal ID
  @Delete(':publicId')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async remove(@Param('publicId', UuidValidationPipe) publicId: string): Promise<{ message: string }> {
    await this.employeesService.removeByPublicId(publicId);
    return { message: 'Employee deleted successfully' };
  }
}

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
import { DepartmentsService } from './departments.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { DepartmentResponseDto } from './dto/department-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UuidValidationPipe } from '../common/pipes/uuid-validation.pipe';

@Controller('departments')
@UseGuards(JwtAuthGuard)
@UseInterceptors(ClassSerializerInterceptor)
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('admin', 'hr')
  async create(@Body() createDepartmentDto: CreateDepartmentDto): Promise<DepartmentResponseDto> {
    const department = await this.departmentsService.create(createDepartmentDto);
    return plainToInstance(DepartmentResponseDto, department, { excludeExtraneousValues: true });
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles('admin', 'hr', 'manager')
  async findAll(
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    const result = await this.departmentsService.findAll(page, limit);
    return {
      ...result,
      data: result.data.map(dept =>
        plainToInstance(DepartmentResponseDto, dept, { excludeExtraneousValues: true })
      ),
    };
  }

  @Get(':publicId')
  @UseGuards(RolesGuard)
  @Roles('admin', 'hr', 'manager')
  async findOne(@Param('publicId', UuidValidationPipe) publicId: string): Promise<DepartmentResponseDto> {
    const department = await this.departmentsService.findByPublicId(publicId);
    return plainToInstance(DepartmentResponseDto, department, { excludeExtraneousValues: true });
  }

  @Patch(':publicId')
  @UseGuards(RolesGuard)
  @Roles('admin', 'hr')
  async update(
    @Param('publicId', UuidValidationPipe) publicId: string,
    @Body() updateDepartmentDto: UpdateDepartmentDto,
  ): Promise<DepartmentResponseDto> {
    const department = await this.departmentsService.updateByPublicId(publicId, updateDepartmentDto);
    return plainToInstance(DepartmentResponseDto, department, { excludeExtraneousValues: true });
  }

  @Delete(':publicId')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async remove(@Param('publicId', UuidValidationPipe) publicId: string): Promise<{ message: string }> {
    await this.departmentsService.removeByPublicId(publicId);
    return { message: 'Department deleted successfully' };
  }

  @Get(':publicId/employees')
  @UseGuards(RolesGuard)
  @Roles('admin', 'hr', 'manager')
  async getDepartmentEmployees(@Param('publicId', UuidValidationPipe) publicId: string) {
    return this.departmentsService.getDepartmentEmployees(publicId);
  }

  @Get(':publicId/headcount')
  @UseGuards(RolesGuard)
  @Roles('admin', 'hr', 'manager')
  async getDepartmentHeadcount(@Param('publicId', UuidValidationPipe) publicId: string) {
    return this.departmentsService.getDepartmentHeadcount(publicId);
  }
}

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
import { DesignationsService } from './designations.service';
import { CreateDesignationDto } from './dto/create-designation.dto';
import { UpdateDesignationDto } from './dto/update-designation.dto';
import { DesignationResponseDto } from './dto/designation-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UuidValidationPipe } from '../common/pipes/uuid-validation.pipe';

@Controller('designations')
@UseGuards(JwtAuthGuard)
@UseInterceptors(ClassSerializerInterceptor)
export class DesignationsController {
  constructor(private readonly designationsService: DesignationsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('admin', 'hr')
  async create(@Body() createDesignationDto: CreateDesignationDto): Promise<DesignationResponseDto> {
    const designation = await this.designationsService.create(createDesignationDto);
    return plainToInstance(DesignationResponseDto, designation, { excludeExtraneousValues: true });
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles('admin', 'hr', 'manager')
  async findAll(
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    const result = await this.designationsService.findAll(page, limit);
    return {
      ...result,
      data: result.data.map(designation =>
        plainToInstance(DesignationResponseDto, designation, { excludeExtraneousValues: true })
      ),
    };
  }

  @Get(':publicId')
  @UseGuards(RolesGuard)
  @Roles('admin', 'hr', 'manager')
  async findOne(@Param('publicId', UuidValidationPipe) publicId: string): Promise<DesignationResponseDto> {
    const designation = await this.designationsService.findByPublicId(publicId);
    return plainToInstance(DesignationResponseDto, designation, { excludeExtraneousValues: true });
  }

  @Patch(':publicId')
  @UseGuards(RolesGuard)
  @Roles('admin', 'hr')
  async update(
    @Param('publicId', UuidValidationPipe) publicId: string,
    @Body() updateDesignationDto: UpdateDesignationDto,
  ): Promise<DesignationResponseDto> {
    const designation = await this.designationsService.updateByPublicId(publicId, updateDesignationDto);
    return plainToInstance(DesignationResponseDto, designation, { excludeExtraneousValues: true });
  }

  @Delete(':publicId')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async remove(@Param('publicId', UuidValidationPipe) publicId: string): Promise<{ message: string }> {
    await this.designationsService.removeByPublicId(publicId);
    return { message: 'Designation deleted successfully' };
  }
}

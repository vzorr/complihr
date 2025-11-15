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
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { RoleResponseDto } from './dto/role-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UuidValidationPipe } from '../common/pipes/uuid-validation.pipe';

@Controller('admin/roles')
@UseGuards(JwtAuthGuard)
@UseInterceptors(ClassSerializerInterceptor)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('admin')
  async create(@Body() createRoleDto: CreateRoleDto): Promise<RoleResponseDto> {
    const role = await this.rolesService.create(createRoleDto);
    return plainToInstance(RoleResponseDto, role, {
      excludeExtraneousValues: true,
    });
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles('admin', 'hr')
  async findAll(
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    const result = await this.rolesService.findAll(page, limit);
    return {
      ...result,
      data: result.data.map((role) =>
        plainToInstance(RoleResponseDto, role, {
          excludeExtraneousValues: true,
        }),
      ),
    };
  }

  @Get(':publicId')
  @UseGuards(RolesGuard)
  @Roles('admin', 'hr')
  async findOne(
    @Param('publicId', UuidValidationPipe) publicId: string,
  ): Promise<RoleResponseDto> {
    const role = await this.rolesService.findByPublicId(publicId);
    return plainToInstance(RoleResponseDto, role, {
      excludeExtraneousValues: true,
    });
  }

  @Patch(':publicId')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async update(
    @Param('publicId', UuidValidationPipe) publicId: string,
    @Body() updateRoleDto: UpdateRoleDto,
  ): Promise<RoleResponseDto> {
    const role = await this.rolesService.updateByPublicId(
      publicId,
      updateRoleDto,
    );
    return plainToInstance(RoleResponseDto, role, {
      excludeExtraneousValues: true,
    });
  }

  @Delete(':publicId')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async remove(
    @Param('publicId', UuidValidationPipe) publicId: string,
  ): Promise<{ message: string }> {
    await this.rolesService.removeByPublicId(publicId);
    return { message: 'Role removed successfully' };
  }
}

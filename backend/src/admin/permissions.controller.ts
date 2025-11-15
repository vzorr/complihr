import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  UseInterceptors,
  ClassSerializerInterceptor,
  NotFoundException,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { PermissionsService } from './permissions.service';
import { PermissionResponseDto } from './dto/permission-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('admin/permissions')
@UseGuards(JwtAuthGuard)
@UseInterceptors(ClassSerializerInterceptor)
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Get()
  @UseGuards(RolesGuard)
  @Roles('admin', 'hr')
  async findAll(
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('module') module?: string,
  ) {
    const result = await this.permissionsService.findAll(page, limit, module);
    return {
      ...result,
      data: result.data.map((permission) =>
        plainToInstance(PermissionResponseDto, permission, {
          excludeExtraneousValues: true,
        }),
      ),
    };
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles('admin', 'hr')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<PermissionResponseDto> {
    const permission = await this.permissionsService.findById(id);

    if (!permission) {
      throw new NotFoundException(`Permission not found`);
    }

    return plainToInstance(PermissionResponseDto, permission, {
      excludeExtraneousValues: true,
    });
  }
}

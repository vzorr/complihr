import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
  UseInterceptors,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { OrganizationSettingsService } from './organization-settings.service';
import { UpdateOrganizationSettingsDto } from './dto/update-organization-settings.dto';
import { OrganizationSettingsResponseDto } from './dto/organization-settings-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('admin/organization-settings')
@UseGuards(JwtAuthGuard)
@UseInterceptors(ClassSerializerInterceptor)
export class OrganizationSettingsController {
  constructor(
    private readonly organizationSettingsService: OrganizationSettingsService,
  ) {}

  @Get()
  @UseGuards(RolesGuard)
  @Roles('admin', 'hr')
  async get(): Promise<OrganizationSettingsResponseDto> {
    const settings = await this.organizationSettingsService.get();
    return plainToInstance(OrganizationSettingsResponseDto, settings, {
      excludeExtraneousValues: true,
    });
  }

  @Patch()
  @UseGuards(RolesGuard)
  @Roles('admin')
  async update(
    @Body() updateDto: UpdateOrganizationSettingsDto,
  ): Promise<OrganizationSettingsResponseDto> {
    const settings = await this.organizationSettingsService.update(updateDto);
    return plainToInstance(OrganizationSettingsResponseDto, settings, {
      excludeExtraneousValues: true,
    });
  }
}

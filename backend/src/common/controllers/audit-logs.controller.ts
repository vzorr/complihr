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
import { AuditLogReadService } from '../services/audit-log-read.service';
import { AuditLogResponseDto } from '../dto/audit-log-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';

@Controller('admin/audit-logs')
@UseGuards(JwtAuthGuard)
@UseInterceptors(ClassSerializerInterceptor)
export class AuditLogsController {
  constructor(private readonly auditLogReadService: AuditLogReadService) {}

  @Get()
  @UseGuards(RolesGuard)
  @Roles('admin')
  async findAll(
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('userId', new ParseIntPipe({ optional: true })) userId?: number,
    @Query('action') action?: string,
    @Query('resourceType') resourceType?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    const result = await this.auditLogReadService.findAll(
      page,
      limit,
      userId,
      action,
      resourceType,
      fromDate,
      toDate,
    );
    return {
      ...result,
      data: result.data.map((log) =>
        plainToInstance(AuditLogResponseDto, log, {
          excludeExtraneousValues: true,
        }),
      ),
    };
  }

  @Get('stats/actions')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async getActionStats(
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    return await this.auditLogReadService.getActionStats(fromDate, toDate);
  }

  @Get('stats/resources')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async getResourceTypeStats(
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    return await this.auditLogReadService.getResourceTypeStats(
      fromDate,
      toDate,
    );
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<AuditLogResponseDto> {
    const log = await this.auditLogReadService.findById(id);

    if (!log) {
      throw new NotFoundException(`Audit log not found`);
    }

    return plainToInstance(AuditLogResponseDto, log, {
      excludeExtraneousValues: true,
    });
  }
}

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
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { PerformanceService } from './performance.service';
import { CreateMonthlyReviewDto } from './dto/create-monthly-review.dto';
import { UpdateMonthlyReviewDto } from './dto/update-monthly-review.dto';
import { MonthlyReviewResponseDto } from './dto/monthly-review-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UuidValidationPipe } from '../common/pipes/uuid-validation.pipe';

@Controller('performance')
@UseGuards(JwtAuthGuard)
@UseInterceptors(ClassSerializerInterceptor)
export class PerformanceController {
  constructor(private readonly performanceService: PerformanceService) {}

  @Post('reviews')
  @UseGuards(RolesGuard)
  @Roles('admin', 'hr', 'manager')
  async create(
    @Body() createReviewDto: CreateMonthlyReviewDto,
  ): Promise<MonthlyReviewResponseDto> {
    const review = await this.performanceService.create(createReviewDto);
    return plainToInstance(MonthlyReviewResponseDto, review, {
      excludeExtraneousValues: true,
    });
  }

  @Get('reviews')
  @UseGuards(RolesGuard)
  @Roles('admin', 'hr', 'manager')
  async findAll(
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('employeeId', new ParseIntPipe({ optional: true })) employeeId?: number,
    @Query('reviewYear', new ParseIntPipe({ optional: true })) reviewYear?: number,
    @Query('status') status?: string,
  ) {
    const result = await this.performanceService.findAll(
      page,
      limit,
      employeeId,
      reviewYear,
      status,
    );
    return {
      ...result,
      data: result.data.map((review) =>
        plainToInstance(MonthlyReviewResponseDto, review, {
          excludeExtraneousValues: true,
        }),
      ),
    };
  }

  @Get('reviews/:publicId')
  @UseGuards(RolesGuard)
  @Roles('admin', 'hr', 'manager', 'employee')
  async findOne(
    @Param('publicId', UuidValidationPipe) publicId: string,
  ): Promise<MonthlyReviewResponseDto> {
    const review = await this.performanceService.findByPublicId(publicId);
    return plainToInstance(MonthlyReviewResponseDto, review, {
      excludeExtraneousValues: true,
    });
  }

  @Patch('reviews/:publicId')
  @UseGuards(RolesGuard)
  @Roles('admin', 'hr', 'manager')
  async update(
    @Param('publicId', UuidValidationPipe) publicId: string,
    @Body() updateReviewDto: UpdateMonthlyReviewDto,
  ): Promise<MonthlyReviewResponseDto> {
    const review = await this.performanceService.updateByPublicId(
      publicId,
      updateReviewDto,
    );
    return plainToInstance(MonthlyReviewResponseDto, review, {
      excludeExtraneousValues: true,
    });
  }

  @Post('reviews/:publicId/complete')
  @UseGuards(RolesGuard)
  @Roles('admin', 'hr', 'manager')
  async complete(
    @Param('publicId', UuidValidationPipe) publicId: string,
  ): Promise<MonthlyReviewResponseDto> {
    const review = await this.performanceService.complete(publicId);
    return plainToInstance(MonthlyReviewResponseDto, review, {
      excludeExtraneousValues: true,
    });
  }

  @Post('reviews/:publicId/acknowledge')
  @UseGuards(RolesGuard)
  @Roles('admin', 'hr', 'manager', 'employee')
  async acknowledge(
    @Param('publicId', UuidValidationPipe) publicId: string,
  ): Promise<MonthlyReviewResponseDto> {
    const review = await this.performanceService.acknowledge(publicId);
    return plainToInstance(MonthlyReviewResponseDto, review, {
      excludeExtraneousValues: true,
    });
  }
}

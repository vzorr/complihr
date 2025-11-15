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
  ParseBoolPipe,
  UseInterceptors,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { ExpenseCategoriesService } from './expense-categories.service';
import { CreateExpenseCategoryDto } from './dto/create-expense-category.dto';
import { UpdateExpenseCategoryDto } from './dto/update-expense-category.dto';
import { ExpenseCategoryResponseDto } from './dto/expense-category-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UuidValidationPipe } from '../common/pipes/uuid-validation.pipe';

@Controller('expenses/categories')
@UseGuards(JwtAuthGuard)
@UseInterceptors(ClassSerializerInterceptor)
export class ExpenseCategoriesController {
  constructor(
    private readonly expenseCategoriesService: ExpenseCategoriesService,
  ) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('admin', 'hr')
  async create(
    @Body() createExpenseCategoryDto: CreateExpenseCategoryDto,
  ): Promise<ExpenseCategoryResponseDto> {
    const category =
      await this.expenseCategoriesService.create(createExpenseCategoryDto);
    return plainToInstance(ExpenseCategoryResponseDto, category, {
      excludeExtraneousValues: true,
    });
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles('admin', 'hr', 'manager', 'employee')
  async findAll(
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('isActive', new ParseBoolPipe({ optional: true })) isActive?: boolean,
  ) {
    const result = await this.expenseCategoriesService.findAll(
      page,
      limit,
      isActive,
    );
    return {
      ...result,
      data: result.data.map((category) =>
        plainToInstance(ExpenseCategoryResponseDto, category, {
          excludeExtraneousValues: true,
        }),
      ),
    };
  }

  @Get(':publicId')
  @UseGuards(RolesGuard)
  @Roles('admin', 'hr', 'manager', 'employee')
  async findOne(
    @Param('publicId', UuidValidationPipe) publicId: string,
  ): Promise<ExpenseCategoryResponseDto> {
    const category =
      await this.expenseCategoriesService.findByPublicId(publicId);
    return plainToInstance(ExpenseCategoryResponseDto, category, {
      excludeExtraneousValues: true,
    });
  }

  @Patch(':publicId')
  @UseGuards(RolesGuard)
  @Roles('admin', 'hr')
  async update(
    @Param('publicId', UuidValidationPipe) publicId: string,
    @Body() updateExpenseCategoryDto: UpdateExpenseCategoryDto,
  ): Promise<ExpenseCategoryResponseDto> {
    const category = await this.expenseCategoriesService.updateByPublicId(
      publicId,
      updateExpenseCategoryDto,
    );
    return plainToInstance(ExpenseCategoryResponseDto, category, {
      excludeExtraneousValues: true,
    });
  }

  @Delete(':publicId')
  @UseGuards(RolesGuard)
  @Roles('admin', 'hr')
  async remove(
    @Param('publicId', UuidValidationPipe) publicId: string,
  ): Promise<{ message: string }> {
    await this.expenseCategoriesService.removeByPublicId(publicId);
    return { message: 'Expense category deactivated successfully' };
  }
}

import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExpenseCategory } from './entities/expense-category.entity';
import { CreateExpenseCategoryDto } from './dto/create-expense-category.dto';
import { UpdateExpenseCategoryDto } from './dto/update-expense-category.dto';

@Injectable()
export class ExpenseCategoriesService {
  constructor(
    @InjectRepository(ExpenseCategory)
    private readonly expenseCategoryRepository: Repository<ExpenseCategory>,
  ) {}

  async create(
    createExpenseCategoryDto: CreateExpenseCategoryDto,
  ): Promise<ExpenseCategory> {
    // Check if category name already exists
    const existingName = await this.expenseCategoryRepository.findOne({
      where: { categoryName: createExpenseCategoryDto.categoryName },
    });

    if (existingName) {
      throw new ConflictException(
        `Expense category with name ${createExpenseCategoryDto.categoryName} already exists`,
      );
    }

    // Check if code already exists
    if (createExpenseCategoryDto.categoryCode) {
      const existingCode = await this.expenseCategoryRepository.findOne({
        where: { categoryCode: createExpenseCategoryDto.categoryCode },
      });

      if (existingCode) {
        throw new ConflictException(
          `Expense category with code ${createExpenseCategoryDto.categoryCode} already exists`,
        );
      }
    }

    const category = this.expenseCategoryRepository.create(
      createExpenseCategoryDto,
    );
    return (await this.expenseCategoryRepository.save(
      category,
    )) as unknown as ExpenseCategory;
  }

  async findAll(
    page: number = 1,
    limit: number = 50,
    isActive?: boolean,
  ): Promise<{
    data: ExpenseCategory[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const queryBuilder =
      this.expenseCategoryRepository.createQueryBuilder('category');

    if (isActive !== undefined) {
      queryBuilder.andWhere('category.isActive = :isActive', { isActive });
    }

    const [data, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('category.categoryName', 'ASC')
      .getManyAndCount();

    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findByPublicId(publicId: string): Promise<ExpenseCategory> {
    const category = await this.expenseCategoryRepository.findOne({
      where: { publicId },
    });

    if (!category) {
      throw new NotFoundException(`Expense category not found`);
    }

    return category;
  }

  async updateByPublicId(
    publicId: string,
    updateExpenseCategoryDto: UpdateExpenseCategoryDto,
  ): Promise<ExpenseCategory> {
    const category = await this.findByPublicId(publicId);

    // Check if new name conflicts
    if (
      updateExpenseCategoryDto.categoryName &&
      updateExpenseCategoryDto.categoryName !== category.categoryName
    ) {
      const existingName = await this.expenseCategoryRepository.findOne({
        where: { categoryName: updateExpenseCategoryDto.categoryName },
      });

      if (existingName) {
        throw new ConflictException(
          `Expense category with name ${updateExpenseCategoryDto.categoryName} already exists`,
        );
      }
    }

    // Check if new code conflicts
    if (
      updateExpenseCategoryDto.categoryCode &&
      updateExpenseCategoryDto.categoryCode !== category.categoryCode
    ) {
      const existingCode = await this.expenseCategoryRepository.findOne({
        where: { categoryCode: updateExpenseCategoryDto.categoryCode },
      });

      if (existingCode) {
        throw new ConflictException(
          `Expense category with code ${updateExpenseCategoryDto.categoryCode} already exists`,
        );
      }
    }

    Object.assign(category, updateExpenseCategoryDto);
    return await this.expenseCategoryRepository.save(category);
  }

  async removeByPublicId(publicId: string): Promise<void> {
    const category = await this.findByPublicId(publicId);
    // Soft delete by setting isActive to false
    category.isActive = false;
    await this.expenseCategoryRepository.save(category);
  }
}

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MonthlyReview } from './entities/monthly-review.entity';
import { CreateMonthlyReviewDto } from './dto/create-monthly-review.dto';
import { UpdateMonthlyReviewDto } from './dto/update-monthly-review.dto';

@Injectable()
export class PerformanceService {
  constructor(
    @InjectRepository(MonthlyReview)
    private readonly monthlyReviewRepository: Repository<MonthlyReview>,
  ) {}

  async create(createReviewDto: CreateMonthlyReviewDto): Promise<MonthlyReview> {
    // Check if review already exists for this employee and period
    const existingReview = await this.monthlyReviewRepository.findOne({
      where: {
        employeeId: createReviewDto.employeeId,
        reviewYear: createReviewDto.reviewYear,
        reviewMonth: createReviewDto.reviewMonth,
      },
    });

    if (existingReview) {
      throw new ConflictException(
        `Review already exists for this employee for ${createReviewDto.reviewMonth}/${createReviewDto.reviewYear}`,
      );
    }

    // Calculate overall rating if ratings are provided
    const ratings = [
      createReviewDto.attendanceRating,
      createReviewDto.punctualityRating,
      createReviewDto.customerServiceRating,
      createReviewDto.tillAccuracyRating,
      createReviewDto.teamworkRating,
      createReviewDto.productKnowledgeRating,
    ].filter((r) => r !== undefined && r !== null);

    let overallRating: number | undefined;
    if (ratings.length > 0) {
      const sum = ratings.reduce((acc, val) => acc + val, 0);
      overallRating = parseFloat((sum / ratings.length).toFixed(2));
    }

    const review = this.monthlyReviewRepository.create({
      ...createReviewDto,
      overallRating,
    });

    return (await this.monthlyReviewRepository.save(review)) as unknown as MonthlyReview;
  }

  async findAll(
    page: number = 1,
    limit: number = 50,
    employeeId?: number,
    reviewYear?: number,
    status?: string,
  ): Promise<{
    data: MonthlyReview[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const queryBuilder = this.monthlyReviewRepository
      .createQueryBuilder('review')
      .leftJoinAndSelect('review.employee', 'employee')
      .leftJoinAndSelect('review.reviewer', 'reviewer');

    if (employeeId) {
      queryBuilder.andWhere('review.employeeId = :employeeId', { employeeId });
    }

    if (reviewYear) {
      queryBuilder.andWhere('review.reviewYear = :reviewYear', { reviewYear });
    }

    if (status) {
      queryBuilder.andWhere('review.status = :status', { status });
    }

    const [data, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('review.reviewYear', 'DESC')
      .addOrderBy('review.reviewMonth', 'DESC')
      .getManyAndCount();

    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findByPublicId(publicId: string): Promise<MonthlyReview> {
    const review = await this.monthlyReviewRepository.findOne({
      where: { publicId },
      relations: ['employee', 'reviewer'],
    });

    if (!review) {
      throw new NotFoundException(`Review not found`);
    }

    return review;
  }

  async updateByPublicId(
    publicId: string,
    updateReviewDto: UpdateMonthlyReviewDto,
  ): Promise<MonthlyReview> {
    const review = await this.findByPublicId(publicId);

    if (review.status === 'acknowledged') {
      throw new BadRequestException('Cannot update acknowledged review');
    }

    // Recalculate overall rating if ratings are updated
    const ratings = [
      updateReviewDto.attendanceRating ?? review.attendanceRating,
      updateReviewDto.punctualityRating ?? review.punctualityRating,
      updateReviewDto.customerServiceRating ?? review.customerServiceRating,
      updateReviewDto.tillAccuracyRating ?? review.tillAccuracyRating,
      updateReviewDto.teamworkRating ?? review.teamworkRating,
      updateReviewDto.productKnowledgeRating ?? review.productKnowledgeRating,
    ].filter((r) => r !== undefined && r !== null);

    if (ratings.length > 0) {
      const sum = ratings.reduce((acc, val) => acc + val, 0);
      review.overallRating = parseFloat((sum / ratings.length).toFixed(2));
    }

    Object.assign(review, updateReviewDto);
    return await this.monthlyReviewRepository.save(review);
  }

  async complete(publicId: string): Promise<MonthlyReview> {
    const review = await this.findByPublicId(publicId);

    if (review.status !== 'draft') {
      throw new BadRequestException('Only draft reviews can be completed');
    }

    review.status = 'completed';
    review.completedAt = new Date();

    return await this.monthlyReviewRepository.save(review);
  }

  async acknowledge(publicId: string): Promise<MonthlyReview> {
    const review = await this.findByPublicId(publicId);

    if (review.status !== 'completed') {
      throw new BadRequestException('Only completed reviews can be acknowledged');
    }

    review.acknowledgedByEmployee = true;
    review.acknowledgedAt = new Date();
    review.status = 'acknowledged';

    return await this.monthlyReviewRepository.save(review);
  }
}

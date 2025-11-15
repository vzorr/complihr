import { PartialType } from '@nestjs/mapped-types';
import { CreateMonthlyReviewDto } from './create-monthly-review.dto';

export class UpdateMonthlyReviewDto extends PartialType(CreateMonthlyReviewDto) {}

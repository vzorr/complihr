import { PartialType } from '@nestjs/mapped-types';
import { CreateLeaveRequestDto } from './create-leave-request.dto';
import { IsString, IsOptional, MaxLength } from 'class-validator';

export class UpdateLeaveRequestDto extends PartialType(CreateLeaveRequestDto) {
  @IsString()
  @MaxLength(1000)
  @IsOptional()
  adminNotes?: string;
}

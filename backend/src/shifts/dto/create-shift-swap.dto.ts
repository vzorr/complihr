import {
  IsString,
  IsNumber,
  IsOptional,
  MaxLength,
} from 'class-validator';

export class CreateShiftSwapDto {
  @IsNumber()
  requestingEmployeeId: number;

  @IsNumber()
  originalShiftId: number;

  @IsNumber()
  @IsOptional()
  targetEmployeeId?: number;

  @IsNumber()
  @IsOptional()
  replacementShiftId?: number;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  reason?: string;
}

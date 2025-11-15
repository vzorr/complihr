import {
  IsNumber,
  IsString,
  IsOptional,
  IsEnum,
  MaxLength,
} from 'class-validator';
import { DeviceType } from './clock-in.dto';

export class ClockOutDto {
  @IsNumber()
  employeeId: number;

  @IsNumber()
  @IsOptional()
  latitude?: number;

  @IsNumber()
  @IsOptional()
  longitude?: number;

  @IsString()
  @MaxLength(255)
  @IsOptional()
  locationName?: string;

  @IsString()
  @MaxLength(45)
  @IsOptional()
  ipAddress?: string;

  @IsEnum(DeviceType)
  @IsOptional()
  deviceType?: DeviceType;

  @IsString()
  @MaxLength(100)
  @IsOptional()
  deviceId?: string;

  @IsString()
  @IsOptional()
  photoUrl?: string;
}

import {
  IsNumber,
  IsString,
  IsOptional,
  IsEnum,
  MaxLength,
  IsDecimal,
} from 'class-validator';

export enum DeviceType {
  MOBILE = 'mobile',
  WEB = 'web',
  KIOSK = 'kiosk',
}

export class ClockInDto {
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

  @IsNumber()
  @IsOptional()
  shiftId?: number;
}

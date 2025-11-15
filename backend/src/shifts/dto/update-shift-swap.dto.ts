import { PartialType } from '@nestjs/mapped-types';
import { CreateShiftSwapDto } from './create-shift-swap.dto';

export class UpdateShiftSwapDto extends PartialType(CreateShiftSwapDto) {}

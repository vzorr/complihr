import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Shift } from './entities/shift.entity';
import { ShiftSwap } from './entities/shift-swap.entity';
import { CreateShiftDto } from './dto/create-shift.dto';
import { UpdateShiftDto } from './dto/update-shift.dto';
import { CreateShiftSwapDto } from './dto/create-shift-swap.dto';
import { UpdateShiftSwapDto } from './dto/update-shift-swap.dto';

@Injectable()
export class ShiftsService {
  constructor(
    @InjectRepository(Shift)
    private readonly shiftRepository: Repository<Shift>,
    @InjectRepository(ShiftSwap)
    private readonly shiftSwapRepository: Repository<ShiftSwap>,
  ) {}

  // ============ SHIFTS ============

  async createShift(createShiftDto: CreateShiftDto): Promise<Shift> {
    const shift = this.shiftRepository.create(createShiftDto);
    return (await this.shiftRepository.save(shift)) as unknown as Shift;
  }

  async findAllShifts(
    page: number = 1,
    limit: number = 50,
    employeeId?: number,
    departmentId?: number,
    fromDate?: string,
    toDate?: string,
    status?: string,
  ): Promise<{
    data: Shift[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const queryBuilder = this.shiftRepository
      .createQueryBuilder('shift')
      .leftJoinAndSelect('shift.employee', 'employee')
      .leftJoinAndSelect('shift.department', 'department')
      .leftJoinAndSelect('shift.replacementEmployee', 'replacementEmployee');

    if (employeeId) {
      queryBuilder.andWhere('shift.employeeId = :employeeId', { employeeId });
    }

    if (departmentId) {
      queryBuilder.andWhere('shift.departmentId = :departmentId', {
        departmentId,
      });
    }

    if (fromDate && toDate) {
      queryBuilder.andWhere('shift.shiftDate BETWEEN :fromDate AND :toDate', {
        fromDate,
        toDate,
      });
    }

    if (status) {
      queryBuilder.andWhere('shift.status = :status', { status });
    }

    const [data, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('shift.shiftDate', 'DESC')
      .addOrderBy('shift.startTime', 'ASC')
      .getManyAndCount();

    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findShiftByPublicId(publicId: string): Promise<Shift> {
    const shift = await this.shiftRepository.findOne({
      where: { publicId },
      relations: ['employee', 'department', 'replacementEmployee'],
    });

    if (!shift) {
      throw new NotFoundException(`Shift not found`);
    }

    return shift;
  }

  async updateShiftByPublicId(
    publicId: string,
    updateShiftDto: UpdateShiftDto,
  ): Promise<Shift> {
    const shift = await this.findShiftByPublicId(publicId);

    // Don't allow updates to completed or cancelled shifts
    if (shift.status === 'completed' || shift.status === 'cancelled') {
      throw new BadRequestException(
        `Cannot update shift with status: ${shift.status}`,
      );
    }

    Object.assign(shift, updateShiftDto);
    return await this.shiftRepository.save(shift);
  }

  async confirmShift(publicId: string): Promise<Shift> {
    const shift = await this.findShiftByPublicId(publicId);

    if (shift.status !== 'scheduled') {
      throw new BadRequestException('Only scheduled shifts can be confirmed');
    }

    shift.status = 'confirmed';
    return await this.shiftRepository.save(shift);
  }

  async cancelShift(publicId: string, reason?: string): Promise<Shift> {
    const shift = await this.findShiftByPublicId(publicId);

    if (shift.status === 'completed') {
      throw new BadRequestException('Cannot cancel completed shift');
    }

    shift.status = 'cancelled';
    shift.notes = reason
      ? `${shift.notes ? shift.notes + ' | ' : ''}Cancelled: ${reason}`
      : shift.notes;

    return await this.shiftRepository.save(shift);
  }

  async removeShiftByPublicId(publicId: string): Promise<void> {
    const shift = await this.findShiftByPublicId(publicId);
    await this.shiftRepository.softRemove(shift);
  }

  // ============ SHIFT SWAPS ============

  async createShiftSwap(
    createShiftSwapDto: CreateShiftSwapDto,
  ): Promise<ShiftSwap> {
    // Verify original shift exists and is not already swapped
    const originalShift = await this.shiftRepository.findOne({
      where: { id: createShiftSwapDto.originalShiftId },
    });

    if (!originalShift) {
      throw new NotFoundException('Original shift not found');
    }

    if (originalShift.status === 'cancelled' || originalShift.status === 'completed') {
      throw new BadRequestException(
        `Cannot swap shift with status: ${originalShift.status}`,
      );
    }

    const shiftSwap = this.shiftSwapRepository.create(createShiftSwapDto);
    return (await this.shiftSwapRepository.save(
      shiftSwap,
    )) as unknown as ShiftSwap;
  }

  async findAllShiftSwaps(
    page: number = 1,
    limit: number = 50,
    employeeId?: number,
    status?: string,
  ): Promise<{
    data: ShiftSwap[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const queryBuilder = this.shiftSwapRepository
      .createQueryBuilder('swap')
      .leftJoinAndSelect('swap.requestingEmployee', 'requestingEmployee')
      .leftJoinAndSelect('swap.targetEmployee', 'targetEmployee')
      .leftJoinAndSelect('swap.originalShift', 'originalShift')
      .leftJoinAndSelect('swap.replacementShift', 'replacementShift')
      .leftJoinAndSelect('swap.approvedBy', 'approvedBy');

    if (employeeId) {
      queryBuilder.andWhere(
        '(swap.requestingEmployeeId = :employeeId OR swap.targetEmployeeId = :employeeId)',
        { employeeId },
      );
    }

    if (status) {
      queryBuilder.andWhere('swap.status = :status', { status });
    }

    const [data, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('swap.createdAt', 'DESC')
      .getManyAndCount();

    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findShiftSwapByPublicId(publicId: string): Promise<ShiftSwap> {
    const shiftSwap = await this.shiftSwapRepository.findOne({
      where: { publicId },
      relations: [
        'requestingEmployee',
        'targetEmployee',
        'originalShift',
        'replacementShift',
        'approvedBy',
      ],
    });

    if (!shiftSwap) {
      throw new NotFoundException(`Shift swap request not found`);
    }

    return shiftSwap;
  }

  async approveShiftSwap(
    publicId: string,
    approverId: number,
  ): Promise<ShiftSwap> {
    const shiftSwap = await this.findShiftSwapByPublicId(publicId);

    if (shiftSwap.status !== 'pending') {
      throw new BadRequestException(
        `Cannot approve shift swap with status: ${shiftSwap.status}`,
      );
    }

    // Update the original shift
    if (shiftSwap.originalShiftId && shiftSwap.targetEmployeeId) {
      const originalShift = await this.shiftRepository.findOne({
        where: { id: shiftSwap.originalShiftId },
      });

      if (originalShift) {
        originalShift.requiresReplacement = true;
        originalShift.replacementEmployeeId = shiftSwap.targetEmployeeId;
        await this.shiftRepository.save(originalShift);
      }
    }

    shiftSwap.status = 'approved';
    shiftSwap.approvedById = approverId;
    shiftSwap.approvedAt = new Date();

    return await this.shiftSwapRepository.save(shiftSwap);
  }

  async rejectShiftSwap(
    publicId: string,
    rejectionReason: string,
  ): Promise<ShiftSwap> {
    const shiftSwap = await this.findShiftSwapByPublicId(publicId);

    if (shiftSwap.status !== 'pending') {
      throw new BadRequestException(
        `Cannot reject shift swap with status: ${shiftSwap.status}`,
      );
    }

    shiftSwap.status = 'rejected';
    shiftSwap.rejectionReason = rejectionReason;

    return await this.shiftSwapRepository.save(shiftSwap);
  }

  async removeShiftSwapByPublicId(publicId: string): Promise<void> {
    const shiftSwap = await this.findShiftSwapByPublicId(publicId);
    await this.shiftSwapRepository.softRemove(shiftSwap);
  }
}

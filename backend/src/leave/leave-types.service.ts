import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LeaveType } from './entities/leave-type.entity';
import { CreateLeaveTypeDto } from './dto/create-leave-type.dto';
import { UpdateLeaveTypeDto } from './dto/update-leave-type.dto';

@Injectable()
export class LeaveTypesService {
  constructor(
    @InjectRepository(LeaveType)
    private readonly leaveTypeRepository: Repository<LeaveType>,
  ) {}

  async create(createLeaveTypeDto: CreateLeaveTypeDto): Promise<LeaveType> {
    // Check if leave type name already exists
    const existingName = await this.leaveTypeRepository.findOne({
      where: { name: createLeaveTypeDto.name },
    });

    if (existingName) {
      throw new ConflictException(
        `Leave type with name ${createLeaveTypeDto.name} already exists`,
      );
    }

    // Check if code already exists
    if (createLeaveTypeDto.code) {
      const existingCode = await this.leaveTypeRepository.findOne({
        where: { code: createLeaveTypeDto.code },
      });

      if (existingCode) {
        throw new ConflictException(
          `Leave type with code ${createLeaveTypeDto.code} already exists`,
        );
      }
    }

    const leaveType = this.leaveTypeRepository.create(createLeaveTypeDto);
    return (await this.leaveTypeRepository.save(
      leaveType,
    )) as unknown as LeaveType;
  }

  async findAll(
    page: number = 1,
    limit: number = 50,
    isActive?: boolean,
  ): Promise<{
    data: LeaveType[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const queryBuilder = this.leaveTypeRepository.createQueryBuilder('leaveType');

    if (isActive !== undefined) {
      queryBuilder.andWhere('leaveType.isActive = :isActive', { isActive });
    }

    const [data, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('leaveType.displayOrder', 'ASC')
      .addOrderBy('leaveType.name', 'ASC')
      .getManyAndCount();

    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findByPublicId(publicId: string): Promise<LeaveType> {
    const leaveType = await this.leaveTypeRepository.findOne({
      where: { publicId },
    });

    if (!leaveType) {
      throw new NotFoundException(`Leave type not found`);
    }

    return leaveType;
  }

  async updateByPublicId(
    publicId: string,
    updateLeaveTypeDto: UpdateLeaveTypeDto,
  ): Promise<LeaveType> {
    const leaveType = await this.findByPublicId(publicId);

    // Check if new name conflicts
    if (updateLeaveTypeDto.name && updateLeaveTypeDto.name !== leaveType.name) {
      const existingName = await this.leaveTypeRepository.findOne({
        where: { name: updateLeaveTypeDto.name },
      });

      if (existingName) {
        throw new ConflictException(
          `Leave type with name ${updateLeaveTypeDto.name} already exists`,
        );
      }
    }

    // Check if new code conflicts
    if (updateLeaveTypeDto.code && updateLeaveTypeDto.code !== leaveType.code) {
      const existingCode = await this.leaveTypeRepository.findOne({
        where: { code: updateLeaveTypeDto.code },
      });

      if (existingCode) {
        throw new ConflictException(
          `Leave type with code ${updateLeaveTypeDto.code} already exists`,
        );
      }
    }

    Object.assign(leaveType, updateLeaveTypeDto);
    return await this.leaveTypeRepository.save(leaveType);
  }

  async removeByPublicId(publicId: string): Promise<void> {
    const leaveType = await this.findByPublicId(publicId);
    // Soft delete by setting isActive to false instead of hard delete
    leaveType.isActive = false;
    await this.leaveTypeRepository.save(leaveType);
  }
}

import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Designation } from '../core/entities/designation.entity';
import { CreateDesignationDto } from './dto/create-designation.dto';
import { UpdateDesignationDto } from './dto/update-designation.dto';

@Injectable()
export class DesignationsService {
  constructor(
    @InjectRepository(Designation)
    private readonly designationRepository: Repository<Designation>,
  ) {}

  async create(createDesignationDto: CreateDesignationDto): Promise<Designation> {
    // Check if code already exists
    if (createDesignationDto.code) {
      const existing = await this.designationRepository.findOne({
        where: { code: createDesignationDto.code },
      });

      if (existing) {
        throw new ConflictException(
          `Designation with code ${createDesignationDto.code} already exists`,
        );
      }
    }

    const designation = this.designationRepository.create(createDesignationDto);
    return await this.designationRepository.save(designation) as unknown as Designation;
  }

  async findAll(page: number = 1, limit: number = 50): Promise<{
    data: Designation[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const [data, total] = await this.designationRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: {
        title: 'ASC',
      },
    });

    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findByPublicId(publicId: string): Promise<Designation> {
    const designation = await this.designationRepository.findOne({
      where: { publicId },
    });

    if (!designation) {
      throw new NotFoundException(`Designation not found`);
    }

    return designation;
  }

  async updateByPublicId(
    publicId: string,
    updateDesignationDto: UpdateDesignationDto,
  ): Promise<Designation> {
    const designation = await this.findByPublicId(publicId);

    // If updating code, check for conflicts
    if (
      updateDesignationDto.code &&
      updateDesignationDto.code !== designation.code
    ) {
      const existing = await this.designationRepository.findOne({
        where: { code: updateDesignationDto.code },
      });

      if (existing) {
        throw new ConflictException(
          `Designation with code ${updateDesignationDto.code} already exists`,
        );
      }
    }

    Object.assign(designation, updateDesignationDto);
    return await this.designationRepository.save(designation);
  }

  async removeByPublicId(publicId: string): Promise<void> {
    const designation = await this.findByPublicId(publicId);
    await this.designationRepository.softRemove(designation);
  }
}

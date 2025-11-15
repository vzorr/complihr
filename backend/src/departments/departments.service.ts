import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Department } from '../core/entities/department.entity';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';

@Injectable()
export class DepartmentsService {
  constructor(
    @InjectRepository(Department)
    private readonly departmentRepository: Repository<Department>,
  ) {}

  async create(createDepartmentDto: CreateDepartmentDto): Promise<Department> {
    // Check if code already exists
    if (createDepartmentDto.code) {
      const existing = await this.departmentRepository.findOne({
        where: { code: createDepartmentDto.code },
      });

      if (existing) {
        throw new ConflictException(
          `Department with code ${createDepartmentDto.code} already exists`,
        );
      }
    }

    const department = this.departmentRepository.create(createDepartmentDto);
    return await this.departmentRepository.save(department) as unknown as Department;
  }

  async findAll(page: number = 1, limit: number = 50): Promise<{
    data: Department[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const [data, total] = await this.departmentRepository.findAndCount({
      relations: ['parentDepartment', 'departmentHead'],
      skip: (page - 1) * limit,
      take: limit,
      order: {
        name: 'ASC',
      },
    });

    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findByPublicId(publicId: string): Promise<Department> {
    const department = await this.departmentRepository.findOne({
      where: { publicId },
      relations: ['parentDepartment', 'departmentHead'],
    });

    if (!department) {
      throw new NotFoundException(`Department not found`);
    }

    return department;
  }

  async updateByPublicId(
    publicId: string,
    updateDepartmentDto: UpdateDepartmentDto,
  ): Promise<Department> {
    const department = await this.findByPublicId(publicId);

    // If updating code, check for conflicts
    if (
      updateDepartmentDto.code &&
      updateDepartmentDto.code !== department.code
    ) {
      const existing = await this.departmentRepository.findOne({
        where: { code: updateDepartmentDto.code },
      });

      if (existing) {
        throw new ConflictException(
          `Department with code ${updateDepartmentDto.code} already exists`,
        );
      }
    }

    Object.assign(department, updateDepartmentDto);
    return await this.departmentRepository.save(department);
  }

  async removeByPublicId(publicId: string): Promise<void> {
    const department = await this.findByPublicId(publicId);
    await this.departmentRepository.softRemove(department);
  }

  async getDepartmentEmployees(publicId: string) {
    const department = await this.findByPublicId(publicId);

    // Get employee count - this will be implemented when we add the relationship
    // For now, return basic info
    return {
      departmentId: department.publicId,
      departmentName: department.name,
      employeeCount: 0, // TODO: Implement actual count
      employees: [], // TODO: Implement actual employees list
    };
  }

  async getDepartmentHeadcount(publicId: string) {
    const department = await this.findByPublicId(publicId);

    return {
      departmentId: department.publicId,
      departmentName: department.name,
      totalHeadcount: 0, // TODO: Implement actual count
      activeHeadcount: 0, // TODO: Implement actual count
      breakdown: {
        fullTime: 0,
        partTime: 0,
        contract: 0,
        casual: 0,
      },
    };
  }
}

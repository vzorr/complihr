import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Permission } from './entities/permission.entity';

@Injectable()
export class PermissionsService {
  constructor(
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
  ) {}

  async findAll(
    page: number = 1,
    limit: number = 100,
    module?: string,
  ): Promise<{
    data: Permission[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const queryBuilder = this.permissionRepository.createQueryBuilder('permission');

    if (module) {
      queryBuilder.andWhere('permission.module = :module', { module });
    }

    const [data, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('permission.module', 'ASC')
      .addOrderBy('permission.action', 'ASC')
      .getManyAndCount();

    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: number): Promise<Permission | null> {
    return await this.permissionRepository.findOne({ where: { id } });
  }
}

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { AuditLog } from '../entities/audit-log.entity';

@Injectable()
export class AuditLogReadService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
  ) {}

  async findAll(
    page: number = 1,
    limit: number = 50,
    userId?: number,
    action?: string,
    resourceType?: string,
    fromDate?: string,
    toDate?: string,
  ): Promise<{
    data: AuditLog[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const queryBuilder = this.auditLogRepository.createQueryBuilder('log');

    if (userId) {
      queryBuilder.andWhere('log.userId = :userId', { userId });
    }

    if (action) {
      queryBuilder.andWhere('log.action = :action', { action });
    }

    if (resourceType) {
      queryBuilder.andWhere('log.resourceType = :resourceType', {
        resourceType,
      });
    }

    if (fromDate && toDate) {
      queryBuilder.andWhere('log.createdAt BETWEEN :fromDate AND :toDate', {
        fromDate,
        toDate,
      });
    }

    const [data, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('log.createdAt', 'DESC')
      .getManyAndCount();

    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: number): Promise<AuditLog | null> {
    return await this.auditLogRepository.findOne({ where: { id } });
  }

  async getActionStats(
    fromDate?: string,
    toDate?: string,
  ): Promise<Array<{ action: string; count: number }>> {
    const queryBuilder = this.auditLogRepository
      .createQueryBuilder('log')
      .select('log.action', 'action')
      .addSelect('COUNT(*)', 'count')
      .groupBy('log.action')
      .orderBy('count', 'DESC');

    if (fromDate && toDate) {
      queryBuilder.andWhere('log.createdAt BETWEEN :fromDate AND :toDate', {
        fromDate,
        toDate,
      });
    }

    const results = await queryBuilder.getRawMany();

    return results.map((r) => ({
      action: r.action,
      count: parseInt(r.count, 10),
    }));
  }

  async getResourceTypeStats(
    fromDate?: string,
    toDate?: string,
  ): Promise<Array<{ resourceType: string; count: number }>> {
    const queryBuilder = this.auditLogRepository
      .createQueryBuilder('log')
      .select('log.resourceType', 'resourceType')
      .addSelect('COUNT(*)', 'count')
      .groupBy('log.resourceType')
      .orderBy('count', 'DESC');

    if (fromDate && toDate) {
      queryBuilder.andWhere('log.createdAt BETWEEN :fromDate AND :toDate', {
        fromDate,
        toDate,
      });
    }

    const results = await queryBuilder.getRawMany();

    return results.map((r) => ({
      resourceType: r.resourceType,
      count: parseInt(r.count, 10),
    }));
  }
}

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThan, Between } from 'typeorm';
import { Certification } from './entities/certification.entity';
import { TrainingRecord } from './entities/training-record.entity';
import { CreateCertificationDto } from './dto/create-certification.dto';
import { UpdateCertificationDto } from './dto/update-certification.dto';
import { CreateTrainingRecordDto } from './dto/create-training-record.dto';
import { UpdateTrainingRecordDto } from './dto/update-training-record.dto';

@Injectable()
export class ComplianceService {
  constructor(
    @InjectRepository(Certification)
    private readonly certificationRepository: Repository<Certification>,
    @InjectRepository(TrainingRecord)
    private readonly trainingRecordRepository: Repository<TrainingRecord>,
  ) {}

  // ============ CERTIFICATIONS ============

  async createCertification(
    createCertificationDto: CreateCertificationDto,
  ): Promise<Certification> {
    // Auto-determine status based on expiry date
    const expiryDate = new Date(createCertificationDto.expiryDate);
    const today = new Date();
    const daysUntilExpiry = Math.floor(
      (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );

    let status = 'active';
    if (daysUntilExpiry < 0) {
      status = 'expired';
    } else if (daysUntilExpiry <= 30) {
      status = 'expiring_soon';
    }

    const certification = this.certificationRepository.create({
      ...createCertificationDto,
      status,
    });

    return (await this.certificationRepository.save(
      certification,
    )) as unknown as Certification;
  }

  async findAllCertifications(
    page: number = 1,
    limit: number = 50,
    employeeId?: number,
    certificationType?: string,
    status?: string,
    expiringWithinDays?: number,
  ): Promise<{
    data: Certification[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const queryBuilder = this.certificationRepository
      .createQueryBuilder('cert')
      .leftJoinAndSelect('cert.employee', 'employee')
      .leftJoinAndSelect('cert.verifiedBy', 'verifiedBy');

    if (employeeId) {
      queryBuilder.andWhere('cert.employeeId = :employeeId', { employeeId });
    }

    if (certificationType) {
      queryBuilder.andWhere('cert.certificationType = :certificationType', {
        certificationType,
      });
    }

    if (status) {
      queryBuilder.andWhere('cert.status = :status', { status });
    }

    if (expiringWithinDays) {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + expiringWithinDays);
      queryBuilder.andWhere('cert.expiryDate <= :futureDate', { futureDate });
      queryBuilder.andWhere('cert.expiryDate >= :today', { today: new Date() });
    }

    const [data, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('cert.expiryDate', 'ASC')
      .getManyAndCount();

    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findCertificationByPublicId(publicId: string): Promise<Certification> {
    const certification = await this.certificationRepository.findOne({
      where: { publicId },
      relations: ['employee', 'verifiedBy'],
    });

    if (!certification) {
      throw new NotFoundException(`Certification not found`);
    }

    return certification;
  }

  async updateCertificationByPublicId(
    publicId: string,
    updateCertificationDto: UpdateCertificationDto,
  ): Promise<Certification> {
    const certification = await this.findCertificationByPublicId(publicId);

    // Recalculate status if expiry date is updated
    if (updateCertificationDto.expiryDate) {
      const expiryDate = new Date(updateCertificationDto.expiryDate);
      const today = new Date();
      const daysUntilExpiry = Math.floor(
        (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
      );

      let status = 'active';
      if (daysUntilExpiry < 0) {
        status = 'expired';
      } else if (daysUntilExpiry <= 30) {
        status = 'expiring_soon';
      }

      Object.assign(certification, updateCertificationDto, { status });
    } else {
      Object.assign(certification, updateCertificationDto);
    }

    return await this.certificationRepository.save(certification);
  }

  async verifyCertification(
    publicId: string,
    verifierId: number,
  ): Promise<Certification> {
    const certification = await this.findCertificationByPublicId(publicId);

    certification.isVerified = true;
    certification.verifiedById = verifierId;
    certification.verifiedAt = new Date();

    return await this.certificationRepository.save(certification);
  }

  async removeCertificationByPublicId(publicId: string): Promise<void> {
    const certification = await this.findCertificationByPublicId(publicId);
    await this.certificationRepository.softRemove(certification);
  }

  // ============ TRAINING RECORDS ============

  async createTrainingRecord(
    createTrainingRecordDto: CreateTrainingRecordDto,
  ): Promise<TrainingRecord> {
    const trainingRecord = this.trainingRecordRepository.create(
      createTrainingRecordDto,
    );

    return (await this.trainingRecordRepository.save(
      trainingRecord,
    )) as unknown as TrainingRecord;
  }

  async findAllTrainingRecords(
    page: number = 1,
    limit: number = 50,
    employeeId?: number,
    trainingType?: string,
    status?: string,
    fromDate?: string,
    toDate?: string,
  ): Promise<{
    data: TrainingRecord[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const queryBuilder = this.trainingRecordRepository
      .createQueryBuilder('training')
      .leftJoinAndSelect('training.employee', 'employee')
      .leftJoinAndSelect('training.trainer', 'trainer');

    if (employeeId) {
      queryBuilder.andWhere('training.employeeId = :employeeId', {
        employeeId,
      });
    }

    if (trainingType) {
      queryBuilder.andWhere('training.trainingType = :trainingType', {
        trainingType,
      });
    }

    if (status) {
      queryBuilder.andWhere('training.status = :status', { status });
    }

    if (fromDate && toDate) {
      queryBuilder.andWhere(
        'training.scheduledDate BETWEEN :fromDate AND :toDate',
        { fromDate, toDate },
      );
    }

    const [data, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('training.scheduledDate', 'DESC')
      .getManyAndCount();

    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findTrainingRecordByPublicId(
    publicId: string,
  ): Promise<TrainingRecord> {
    const trainingRecord = await this.trainingRecordRepository.findOne({
      where: { publicId },
      relations: ['employee', 'trainer'],
    });

    if (!trainingRecord) {
      throw new NotFoundException(`Training record not found`);
    }

    return trainingRecord;
  }

  async updateTrainingRecordByPublicId(
    publicId: string,
    updateTrainingRecordDto: UpdateTrainingRecordDto,
  ): Promise<TrainingRecord> {
    const trainingRecord = await this.findTrainingRecordByPublicId(publicId);

    Object.assign(trainingRecord, updateTrainingRecordDto);
    return await this.trainingRecordRepository.save(trainingRecord);
  }

  async completeTraining(publicId: string): Promise<TrainingRecord> {
    const trainingRecord = await this.findTrainingRecordByPublicId(publicId);

    if (trainingRecord.status === 'completed') {
      throw new BadRequestException('Training already marked as completed');
    }

    trainingRecord.status = 'completed';
    trainingRecord.completionDate = new Date();

    return await this.trainingRecordRepository.save(trainingRecord);
  }

  async removeTrainingRecordByPublicId(publicId: string): Promise<void> {
    const trainingRecord = await this.findTrainingRecordByPublicId(publicId);
    await this.trainingRecordRepository.softRemove(trainingRecord);
  }
}

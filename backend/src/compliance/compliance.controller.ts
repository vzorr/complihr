import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ParseIntPipe,
  UseInterceptors,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { ComplianceService } from './compliance.service';
import { CreateCertificationDto } from './dto/create-certification.dto';
import { UpdateCertificationDto } from './dto/update-certification.dto';
import { CertificationResponseDto } from './dto/certification-response.dto';
import { CreateTrainingRecordDto } from './dto/create-training-record.dto';
import { UpdateTrainingRecordDto } from './dto/update-training-record.dto';
import { TrainingRecordResponseDto } from './dto/training-record-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UuidValidationPipe } from '../common/pipes/uuid-validation.pipe';

@Controller('compliance')
@UseGuards(JwtAuthGuard)
@UseInterceptors(ClassSerializerInterceptor)
export class ComplianceController {
  constructor(private readonly complianceService: ComplianceService) {}

  // ============ CERTIFICATIONS ============

  @Post('certifications')
  @UseGuards(RolesGuard)
  @Roles('admin', 'hr', 'manager')
  async createCertification(
    @Body() createCertificationDto: CreateCertificationDto,
  ): Promise<CertificationResponseDto> {
    const certification =
      await this.complianceService.createCertification(createCertificationDto);
    return plainToInstance(CertificationResponseDto, certification, {
      excludeExtraneousValues: true,
    });
  }

  @Get('certifications')
  @UseGuards(RolesGuard)
  @Roles('admin', 'hr', 'manager')
  async findAllCertifications(
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('employeeId', new ParseIntPipe({ optional: true }))
    employeeId?: number,
    @Query('certificationType') certificationType?: string,
    @Query('status') status?: string,
    @Query('expiringWithinDays', new ParseIntPipe({ optional: true }))
    expiringWithinDays?: number,
  ) {
    const result = await this.complianceService.findAllCertifications(
      page,
      limit,
      employeeId,
      certificationType,
      status,
      expiringWithinDays,
    );
    return {
      ...result,
      data: result.data.map((cert) =>
        plainToInstance(CertificationResponseDto, cert, {
          excludeExtraneousValues: true,
        }),
      ),
    };
  }

  @Get('certifications/:publicId')
  @UseGuards(RolesGuard)
  @Roles('admin', 'hr', 'manager', 'employee')
  async findOneCertification(
    @Param('publicId', UuidValidationPipe) publicId: string,
  ): Promise<CertificationResponseDto> {
    const certification =
      await this.complianceService.findCertificationByPublicId(publicId);
    return plainToInstance(CertificationResponseDto, certification, {
      excludeExtraneousValues: true,
    });
  }

  @Patch('certifications/:publicId')
  @UseGuards(RolesGuard)
  @Roles('admin', 'hr', 'manager')
  async updateCertification(
    @Param('publicId', UuidValidationPipe) publicId: string,
    @Body() updateCertificationDto: UpdateCertificationDto,
  ): Promise<CertificationResponseDto> {
    const certification =
      await this.complianceService.updateCertificationByPublicId(
        publicId,
        updateCertificationDto,
      );
    return plainToInstance(CertificationResponseDto, certification, {
      excludeExtraneousValues: true,
    });
  }

  @Post('certifications/:publicId/verify')
  @UseGuards(RolesGuard)
  @Roles('admin', 'hr')
  async verifyCertification(
    @Param('publicId', UuidValidationPipe) publicId: string,
    @Body('verifierId', ParseIntPipe) verifierId: number,
  ): Promise<CertificationResponseDto> {
    const certification = await this.complianceService.verifyCertification(
      publicId,
      verifierId,
    );
    return plainToInstance(CertificationResponseDto, certification, {
      excludeExtraneousValues: true,
    });
  }

  @Delete('certifications/:publicId')
  @UseGuards(RolesGuard)
  @Roles('admin', 'hr')
  async removeCertification(
    @Param('publicId', UuidValidationPipe) publicId: string,
  ): Promise<{ message: string }> {
    await this.complianceService.removeCertificationByPublicId(publicId);
    return { message: 'Certification removed successfully' };
  }

  // ============ TRAINING RECORDS ============

  @Post('training')
  @UseGuards(RolesGuard)
  @Roles('admin', 'hr', 'manager')
  async createTrainingRecord(
    @Body() createTrainingRecordDto: CreateTrainingRecordDto,
  ): Promise<TrainingRecordResponseDto> {
    const trainingRecord = await this.complianceService.createTrainingRecord(
      createTrainingRecordDto,
    );
    return plainToInstance(TrainingRecordResponseDto, trainingRecord, {
      excludeExtraneousValues: true,
    });
  }

  @Get('training')
  @UseGuards(RolesGuard)
  @Roles('admin', 'hr', 'manager')
  async findAllTrainingRecords(
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('employeeId', new ParseIntPipe({ optional: true }))
    employeeId?: number,
    @Query('trainingType') trainingType?: string,
    @Query('status') status?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    const result = await this.complianceService.findAllTrainingRecords(
      page,
      limit,
      employeeId,
      trainingType,
      status,
      fromDate,
      toDate,
    );
    return {
      ...result,
      data: result.data.map((record) =>
        plainToInstance(TrainingRecordResponseDto, record, {
          excludeExtraneousValues: true,
        }),
      ),
    };
  }

  @Get('training/:publicId')
  @UseGuards(RolesGuard)
  @Roles('admin', 'hr', 'manager', 'employee')
  async findOneTrainingRecord(
    @Param('publicId', UuidValidationPipe) publicId: string,
  ): Promise<TrainingRecordResponseDto> {
    const trainingRecord =
      await this.complianceService.findTrainingRecordByPublicId(publicId);
    return plainToInstance(TrainingRecordResponseDto, trainingRecord, {
      excludeExtraneousValues: true,
    });
  }

  @Patch('training/:publicId')
  @UseGuards(RolesGuard)
  @Roles('admin', 'hr', 'manager')
  async updateTrainingRecord(
    @Param('publicId', UuidValidationPipe) publicId: string,
    @Body() updateTrainingRecordDto: UpdateTrainingRecordDto,
  ): Promise<TrainingRecordResponseDto> {
    const trainingRecord =
      await this.complianceService.updateTrainingRecordByPublicId(
        publicId,
        updateTrainingRecordDto,
      );
    return plainToInstance(TrainingRecordResponseDto, trainingRecord, {
      excludeExtraneousValues: true,
    });
  }

  @Post('training/:publicId/complete')
  @UseGuards(RolesGuard)
  @Roles('admin', 'hr', 'manager')
  async completeTraining(
    @Param('publicId', UuidValidationPipe) publicId: string,
  ): Promise<TrainingRecordResponseDto> {
    const trainingRecord =
      await this.complianceService.completeTraining(publicId);
    return plainToInstance(TrainingRecordResponseDto, trainingRecord, {
      excludeExtraneousValues: true,
    });
  }

  @Delete('training/:publicId')
  @UseGuards(RolesGuard)
  @Roles('admin', 'hr')
  async removeTrainingRecord(
    @Param('publicId', UuidValidationPipe) publicId: string,
  ): Promise<{ message: string }> {
    await this.complianceService.removeTrainingRecordByPublicId(publicId);
    return { message: 'Training record removed successfully' };
  }
}

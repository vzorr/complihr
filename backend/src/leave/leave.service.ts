import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { LeaveRequest } from './entities/leave-request.entity';
import { CreateLeaveRequestDto } from './dto/create-leave-request.dto';
import { UpdateLeaveRequestDto } from './dto/update-leave-request.dto';

@Injectable()
export class LeaveService {
  constructor(
    @InjectRepository(LeaveRequest)
    private readonly leaveRequestRepository: Repository<LeaveRequest>,
  ) {}

  async create(createLeaveRequestDto: CreateLeaveRequestDto): Promise<LeaveRequest> {
    // Validate dates
    if (createLeaveRequestDto.endDate < createLeaveRequestDto.startDate) {
      throw new BadRequestException('End date cannot be before start date');
    }

    // Validate total days
    if (createLeaveRequestDto.totalDays <= 0) {
      throw new BadRequestException('Total days must be greater than 0');
    }

    // Validate half day
    if (createLeaveRequestDto.isHalfDay && createLeaveRequestDto.totalDays !== 0.5) {
      throw new BadRequestException('Half day leave must be exactly 0.5 days');
    }

    const leaveRequest = this.leaveRequestRepository.create(createLeaveRequestDto);
    return (await this.leaveRequestRepository.save(leaveRequest)) as unknown as LeaveRequest;
  }

  async findAll(
    page: number = 1,
    limit: number = 50,
    employeeId?: number,
    status?: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<{
    data: LeaveRequest[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const queryBuilder = this.leaveRequestRepository
      .createQueryBuilder('leave_request')
      .leftJoinAndSelect('leave_request.employee', 'employee')
      .leftJoinAndSelect('leave_request.leaveType', 'leaveType')
      .leftJoinAndSelect('leave_request.approvedBy', 'approvedBy')
      .leftJoinAndSelect('leave_request.rejectedBy', 'rejectedBy');

    if (employeeId) {
      queryBuilder.andWhere('leave_request.employeeId = :employeeId', { employeeId });
    }

    if (status) {
      queryBuilder.andWhere('leave_request.status = :status', { status });
    }

    if (startDate && endDate) {
      queryBuilder.andWhere(
        '(leave_request.startDate BETWEEN :startDate AND :endDate OR leave_request.endDate BETWEEN :startDate AND :endDate)',
        { startDate, endDate },
      );
    }

    const [data, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('leave_request.requestedAt', 'DESC')
      .getManyAndCount();

    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findByPublicId(publicId: string): Promise<LeaveRequest> {
    const leaveRequest = await this.leaveRequestRepository.findOne({
      where: { publicId },
      relations: ['employee', 'leaveType', 'approvedBy', 'rejectedBy'],
    });

    if (!leaveRequest) {
      throw new NotFoundException(`Leave request not found`);
    }

    return leaveRequest;
  }

  async findByEmployee(
    employeeId: number,
    page: number = 1,
    limit: number = 50,
  ): Promise<{
    data: LeaveRequest[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    return this.findAll(page, limit, employeeId);
  }

  async updateByPublicId(
    publicId: string,
    updateLeaveRequestDto: UpdateLeaveRequestDto,
  ): Promise<LeaveRequest> {
    const leaveRequest = await this.findByPublicId(publicId);

    // Don't allow updates to approved/rejected/cancelled requests
    if (['approved', 'rejected', 'cancelled'].includes(leaveRequest.status)) {
      throw new BadRequestException(
        `Cannot update leave request with status: ${leaveRequest.status}`,
      );
    }

    Object.assign(leaveRequest, updateLeaveRequestDto);
    return await this.leaveRequestRepository.save(leaveRequest);
  }

  async approve(publicId: string, approverId: number): Promise<LeaveRequest> {
    const leaveRequest = await this.findByPublicId(publicId);

    if (leaveRequest.status !== 'pending') {
      throw new BadRequestException(
        `Cannot approve leave request with status: ${leaveRequest.status}`,
      );
    }

    leaveRequest.status = 'approved';
    leaveRequest.approvedById = approverId;
    leaveRequest.approvedAt = new Date();

    return await this.leaveRequestRepository.save(leaveRequest);
  }

  async reject(
    publicId: string,
    rejecterId: number,
    rejectionReason: string,
  ): Promise<LeaveRequest> {
    const leaveRequest = await this.findByPublicId(publicId);

    if (leaveRequest.status !== 'pending') {
      throw new BadRequestException(
        `Cannot reject leave request with status: ${leaveRequest.status}`,
      );
    }

    if (!rejectionReason || rejectionReason.trim().length === 0) {
      throw new BadRequestException('Rejection reason is required');
    }

    leaveRequest.status = 'rejected';
    leaveRequest.rejectedById = rejecterId;
    leaveRequest.rejectedAt = new Date();
    leaveRequest.rejectionReason = rejectionReason;

    return await this.leaveRequestRepository.save(leaveRequest);
  }

  async cancel(
    publicId: string,
    cancellationReason?: string,
  ): Promise<LeaveRequest> {
    const leaveRequest = await this.findByPublicId(publicId);

    if (['rejected', 'cancelled'].includes(leaveRequest.status)) {
      throw new BadRequestException(
        `Cannot cancel leave request with status: ${leaveRequest.status}`,
      );
    }

    // Don't allow cancellation if leave has already started
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = new Date(leaveRequest.startDate);
    startDate.setHours(0, 0, 0, 0);

    if (startDate < today) {
      throw new BadRequestException(
        'Cannot cancel leave request that has already started',
      );
    }

    leaveRequest.status = 'cancelled';
    leaveRequest.cancelledAt = new Date();
    leaveRequest.cancellationReason = cancellationReason;

    return await this.leaveRequestRepository.save(leaveRequest);
  }

  async getUpcomingLeaves(employeeId: number): Promise<LeaveRequest[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return await this.leaveRequestRepository.find({
      where: {
        employeeId,
        status: 'approved',
      },
      relations: ['leaveType'],
      order: {
        startDate: 'ASC',
      },
      take: 10,
    });
  }

  async getTeamLeaves(
    startDate: Date,
    endDate: Date,
    departmentId?: number,
  ): Promise<LeaveRequest[]> {
    const queryBuilder = this.leaveRequestRepository
      .createQueryBuilder('leave_request')
      .leftJoinAndSelect('leave_request.employee', 'employee')
      .leftJoinAndSelect('leave_request.leaveType', 'leaveType')
      .where('leave_request.status = :status', { status: 'approved' })
      .andWhere(
        '(leave_request.startDate BETWEEN :startDate AND :endDate OR leave_request.endDate BETWEEN :startDate AND :endDate)',
        { startDate, endDate },
      );

    if (departmentId) {
      queryBuilder.andWhere('employee.departmentId = :departmentId', { departmentId });
    }

    return await queryBuilder.orderBy('leave_request.startDate', 'ASC').getMany();
  }
}

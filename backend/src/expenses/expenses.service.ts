import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExpenseClaim } from './entities/expense-claim.entity';
import { CreateExpenseClaimDto } from './dto/create-expense-claim.dto';
import { UpdateExpenseClaimDto } from './dto/update-expense-claim.dto';

@Injectable()
export class ExpensesService {
  constructor(
    @InjectRepository(ExpenseClaim)
    private readonly expenseClaimRepository: Repository<ExpenseClaim>,
  ) {}

  async create(createExpenseClaimDto: CreateExpenseClaimDto): Promise<ExpenseClaim> {
    // Generate claim number
    const claimNumber = await this.generateClaimNumber();

    const expenseClaim = this.expenseClaimRepository.create({
      ...createExpenseClaimDto,
      claimNumber,
    });

    return (await this.expenseClaimRepository.save(expenseClaim)) as unknown as ExpenseClaim;
  }

  private async generateClaimNumber(): Promise<string> {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');

    const count = await this.expenseClaimRepository.count();
    const sequence = String(count + 1).padStart(6, '0');

    return `EXP-${year}${month}-${sequence}`;
  }

  async findAll(
    page: number = 1,
    limit: number = 50,
    employeeId?: number,
    status?: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<{
    data: ExpenseClaim[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const queryBuilder = this.expenseClaimRepository
      .createQueryBuilder('expense_claim')
      .leftJoinAndSelect('expense_claim.employee', 'employee')
      .leftJoinAndSelect('expense_claim.expenseCategory', 'expenseCategory')
      .leftJoinAndSelect('expense_claim.approvedBy', 'approvedBy')
      .leftJoinAndSelect('expense_claim.rejectedBy', 'rejectedBy');

    if (employeeId) {
      queryBuilder.andWhere('expense_claim.employeeId = :employeeId', { employeeId });
    }

    if (status) {
      queryBuilder.andWhere('expense_claim.status = :status', { status });
    }

    if (startDate && endDate) {
      queryBuilder.andWhere(
        'expense_claim.expenseDate BETWEEN :startDate AND :endDate',
        { startDate, endDate },
      );
    }

    const [data, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('expense_claim.submittedAt', 'DESC')
      .getManyAndCount();

    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findByPublicId(publicId: string): Promise<ExpenseClaim> {
    const claim = await this.expenseClaimRepository.findOne({
      where: { publicId },
      relations: ['employee', 'expenseCategory', 'approvedBy', 'rejectedBy'],
    });

    if (!claim) {
      throw new NotFoundException(`Expense claim not found`);
    }

    return claim;
  }

  async updateByPublicId(
    publicId: string,
    updateExpenseClaimDto: UpdateExpenseClaimDto,
  ): Promise<ExpenseClaim> {
    const claim = await this.findByPublicId(publicId);

    if (['approved', 'rejected', 'paid'].includes(claim.status)) {
      throw new BadRequestException(
        `Cannot update expense claim with status: ${claim.status}`,
      );
    }

    Object.assign(claim, updateExpenseClaimDto);
    return await this.expenseClaimRepository.save(claim);
  }

  async approve(publicId: string, approverId: number): Promise<ExpenseClaim> {
    const claim = await this.findByPublicId(publicId);

    if (claim.status !== 'pending') {
      throw new BadRequestException(
        `Cannot approve expense claim with status: ${claim.status}`,
      );
    }

    claim.status = 'approved';
    claim.approvedById = approverId;
    claim.approvedAt = new Date();

    return await this.expenseClaimRepository.save(claim);
  }

  async reject(
    publicId: string,
    rejecterId: number,
    rejectionReason: string,
  ): Promise<ExpenseClaim> {
    const claim = await this.findByPublicId(publicId);

    if (claim.status !== 'pending') {
      throw new BadRequestException(
        `Cannot reject expense claim with status: ${claim.status}`,
      );
    }

    if (!rejectionReason || rejectionReason.trim().length === 0) {
      throw new BadRequestException('Rejection reason is required');
    }

    claim.status = 'rejected';
    claim.rejectedById = rejecterId;
    claim.rejectedAt = new Date();
    claim.rejectionReason = rejectionReason;

    return await this.expenseClaimRepository.save(claim);
  }

  async markAsPaid(
    publicId: string,
    paymentReference?: string,
  ): Promise<ExpenseClaim> {
    const claim = await this.findByPublicId(publicId);

    if (claim.status !== 'approved') {
      throw new BadRequestException('Can only mark approved claims as paid');
    }

    claim.status = 'paid';
    claim.paymentStatus = 'paid';
    claim.paidAt = new Date();
    claim.paymentReference = paymentReference;

    return await this.expenseClaimRepository.save(claim);
  }
}

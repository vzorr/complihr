import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payslip } from './entities/payslip.entity';
import { CreatePayslipDto } from './dto/create-payslip.dto';
import { UpdatePayslipDto } from './dto/update-payslip.dto';

@Injectable()
export class PayrollService {
  constructor(
    @InjectRepository(Payslip)
    private readonly payslipRepository: Repository<Payslip>,
  ) {}

  async create(createPayslipDto: CreatePayslipDto): Promise<Payslip> {
    // Validate that net pay = gross pay - total deductions
    const expectedNetPay =
      createPayslipDto.grossPay - (createPayslipDto.totalDeductions || 0);

    if (
      Math.abs(expectedNetPay - createPayslipDto.netPay) > 0.01 // Allow for small rounding differences
    ) {
      throw new BadRequestException(
        `Net pay calculation mismatch. Expected ${expectedNetPay.toFixed(2)}, got ${createPayslipDto.netPay.toFixed(2)}`,
      );
    }

    const payslip = this.payslipRepository.create(createPayslipDto);
    return (await this.payslipRepository.save(payslip)) as unknown as Payslip;
  }

  async findAll(
    page: number = 1,
    limit: number = 50,
    employeeId?: number,
    paymentStatus?: string,
  ): Promise<{
    data: Payslip[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const queryBuilder = this.payslipRepository
      .createQueryBuilder('payslip')
      .leftJoinAndSelect('payslip.employee', 'employee');

    // Filter by employee ID if provided
    if (employeeId) {
      queryBuilder.andWhere('payslip.employeeId = :employeeId', {
        employeeId,
      });
    }

    // Filter by payment status if provided
    if (paymentStatus) {
      queryBuilder.andWhere('payslip.paymentStatus = :paymentStatus', {
        paymentStatus,
      });
    }

    const [data, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('payslip.createdAt', 'DESC')
      .getManyAndCount();

    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findByPublicId(publicId: string): Promise<Payslip> {
    const payslip = await this.payslipRepository.findOne({
      where: { publicId },
      relations: ['employee'],
    });

    if (!payslip) {
      throw new NotFoundException(`Payslip not found`);
    }

    return payslip;
  }

  async findByEmployee(
    employeeId: number,
    page: number = 1,
    limit: number = 50,
  ): Promise<{
    data: Payslip[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    return this.findAll(page, limit, employeeId);
  }

  async updateByPublicId(
    publicId: string,
    updatePayslipDto: UpdatePayslipDto,
  ): Promise<Payslip> {
    const payslip = await this.findByPublicId(publicId);

    // Prevent updates if already paid
    if (payslip.paymentStatus === 'paid') {
      throw new BadRequestException(
        'Cannot update a payslip that has already been paid',
      );
    }

    Object.assign(payslip, updatePayslipDto);

    // Re-validate net pay if gross pay or total deductions changed
    if (updatePayslipDto.grossPay || updatePayslipDto.totalDeductions) {
      const expectedNetPay = payslip.grossPay - payslip.totalDeductions;
      if (Math.abs(expectedNetPay - payslip.netPay) > 0.01) {
        throw new BadRequestException(
          `Net pay calculation mismatch. Expected ${expectedNetPay.toFixed(2)}, got ${payslip.netPay.toFixed(2)}`,
        );
      }
    }

    return await this.payslipRepository.save(payslip);
  }

  async updatePaymentStatus(
    publicId: string,
    paymentStatus: string,
  ): Promise<Payslip> {
    const payslip = await this.findByPublicId(publicId);

    const validStatuses = ['pending', 'processing', 'paid', 'failed'];
    if (!validStatuses.includes(paymentStatus)) {
      throw new BadRequestException(
        `Invalid payment status. Must be one of: ${validStatuses.join(', ')}`,
      );
    }

    payslip.paymentStatus = paymentStatus;
    return await this.payslipRepository.save(payslip);
  }

  async generatePdf(publicId: string): Promise<{ pdfUrl: string }> {
    const payslip = await this.findByPublicId(publicId);

    // TODO: Implement actual PDF generation using a library like pdfmake or puppeteer
    // For now, return a placeholder URL
    const pdfUrl = `/payslips/pdf/${publicId}.pdf`;

    payslip.payslipPdfUrl = pdfUrl;
    await this.payslipRepository.save(payslip);

    return { pdfUrl };
  }
}

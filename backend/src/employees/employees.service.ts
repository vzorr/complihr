import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Employee } from '../core/entities/employee.entity';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';

@Injectable()
export class EmployeesService {
  constructor(
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
  ) {}

  async create(createEmployeeDto: CreateEmployeeDto): Promise<Employee> {
    // Check if employee number already exists
    const existing = await this.employeeRepository.findOne({
      where: { employeeNumber: createEmployeeDto.employeeNumber },
    });

    if (existing) {
      throw new ConflictException(
        `Employee with number ${createEmployeeDto.employeeNumber} already exists`,
      );
    }

    // Map convenience fields to entity fields
    const employeeData = { ...createEmployeeDto } as any;

    // Map 'email' to 'workEmail' if provided
    if (createEmployeeDto.email && !createEmployeeDto.workEmail) {
      employeeData.workEmail = createEmployeeDto.email;
    }
    delete employeeData.email;

    // Map 'phoneNumber' to 'mobilePhone' if provided
    if (createEmployeeDto.phoneNumber && !createEmployeeDto.mobilePhone) {
      employeeData.mobilePhone = createEmployeeDto.phoneNumber;
    }
    delete employeeData.phoneNumber;

    // Map 'joinDate' to 'dateOfJoining' if provided
    if (createEmployeeDto.joinDate && !createEmployeeDto.dateOfJoining) {
      employeeData.dateOfJoining = createEmployeeDto.joinDate;
    }
    delete employeeData.joinDate;

    const employee = this.employeeRepository.create(employeeData);
    return await this.employeeRepository.save(employee) as unknown as Employee;
  }

  async findAll(page: number = 1, limit: number = 20): Promise<{
    data: Employee[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const [data, total] = await this.employeeRepository.findAndCount({
      relations: ['department', 'designation', 'reportingManager'],
      skip: (page - 1) * limit,
      take: limit,
      order: {
        createdAt: 'DESC',
      },
    });

    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: number): Promise<Employee> {
    const employee = await this.employeeRepository.findOne({
      where: { id },
      relations: ['department', 'designation', 'reportingManager', 'user'],
    });

    if (!employee) {
      throw new NotFoundException(`Employee with ID ${id} not found`);
    }

    return employee;
  }

  async findByPublicId(publicId: string): Promise<Employee> {
    const employee = await this.employeeRepository.findOne({
      where: { publicId },
      relations: ['department', 'designation', 'reportingManager', 'user'],
    });

    if (!employee) {
      throw new NotFoundException(`Employee not found`);
    }

    return employee;
  }

  async findByEmployeeNumber(employeeNumber: string): Promise<Employee> {
    const employee = await this.employeeRepository.findOne({
      where: { employeeNumber },
      relations: ['department', 'designation', 'reportingManager'],
    });

    if (!employee) {
      throw new NotFoundException(
        `Employee with number ${employeeNumber} not found`,
      );
    }

    return employee;
  }

  async update(
    id: number,
    updateEmployeeDto: UpdateEmployeeDto,
  ): Promise<Employee> {
    const employee = await this.findOne(id);

    // If updating employee number, check for conflicts
    if (
      updateEmployeeDto.employeeNumber &&
      updateEmployeeDto.employeeNumber !== employee.employeeNumber
    ) {
      const existing = await this.employeeRepository.findOne({
        where: { employeeNumber: updateEmployeeDto.employeeNumber },
      });

      if (existing) {
        throw new ConflictException(
          `Employee with number ${updateEmployeeDto.employeeNumber} already exists`,
        );
      }
    }

    // Map convenience fields to entity fields
    const updateData: any = { ...updateEmployeeDto };

    if (updateEmployeeDto.email) {
      updateData.workEmail = updateEmployeeDto.email;
      delete updateData.email;
    }

    if (updateEmployeeDto.phoneNumber) {
      updateData.mobilePhone = updateEmployeeDto.phoneNumber;
      delete updateData.phoneNumber;
    }

    if (updateEmployeeDto.joinDate) {
      updateData.dateOfJoining = updateEmployeeDto.joinDate;
      delete updateData.joinDate;
    }

    Object.assign(employee, updateData);
    return await this.employeeRepository.save(employee);
  }

  async updateByPublicId(
    publicId: string,
    updateEmployeeDto: UpdateEmployeeDto,
  ): Promise<Employee> {
    const employee = await this.findByPublicId(publicId);

    // If updating employee number, check for conflicts
    if (
      updateEmployeeDto.employeeNumber &&
      updateEmployeeDto.employeeNumber !== employee.employeeNumber
    ) {
      const existing = await this.employeeRepository.findOne({
        where: { employeeNumber: updateEmployeeDto.employeeNumber },
      });

      if (existing) {
        throw new ConflictException(
          `Employee with number ${updateEmployeeDto.employeeNumber} already exists`,
        );
      }
    }

    // Map convenience fields to entity fields
    const updateData: any = { ...updateEmployeeDto };

    if (updateEmployeeDto.email) {
      updateData.workEmail = updateEmployeeDto.email;
      delete updateData.email;
    }

    if (updateEmployeeDto.phoneNumber) {
      updateData.mobilePhone = updateEmployeeDto.phoneNumber;
      delete updateData.phoneNumber;
    }

    if (updateEmployeeDto.joinDate) {
      updateData.dateOfJoining = updateEmployeeDto.joinDate;
      delete updateData.joinDate;
    }

    Object.assign(employee, updateData);
    return await this.employeeRepository.save(employee);
  }

  async remove(id: number): Promise<void> {
    const employee = await this.findOne(id);
    await this.employeeRepository.softRemove(employee);
  }

  async removeByPublicId(publicId: string): Promise<void> {
    const employee = await this.findByPublicId(publicId);
    await this.employeeRepository.softRemove(employee);
  }

  async getActiveEmployees(): Promise<Employee[]> {
    return await this.employeeRepository.find({
      where: { employmentStatus: 'Active' },
      relations: ['department', 'designation'],
      order: {
        lastName: 'ASC',
        firstName: 'ASC',
      },
    });
  }

  async getEmployeesByDepartment(departmentId: number): Promise<Employee[]> {
    return await this.employeeRepository.find({
      where: { departmentId },
      relations: ['designation', 'reportingManager'],
      order: {
        lastName: 'ASC',
        firstName: 'ASC',
      },
    });
  }
}

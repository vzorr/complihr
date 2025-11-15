import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmployeesService } from './employees.service';
import { EmployeesController } from './employees.controller';
import { Employee } from '../core/entities/employee.entity';
import { Department } from '../core/entities/department.entity';
import { Designation } from '../core/entities/designation.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Employee, Department, Designation])],
  controllers: [EmployeesController],
  providers: [EmployeesService],
  exports: [EmployeesService],
})
export class EmployeesModule {}

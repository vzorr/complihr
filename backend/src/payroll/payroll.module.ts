import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payslip } from './entities/payslip.entity';
import { PayeCalculatorService } from './services/paye-calculator.service';
import { NiCalculatorService } from './services/ni-calculator.service';
import { PayrollService } from './payroll.service';
import { PayrollController } from './payroll.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Payslip]), AuthModule],
  controllers: [PayrollController],
  providers: [PayrollService, PayeCalculatorService, NiCalculatorService],
  exports: [PayrollService, PayeCalculatorService, NiCalculatorService],
})
export class PayrollModule {}

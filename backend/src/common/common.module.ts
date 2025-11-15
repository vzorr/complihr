import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IdGeneratorService } from './services/id-generator.service';
import { AuditLogService } from './services/audit-log.service';
import { AuditLog } from './entities/audit-log.entity';
import { AuditLoggingInterceptor } from './interceptors/audit-logging.interceptor';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([AuditLog])],
  providers: [IdGeneratorService, AuditLogService, AuditLoggingInterceptor],
  exports: [IdGeneratorService, AuditLogService, AuditLoggingInterceptor],
})
export class CommonModule {}

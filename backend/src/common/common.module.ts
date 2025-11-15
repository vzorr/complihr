import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IdGeneratorService } from './services/id-generator.service';
import { AuditLogService } from './services/audit-log.service';
import { AuditLogReadService } from './services/audit-log-read.service';
import { AuditLog } from './entities/audit-log.entity';
import { AuditLoggingInterceptor } from './interceptors/audit-logging.interceptor';
import { AuditLogsController } from './controllers/audit-logs.controller';
import { AuthModule } from '../auth/auth.module';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([AuditLog]), AuthModule],
  controllers: [AuditLogsController],
  providers: [
    IdGeneratorService,
    AuditLogService,
    AuditLogReadService,
    AuditLoggingInterceptor,
  ],
  exports: [
    IdGeneratorService,
    AuditLogService,
    AuditLogReadService,
    AuditLoggingInterceptor,
  ],
})
export class CommonModule {}

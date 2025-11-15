import { Controller, Get } from '@nestjs/common';

@Controller()
export class HealthController {
  @Get('health')
  getHealth() {
    return {
      status: 'ok',
      message: 'CompliHR Backend is running',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      database: 'PostgreSQL',
    };
  }

  @Get('api/health')
  getApiHealth() {
    return {
      status: 'ok',
      message: 'CompliHR API is running',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    };
  }
}

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3001',
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = process.env.PORT || 3010;
  await app.listen(port);

  console.log(`
  ╔═══════════════════════════════════════════════════════╗
  ║                                                         ║
  ║    CompliHR UK Retail HRMS Backend                    ║
  ║                                                         ║
  ║    🚀 Server running on: http://localhost:${port}      ║
  ║    📚 API Docs: http://localhost:${port}/api          ║
  ║    🗄️  Database: PostgreSQL                           ║
  ║                                                         ║
  ╚═══════════════════════════════════════════════════════╝
  `);
}

bootstrap();

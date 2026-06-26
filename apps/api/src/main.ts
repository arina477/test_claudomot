import 'reflect-metadata';
import { Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

// Placeholder AppModule — real modules (HealthModule, AuthModule, etc.) authored at B-2+
@Module({})
class AppModule {}

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const port = process.env.PORT ?? 3001;
  await app.listen(port);
}

void bootstrap();

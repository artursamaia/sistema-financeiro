/**
 * main.ts — Ponto de entrada da aplicação NestJS.
 *
 * Configurações aplicadas:
 *   - Prefixo global /api em todas as rotas
 *   - ValidationPipe: valida DTOs automaticamente, remove campos extras
 *   - CORS: permite requisições do Angular em localhost:4200
 *   - Swagger: documentação da API em /api/docs
 */
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app    = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  // Prefixo global: todas as rotas ficam sob /api
  app.setGlobalPrefix('api');

  // CORS: libera o frontend Angular em desenvolvimento
  app.enableCors({
    origin: ['http://localhost:4200'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  /**
   * ValidationPipe global:
   *   whitelist: true            → remove campos não declarados no DTO
   *   forbidNonWhitelisted: true → lança erro se enviar campos extras
   *   transform: true            → converte tipos automaticamente ("1" → 1)
   */
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Swagger — acessível em http://localhost:3000/api/docs
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Sistema Financeiro API')
    .setDescription('API do Sistema Financeiro Pessoal e Controle de Empréstimos')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = config.get<number>('PORT', 3000);
  await app.listen(port);

  logger.log(`Aplicação:  http://localhost:${port}/api`);
  logger.log(`Swagger:    http://localhost:${port}/api/docs`);
}

bootstrap();

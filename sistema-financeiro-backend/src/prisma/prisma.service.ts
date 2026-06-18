/**
 * PrismaService — Wrapper do PrismaClient para o NestJS.
 *
 * Objetivo:
 *   Disponibiliza o cliente do banco de dados como um serviço injetável,
 *   garantindo que a conexão seja aberta ao iniciar e fechada ao encerrar.
 *
 * Observação sobre o Prisma v7:
 *   O client gerado está em "generated/prisma" conforme configurado no schema.
 *   O import aponta para esse diretório.
 */
import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      // Em desenvolvimento exibe warnings e erros do Prisma no console
      log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    });
  }

  /**
   * Executado pelo NestJS ao iniciar o módulo.
   * Abre a conexão com o banco MySQL.
   */
  async onModuleInit(): Promise<void> {
    this.logger.log('Conectando ao banco de dados...');
    await this.$connect();
    this.logger.log('Banco de dados conectado com sucesso.');
  }

  /**
   * Executado pelo NestJS ao encerrar o módulo.
   * Fecha a conexão com segurança, evitando connection leaks.
   */
  async onModuleDestroy(): Promise<void> {
    this.logger.log('Encerrando conexão com o banco de dados...');
    await this.$disconnect();
  }
}

/**
 * DashboardModule — Módulo do dashboard.
 *
 * Não importa outros módulos porque o DashboardRepository acessa
 * o PrismaService diretamente (PrismaModule é global).
 * Isso evita dependências circulares e mantém o módulo simples.
 */
import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { DashboardRepository } from './dashboard.repository';

@Module({
  controllers: [DashboardController],
  providers:   [DashboardService, DashboardRepository],
})
export class DashboardModule {}

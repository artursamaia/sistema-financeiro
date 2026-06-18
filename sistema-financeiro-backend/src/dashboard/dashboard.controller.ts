/**
 * DashboardController — Endpoint único do dashboard.
 *
 * Um único GET retorna todos os dados que o frontend precisa
 * para montar a tela inicial: KPIs, alertas e gráfico.
 *
 * Rota: GET /api/dashboard
 *
 * Por que um único endpoint?
 *   O frontend carrega tudo de uma vez na tela inicial.
 *   Ter endpoints separados (um por KPI) geraria 8+ requisições
 *   simultâneas desnecessárias. Um endpoint único reduz latência
 *   e simplifica o estado no frontend.
 */
import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';
import { DashboardService } from './dashboard.service';

@ApiTags('Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  @ApiOperation({
    summary: 'Dados do dashboard',
    description:
      'Retorna todos os KPIs em uma única chamada: ' +
      'resumo do mês atual (receitas, despesas, saldo), ' +
      'situação dos empréstimos (ativos, a receber, inadimplentes) e ' +
      'histórico dos últimos 6 meses para o gráfico de barras.',
  })
  @ApiResponse({
    status: 200,
    description: 'KPIs do dashboard com dados do mês atual e histórico de 6 meses.',
    schema: {
      example: {
        month_summary: {
          year: 2026, month: 6,
          total_income: 5000, total_expense: 1800, balance: 3200,
        },
        loans_summary: {
          active_count: 3, total_lent: 8500,
          total_to_receive: 6240, overdue_installments: 2, defaulted_clients: 1,
        },
        charts: {
          last_6_months: [
            { year: 2026, month: 1, label: 'Jan/26', income: 4500, expense: 1600, balance: 2900 },
            { year: 2026, month: 6, label: 'Jun/26', income: 5000, expense: 1800, balance: 3200 },
          ],
        },
      },
    },
  })
  getDashboard(@CurrentUser() user: JwtPayload) {
    return this.dashboardService.getDashboard(user.sub);
  }
}

/**
 * DashboardService — Monta o objeto de resposta do dashboard.
 *
 * Responsabilidade: orquestrar as queries do DashboardRepository e
 * combinar os resultados em um objeto estruturado para o frontend.
 *
 * Três seções entregues:
 *   1. month_summary  → Receitas, despesas e saldo do mês atual
 *   2. loans_summary  → KPIs dos empréstimos ativos
 *   3. charts         → Dados dos últimos 6 meses para o gráfico de barras
 *
 * Performance:
 *   Todas as queries independentes são executadas em paralelo com
 *   Promise.all(), reduzindo o tempo de resposta.
 */
import { Injectable } from '@nestjs/common';
import { DashboardRepository } from './dashboard.repository';

// Tipagem da resposta final
export interface DashboardResponse {
  month_summary: {
    year:          number;
    month:         number;
    total_income:  number;
    total_expense: number;
    balance:       number; // income - expense
  };
  loans_summary: {
    active_count:          number; // empréstimos com status 'active'
    total_lent:            number; // soma dos principals ativos
    total_to_receive:      number; // saldo restante das parcelas pendentes
    overdue_installments:  number; // parcelas vencidas
    defaulted_clients:     number; // clientes com ao menos 1 parcela vencida
  };
  charts: {
    // Um ponto por mês, ordenado do mais antigo para o mais recente
    last_6_months: {
      year:    number;
      month:   number;
      label:   string;  // ex: "Jan/26" — pronto para exibir no eixo X
      income:  number;
      expense: number;
      balance: number;
    }[];
  };
}

@Injectable()
export class DashboardService {
  constructor(private readonly dashboardRepository: DashboardRepository) {}

  async getDashboard(userId: number): Promise<DashboardResponse> {
    const today = new Date();
    const year  = today.getFullYear();
    const month = today.getMonth() + 1; // getMonth() retorna 0-11

    // ── 1. Busca todos os KPIs em paralelo ─────────────────────────────────────
    // Promise.all garante que nenhuma query espera a outra terminar.
    // Tempo total ≈ tempo da query mais lenta (não soma de todas).
    const [
      totalIncome,
      totalExpense,
      activeCount,
      totalLent,
      totalToReceive,
      overdueInstallments,
      defaultedClients,
      monthlyTotals,
    ] = await Promise.all([
      this.dashboardRepository.sumIncomesByMonth(userId, year, month),
      this.dashboardRepository.sumExpensesByMonth(userId, year, month),
      this.dashboardRepository.countActiveLoans(userId),
      this.dashboardRepository.sumActiveLoansPrincipal(userId),
      this.dashboardRepository.sumPendingInstallmentsBalance(userId),
      this.dashboardRepository.countOverdueInstallments(userId),
      this.dashboardRepository.countDefaultedClients(userId),
      // Gera os últimos 6 meses (incluindo o atual)
      this.dashboardRepository.getMonthlyTotals(
        userId,
        DashboardService.buildLast6Months(year, month),
      ),
    ]);

    // ── 2. Monta os dados do gráfico ───────────────────────────────────────────
    const last6Months = monthlyTotals.map(({ year: y, month: m, income, expense }) => ({
      year:    y,
      month:   m,
      label:   DashboardService.formatMonthLabel(y, m),
      income:  DashboardService.round(income),
      expense: DashboardService.round(expense),
      balance: DashboardService.round(income - expense),
    }));

    // ── 3. Retorna a resposta estruturada ──────────────────────────────────────
    return {
      month_summary: {
        year,
        month,
        total_income:  DashboardService.round(totalIncome),
        total_expense: DashboardService.round(totalExpense),
        balance:       DashboardService.round(totalIncome - totalExpense),
      },
      loans_summary: {
        active_count:         activeCount,
        total_lent:           DashboardService.round(totalLent),
        total_to_receive:     DashboardService.round(totalToReceive),
        overdue_installments: overdueInstallments,
        defaulted_clients:    defaultedClients,
      },
      charts: { last_6_months: last6Months },
    };
  }

  // ─── Helpers privados ─────────────────────────────────────────────────────────

  /**
   * Gera um array com os últimos N meses a partir de um mês base.
   * Retorna do mais antigo para o mais recente (ordem correta para o gráfico).
   *
   * Exemplo: buildLast6Months(2026, 6) →
   *   [ {2026,1}, {2026,2}, {2026,3}, {2026,4}, {2026,5}, {2026,6} ]
   */
  private static buildLast6Months(
    year: number,
    month: number,
    count = 6,
  ): { year: number; month: number }[] {
    const months: { year: number; month: number }[] = [];

    for (let i = count - 1; i >= 0; i--) {
      // Subtrai i meses do mês atual usando Date para lidar com virada de ano
      const date = new Date(year, month - 1 - i, 1);
      months.push({
        year:  date.getFullYear(),
        month: date.getMonth() + 1,
      });
    }

    return months;
  }

  /**
   * Formata o rótulo do eixo X do gráfico.
   * Exemplo: (2026, 1) → "Jan/26"
   */
  private static formatMonthLabel(year: number, month: number): string {
    const names = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
    const shortYear = String(year).slice(-2); // 2026 → "26"
    return `${names[month - 1]}/${shortYear}`;
  }

  /** Arredonda valores monetários para 2 casas decimais. */
  private static round(value: number): number {
    return Math.round(value * 100) / 100;
  }
}

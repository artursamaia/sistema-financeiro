/**
 * DashboardRepository — Todas as queries de agregação do dashboard.
 *
 * Por que um repositório próprio?
 *   O dashboard precisa de dados de várias tabelas ao mesmo tempo
 *   (incomes, expenses, loans, installments, clients). Em vez de
 *   injetar 4 repositórios no service, centralizamos aqui as queries
 *   específicas do dashboard.
 *
 * Datas e fuso horário:
 *   Todas as queries que filtram por período usam a função DATE() do MySQL,
 *   que extrai apenas a parte da data (ignorando a hora).
 *   Isso elimina qualquer problema de fuso horário entre Node.js e MySQL,
 *   independente de como o campo foi salvo.
 *
 *   Exemplo: DATE(paid_at) >= '2026-06-01' compara só a data, não a hora.
 *
 * Cada método recebe userId para garantir isolamento multi-tenant.
 */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Helpers de data ─────────────────────────────────────────────────────────

  /**
   * Formata "YYYY-MM-DD" para o primeiro dia do mês informado.
   * Exemplo: (2026, 6, 1) → "2026-06-01"
   */
  private static toDateString(year: number, month: number, day: number): string {
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  /**
   * Retorna o primeiro dia do próximo mês como "YYYY-MM-DD".
   * Usado como limite exclusivo no filtro (DATE < nextMonth).
   * Lida com virada de ano: (2026, 12) → "2027-01-01".
   */
  private static nextMonthString(year: number, month: number): string {
    if (month === 12) return `${year + 1}-01-01`;
    return DashboardRepository.toDateString(year, month + 1, 1);
  }

  // ─── Receitas ────────────────────────────────────────────────────────────────

  /**
   * Soma total das receitas de um mês/ano específico.
   * Usa DATE(received_at) para comparação sem hora — imune a fuso horário.
   */
  async sumIncomesByMonth(userId: number, year: number, month: number): Promise<number> {
    const startStr = DashboardRepository.toDateString(year, month, 1);
    const endStr   = DashboardRepository.nextMonthString(year, month);

    const result = await this.prisma.$queryRaw<[{ total: string }]>`
      SELECT COALESCE(SUM(amount), 0) AS total
      FROM incomes
      WHERE user_id = ${userId}
        AND DATE(received_at) >= ${startStr}
        AND DATE(received_at) < ${endStr}
    `;

    return Number(result[0]?.total ?? 0);
  }

  // ─── Despesas ────────────────────────────────────────────────────────────────

  /**
   * Soma total das despesas pagas em um mês/ano específico.
   * Considera apenas despesas marcadas como pagas (is_paid = 1).
   */
  async sumExpensesByMonth(userId: number, year: number, month: number): Promise<number> {
    const startStr = DashboardRepository.toDateString(year, month, 1);
    const endStr   = DashboardRepository.nextMonthString(year, month);

    const result = await this.prisma.$queryRaw<[{ total: string }]>`
      SELECT COALESCE(SUM(amount), 0) AS total
      FROM expenses
      WHERE user_id = ${userId}
        AND is_paid = 1
        AND DATE(paid_at) >= ${startStr}
        AND DATE(paid_at) < ${endStr}
    `;

    return Number(result[0]?.total ?? 0);
  }

  // ─── Empréstimos ─────────────────────────────────────────────────────────────

  /** Conta empréstimos com status "active" do usuário. */
  async countActiveLoans(userId: number): Promise<number> {
    return this.prisma.loans.count({
      where: { user_id: userId, status: 'active' },
    });
  }

  /**
   * Soma o principal_amount de todos os empréstimos ativos.
   * Representa o total que o usuário emprestou e ainda está a receber.
   */
  async sumActiveLoansPrincipal(userId: number): Promise<number> {
    const result = await this.prisma.loans.aggregate({
      where: { user_id: userId, status: 'active' },
      _sum:  { principal_amount: true },
    });

    return Number(result._sum?.principal_amount ?? 0);
  }

  // ─── Parcelas ────────────────────────────────────────────────────────────────

  /**
   * Soma o saldo ainda a receber (amount - paid_amount) de todas as
   * parcelas pendentes ou vencidas. Considera pagamentos parciais.
   *
   * Raw query porque o Prisma aggregate não suporta SUM de expressão
   * entre dois campos diferentes.
   */
  async sumPendingInstallmentsBalance(userId: number): Promise<number> {
    const result = await this.prisma.$queryRaw<[{ total: string }]>`
      SELECT COALESCE(SUM(i.amount - i.paid_amount), 0) AS total
      FROM installments i
      INNER JOIN loans l ON l.id = i.loan_id
      WHERE l.user_id = ${userId}
        AND i.status IN ('pending', 'partial', 'overdue')
    `;

    return Number(result[0]?.total ?? 0);
  }

  /** Conta parcelas com status "overdue" do usuário. */
  async countOverdueInstallments(userId: number): Promise<number> {
    return this.prisma.installments.count({
      where: {
        status: 'overdue',
        loans:  { user_id: userId },
      },
    });
  }

  /**
   * Conta clientes distintos com ao menos uma parcela vencida.
   * Um cliente inadimplente pode ter várias parcelas — conta apenas 1.
   */
  async countDefaultedClients(userId: number): Promise<number> {
    const result = await this.prisma.$queryRaw<[{ total: string }]>`
      SELECT COUNT(DISTINCT l.client_id) AS total
      FROM installments i
      INNER JOIN loans l ON l.id = i.loan_id
      WHERE l.user_id = ${userId}
        AND i.status = 'overdue'
    `;

    return Number(result[0]?.total ?? 0);
  }

  // ─── Gráfico dos últimos N meses ─────────────────────────────────────────────

  /**
   * Retorna receitas e despesas agrupadas por mês para um período.
   * Executa as queries de cada mês em paralelo para melhor performance.
   *
   * @param userId  - Usuário autenticado
   * @param months  - Array de { year, month } a consultar (ordenado do mais antigo)
   */
  async getMonthlyTotals(
    userId: number,
    months: { year: number; month: number }[],
  ): Promise<{ year: number; month: number; income: number; expense: number }[]> {
    return Promise.all(
      months.map(async ({ year, month }) => {
        const [income, expense] = await Promise.all([
          this.sumIncomesByMonth(userId, year, month),
          this.sumExpensesByMonth(userId, year, month),
        ]);

        return { year, month, income, expense };
      }),
    );
  }
}

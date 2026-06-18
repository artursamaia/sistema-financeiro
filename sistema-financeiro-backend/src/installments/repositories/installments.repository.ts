/**
 * InstallmentsRepository — Acesso a dados das parcelas.
 *
 * Parcelas não são criadas por este módulo — elas são geradas
 * automaticamente junto com o empréstimo (ver LoansRepository).
 *
 * Responsabilidades:
 *   - Buscar parcelas de um empréstimo
 *   - Buscar parcelas vencidas não pagas (para dashboard/alertas)
 *   - Atualizar status de uma parcela (pendente → parcial → pago)
 *   - Atualizar paid_amount após um pagamento
 */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { installments, installments_status, Prisma } from '@prisma/client';

// Tipo rico: parcela com dados do empréstimo e do cliente
export type InstallmentWithLoan = installments & {
  loans: {
    id: number;
    principal_amount: number;
    interest_rate: number;
    clients: { id: number; name: string };
  };
};

@Injectable()
export class InstallmentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Lista todas as parcelas de um empréstimo específico.
   * Verifica se o empréstimo pertence ao usuário antes de listar.
   */
  async findByLoan(loanId: number, userId: number): Promise<installments[]> {
    return this.prisma.installments.findMany({
      where: {
        loan_id: loanId,
        loans: { user_id: userId }, // garante que o empréstimo pertence ao usuário
      },
      orderBy: { installment_number: 'asc' },
    });
  }

  /**
   * Busca uma parcela por ID verificando se pertence ao usuário.
   */
  async findOne(id: number, userId: number): Promise<InstallmentWithLoan | null> {
    return this.prisma.installments.findFirst({
      where: {
        id,
        loans: { user_id: userId },
      },
      include: {
        loans: {
          select: {
            id: true,
            principal_amount: true,
            interest_rate: true,
            clients: { select: { id: true, name: true } },
          },
        },
      },
    }) as unknown as Promise<InstallmentWithLoan | null>;
  }

  /**
   * Busca parcelas vencidas (due_date < hoje) e ainda não pagas.
   * Usado pelo dashboard para alertas de inadimplência.
   *
   * @param userId  - Filtra apenas empréstimos do usuário
   * @param today   - Data de referência (normalmente hoje)
   */
  async findOverdue(userId: number, today: Date): Promise<InstallmentWithLoan[]> {
    return this.prisma.installments.findMany({
      where: {
        loans:    { user_id: userId },
        due_date: { lt: today },
        status:   { in: ['pending', 'partial'] },
      },
      include: {
        loans: {
          select: {
            id: true,
            principal_amount: true,
            interest_rate: true,
            clients: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { due_date: 'asc' },
    }) as unknown as Promise<InstallmentWithLoan[]>;
  }

  /**
   * Marca parcelas vencidas como "overdue".
   * Deve ser chamado por um job/cron diário ou antes de gerar relatórios.
   *
   * @param today - Todas as parcelas com due_date < today e status pending → overdue
   */
  async markOverdue(today: Date): Promise<number> {
    const result = await this.prisma.installments.updateMany({
      where: {
        due_date: { lt: today },
        status:   'pending',
      },
      data: { status: 'overdue' },
    });

    return result.count;
  }

  /**
   * Atualiza o valor pago e o status de uma parcela.
   * Chamado pelo PaymentsService após registrar um pagamento.
   *
   * @param id          - ID da parcela
   * @param paidAmount  - Novo valor total pago
   * @param status      - Novo status (partial ou paid)
   */
  async updatePayment(
    id: number,
    paidAmount: number,
    status: installments_status,
  ): Promise<installments> {
    return this.prisma.installments.update({
      where: { id },
      data: {
        paid_amount: paidAmount,
        status,
        ...(status === 'paid' && { paid_at: new Date() }),
      },
    });
  }

  /**
   * Soma todos os valores a receber de um usuário (parcelas pendentes/vencidas).
   * Usado pelo dashboard para calcular o saldo a receber.
   */
  async sumPendingByUser(userId: number): Promise<number> {
    const result = await this.prisma.installments.aggregate({
      where: {
        loans:  { user_id: userId },
        status: { in: ['pending', 'partial', 'overdue'] },
      },
      _sum: { amount: true },
    });

    return Number(result._sum.amount ?? 0);
  }
}

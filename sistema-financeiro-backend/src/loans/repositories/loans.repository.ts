/**
 * LoansRepository — Camada de acesso a dados para empréstimos.
 *
 * Responsabilidades:
 *   - CRUD de empréstimos
 *   - Criação em transação atômica (loan + installments juntos)
 *   - Verificação de status para regras de negócio
 *
 * Transação atômica:
 *   A criação do empréstimo e de todas as suas parcelas ocorre
 *   dentro de prisma.$transaction(). Se qualquer inserção falhar,
 *   tudo é revertido — nunca fica empréstimo sem parcelas.
 */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { loans, loans_status, Prisma } from '@prisma/client';
import { CreateLoanDto } from '../dto/create-loan.dto';
import { UpdateLoanDto } from '../dto/update-loan.dto';
import { InstallmentData } from '../../common/utils/loan-calculator.util';

// Tipo rico: empréstimo com dados do cliente e resumo das parcelas
export type LoanWithDetails = loans & {
  clients: { id: number; name: string; cpf: string | null };
  installments: { id: number; installment_number: number; due_date: Date; amount: number; status: string; paid_amount: number }[];
};

@Injectable()
export class LoansRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    userId: number,
    status?: loans_status,
    clientId?: number,
  ): Promise<LoanWithDetails[]> {
    const where: Prisma.loansWhereInput = {
      user_id: userId,
      ...(status   && { status }),
      ...(clientId && { client_id: clientId }),
    };

    return this.prisma.loans.findMany({
      where,
      include: {
        clients: { select: { id: true, name: true, cpf: true } },
        // Retorna resumo das parcelas (sem os pagamentos detalhados)
        installments: {
          select: {
            id: true,
            installment_number: true,
            due_date: true,
            amount: true,
            status: true,
            paid_amount: true,
          },
          orderBy: { installment_number: 'asc' },
        },
      },
      orderBy: { start_date: 'desc' },
    }) as unknown as Promise<LoanWithDetails[]>;
  }

  async findOne(id: number, userId: number): Promise<LoanWithDetails | null> {
    return this.prisma.loans.findFirst({
      where: { id, user_id: userId },
      include: {
        clients: { select: { id: true, name: true, cpf: true } },
        installments: {
          select: {
            id: true,
            installment_number: true,
            due_date: true,
            amount: true,
            status: true,
            paid_amount: true,
          },
          orderBy: { installment_number: 'asc' },
        },
      },
    }) as unknown as Promise<LoanWithDetails | null>;
  }

  /**
   * Cria o empréstimo e todas as parcelas em uma única transação atômica.
   *
   * Atomicidade garante:
   *   - Nunca existe empréstimo sem parcelas
   *   - Nunca existem parcelas sem empréstimo pai
   *   - Falha em qualquer ponto reverte tudo (rollback automático)
   *
   * @param userId       - ID do usuário credor
   * @param dto          - Dados do empréstimo
   * @param totalAmount  - Valor total calculado (principal + juros)
   * @param installments - Array de parcelas calculadas pelo LoanCalculatorUtil
   */
  async createWithInstallments(
    userId: number,
    dto: CreateLoanDto,
    totalAmount: number,
    installments: InstallmentData[],
  ): Promise<loans> {
    return this.prisma.$transaction(async (tx) => {
      // 1. Cria o empréstimo
      const loan = await tx.loans.create({
        data: {
          user_id:            userId,
          client_id:          dto.client_id,
          principal_amount:   dto.principal_amount,
          interest_rate:      dto.interest_rate,
          total_amount:       totalAmount,
          installments_count: dto.installments_count,
          start_date:         new Date(dto.start_date),
          first_due_date:     new Date(dto.first_due_date),
          notes:              dto.notes,
        },
      });

      // 2. Cria todas as parcelas vinculadas ao empréstimo recém-criado
      await tx.installments.createMany({
        data: installments.map((inst) => ({
          loan_id:            loan.id,
          installment_number: inst.installment_number,
          due_date:           inst.due_date,
          amount:             inst.amount,
          status:             'pending' as const,
          paid_amount:        0,
        })),
      });

      return loan;
    });
  }

  /**
   * Atualiza apenas status e notes do empréstimo.
   * Valores financeiros são imutáveis após a criação.
   */
  async update(id: number, dto: UpdateLoanDto): Promise<loans> {
    return this.prisma.loans.update({
      where: { id },
      data: {
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.notes  !== undefined && { notes: dto.notes }),
      },
    });
  }

  /**
   * Marca o empréstimo como quitado (paid).
   * Chamado automaticamente pelo PaymentsService quando
   * todas as parcelas estiverem pagas.
   */
  async markAsPaid(loanId: number): Promise<void> {
    await this.prisma.loans.update({
      where: { id: loanId },
      data:  { status: 'paid' },
    });
  }

  /**
   * Conta parcelas pendentes/parciais de um empréstimo.
   * Usado para verificar se o empréstimo foi quitado.
   */
  async countPendingInstallments(loanId: number): Promise<number> {
    return this.prisma.installments.count({
      where: {
        loan_id: loanId,
        status:  { in: ['pending', 'partial', 'overdue'] },
      },
    });
  }
}

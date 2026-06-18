/**
 * InstallmentsService — Regras de negócio para parcelas.
 *
 * Parcelas não são criadas manualmente — são geradas pelo LoansService.
 * Este serviço oferece consultas e utilitários de atualização de status.
 *
 * Exporta updatePayment() para uso do PaymentsService,
 * e markOverdue() para uso de jobs/rotinas de manutenção.
 */
import { Injectable, NotFoundException } from '@nestjs/common';
import {
  InstallmentsRepository,
  InstallmentWithLoan,
} from './repositories/installments.repository';
import { installments, installments_status } from '@prisma/client';

@Injectable()
export class InstallmentsService {
  constructor(
    private readonly installmentsRepository: InstallmentsRepository,
  ) {}

  async findByLoan(loanId: number, userId: number): Promise<installments[]> {
    return this.installmentsRepository.findByLoan(loanId, userId);
  }

  async findOne(id: number, userId: number): Promise<InstallmentWithLoan> {
    const installment = await this.installmentsRepository.findOne(id, userId);

    if (!installment) {
      throw new NotFoundException(`Parcela #${id} não encontrada.`);
    }

    return installment;
  }

  async findOverdue(userId: number): Promise<InstallmentWithLoan[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // compara apenas a data, não o horário
    return this.installmentsRepository.findOverdue(userId, today);
  }

  /**
   * Marca como "overdue" todas as parcelas vencidas (due_date < hoje, status = pending).
   * Retorna a quantidade de parcelas atualizadas.
   */
  async markOverdue(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return this.installmentsRepository.markOverdue(today);
  }

  /**
   * Atualiza o valor pago e o status de uma parcela.
   * Chamado exclusivamente pelo PaymentsService.
   *
   * @param id         - ID da parcela
   * @param paidAmount - Novo total pago nesta parcela
   * @param status     - 'partial' se pago parcialmente, 'paid' se quitada
   */
  async updatePayment(
    id: number,
    paidAmount: number,
    status: installments_status,
  ): Promise<installments> {
    return this.installmentsRepository.updatePayment(id, paidAmount, status);
  }

  async sumPendingByUser(userId: number): Promise<number> {
    return this.installmentsRepository.sumPendingByUser(userId);
  }
}

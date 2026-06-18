/**
 * PaymentsService — Regras de negócio para registrar pagamentos.
 *
 * Fluxo completo ao registrar um pagamento:
 *   1. Valida que a parcela pertence ao usuário
 *   2. Valida que a parcela não está já quitada
 *   3. Persiste o pagamento
 *   4. Recalcula o total pago da parcela (soma de todos os pagamentos)
 *   5. Atualiza status da parcela (partial ou paid)
 *   6. Se parcela foi paga, verifica se o empréstimo foi totalmente quitado
 *
 * Pagamento não extrapola o valor da parcela:
 *   Se paid + novo > parcela.amount, o pagamento é rejeitado.
 *   O usuário deve informar exatamente o valor restante.
 */
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PaymentsRepository } from './repositories/payments.repository';
import { InstallmentsService } from '../installments/installments.service';
import { LoansService } from '../loans/loans.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { payments } from '@prisma/client';
import { LoanCalculatorUtil } from '../common/utils/loan-calculator.util';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly paymentsRepository: PaymentsRepository,
    private readonly installmentsService: InstallmentsService,
    private readonly loansService: LoansService,
  ) {}

  async create(userId: number, dto: CreatePaymentDto): Promise<payments> {
    // 1. Busca a parcela e confirma que pertence ao usuário
    const installment = await this.installmentsService.findOne(
      dto.installment_id,
      userId,
    );

    // 2. Não permite pagar uma parcela já quitada
    if (installment.status === 'paid') {
      throw new BadRequestException(
        `A parcela #${installment.installment_number} já está quitada.`,
      );
    }

    // 3. Calcula o saldo restante da parcela (amount - paid_amount)
    const remaining = LoanCalculatorUtil.round(
      Number(installment.amount) - Number(installment.paid_amount),
    );

    // 4. Não permite pagar mais do que o saldo restante
    if (dto.amount > remaining) {
      throw new BadRequestException(
        `O valor informado (${dto.amount}) é maior que o saldo restante da parcela (${remaining}).`,
      );
    }

    // 5. Persiste o pagamento
    const payment = await this.paymentsRepository.create(userId, dto);

    // 6. Recalcula o total pago (soma de todos os pagamentos desta parcela)
    const totalPaid = await this.paymentsRepository.sumByInstallment(
      dto.installment_id,
    );

    // 7. Determina novo status da parcela
    const installmentAmount = Number(installment.amount);
    const isPaid   = LoanCalculatorUtil.round(totalPaid) >= installmentAmount;
    const newStatus = isPaid ? 'paid' : 'partial';

    // 8. Atualiza parcela com novo paid_amount e status
    await this.installmentsService.updatePayment(
      dto.installment_id,
      LoanCalculatorUtil.round(totalPaid),
      newStatus as any,
    );

    // 9. Se a parcela foi quitada, verifica se o empréstimo foi totalmente quitado
    if (isPaid) {
      await this.loansService.checkAndMarkAsPaid(installment.loans.id);
    }

    return payment;
  }

  async findByInstallment(
    installmentId: number,
    userId: number,
  ): Promise<payments[]> {
    // Confirma que a parcela pertence ao usuário antes de listar os pagamentos
    await this.installmentsService.findOne(installmentId, userId);

    return this.paymentsRepository.findByInstallment(installmentId, userId);
  }
}

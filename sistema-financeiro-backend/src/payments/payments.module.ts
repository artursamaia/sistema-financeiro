/**
 * PaymentsModule — Módulo de pagamentos.
 *
 * Importa InstallmentsModule e LoansModule porque o PaymentsService
 * precisa:
 *   - InstallmentsService: verificar e atualizar status da parcela
 *   - LoansService: verificar se o empréstimo foi totalmente quitado
 */
import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { PaymentsRepository } from './repositories/payments.repository';
import { InstallmentsModule } from '../installments/installments.module';
import { LoansModule } from '../loans/loans.module';

@Module({
  imports: [InstallmentsModule, LoansModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, PaymentsRepository],
})
export class PaymentsModule {}

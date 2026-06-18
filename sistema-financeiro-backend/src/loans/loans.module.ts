/**
 * LoansModule — Módulo de empréstimos.
 *
 * Importa ClientsModule para que o LoansService possa verificar
 * se o cliente pertence ao usuário antes de criar o empréstimo.
 *
 * Exporta LoansService para que o PaymentsModule possa chamar
 * checkAndMarkAsPaid() após registrar um pagamento.
 */
import { Module } from '@nestjs/common';
import { LoansController } from './loans.controller';
import { LoansService } from './loans.service';
import { LoansRepository } from './repositories/loans.repository';
import { ClientsModule } from '../clients/clients.module';
import { InstallmentsModule } from '../installments/installments.module';

@Module({
  imports: [ClientsModule, InstallmentsModule],
  controllers: [LoansController],
  providers: [LoansService, LoansRepository],
  exports: [LoansService],
})
export class LoansModule {}

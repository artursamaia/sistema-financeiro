/**
 * InstallmentsModule — Módulo de parcelas.
 *
 * Exporta InstallmentsService para uso pelo PaymentsModule,
 * que precisa chamar updatePayment() após registrar um pagamento.
 */
import { Module } from '@nestjs/common';
import { InstallmentsController } from './installments.controller';
import { InstallmentsService } from './installments.service';
import { InstallmentsRepository } from './repositories/installments.repository';

@Module({
  controllers: [InstallmentsController],
  providers: [InstallmentsService, InstallmentsRepository],
  exports: [InstallmentsService],
})
export class InstallmentsModule {}

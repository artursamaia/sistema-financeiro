import { Module } from '@nestjs/common';
import { IncomesController } from './incomes.controller';
import { IncomesService } from './incomes.service';
import { IncomesRepository } from './repositories/incomes.repository';

@Module({
  controllers: [IncomesController],
  providers: [IncomesService, IncomesRepository],
  exports: [IncomesService], // Exportado para o DashboardModule
})
export class IncomesModule {}

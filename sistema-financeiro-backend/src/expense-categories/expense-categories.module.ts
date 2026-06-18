import { Module } from '@nestjs/common';
import { ExpenseCategoriesController } from './expense-categories.controller';
import { ExpenseCategoriesService } from './expense-categories.service';
import { ExpenseCategoriesRepository } from './repositories/expense-categories.repository';

@Module({
  controllers: [ExpenseCategoriesController],
  providers: [ExpenseCategoriesService, ExpenseCategoriesRepository],
  exports: [ExpenseCategoriesService],
})
export class ExpenseCategoriesModule {}

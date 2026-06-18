/**
 * ExpensesService — Lógica de negócio para despesas financeiras.
 *
 * Regras de negócio:
 *   - Um usuário só acessa suas próprias despesas
 *   - Ao marcar como paga (is_paid = true), paid_at é preenchido
 *     automaticamente com a data atual se não for informado
 *   - Despesas fixas (is_fixed = true) representam recorrências mensais
 */
import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { ExpensesRepository, ExpenseWithCategory } from './repositories/expenses.repository';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { expenses } from '@prisma/client';

@Injectable()
export class ExpensesService {
  private readonly logger = new Logger(ExpensesService.name);

  constructor(private readonly expensesRepository: ExpensesRepository) {}

  async findAll(
    userId: number,
    month?: number,
    year?: number,
    isPaid?: boolean,
    isFixed?: boolean,
    categoryId?: number,
  ): Promise<ExpenseWithCategory[]> {
    return this.expensesRepository.findAll(userId, month, year, isPaid, isFixed, categoryId);
  }

  async findOne(id: number, userId: number): Promise<ExpenseWithCategory> {
    const expense = await this.expensesRepository.findOne(id, userId);
    if (!expense) throw new NotFoundException(`Despesa #${id} não encontrada.`);
    return expense;
  }

  async create(userId: number, dto: CreateExpenseDto): Promise<expenses> {
    // Se marcada como paga mas sem data de pagamento, usa a data atual
    if (dto.is_paid && !dto.paid_at) {
      dto.paid_at = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    }

    const expense = await this.expensesRepository.create(userId, dto);
    this.logger.log(`Despesa criada: R$ ${dto.amount} - ${dto.description} (usuário ${userId})`);
    return expense;
  }

  async update(id: number, userId: number, dto: UpdateExpenseDto): Promise<expenses> {
    await this.findOne(id, userId);

    // Regra: ao marcar como paga sem data, preenche com hoje
    if (dto.is_paid === true && !dto.paid_at) {
      dto.paid_at = new Date().toISOString().split('T')[0];
    }

    // Regra: ao desmarcar como paga, limpa a data de pagamento
    if (dto.is_paid === false) {
      dto.paid_at = undefined;
    }

    return this.expensesRepository.update(id, dto);
  }

  async remove(id: number, userId: number): Promise<void> {
    await this.findOne(id, userId);
    await this.expensesRepository.remove(id);
    this.logger.log(`Despesa #${id} removida (usuário ${userId})`);
  }

  async sumByMonth(userId: number, month: number, year: number): Promise<number> {
    return this.expensesRepository.sumByMonth(userId, month, year);
  }
}

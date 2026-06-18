/**
 * IncomesService — Lógica de negócio para receitas financeiras.
 *
 * Regras de negócio:
 *   - Um usuário só acessa suas próprias receitas
 *   - O valor da receita deve ser positivo (validado no DTO)
 *   - Receitas podem ser recorrentes (is_recurring = true)
 */
import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { incomes } from '@prisma/client';
import { IncomesRepository } from './repositories/incomes.repository';
import { CreateIncomeDto } from './dto/create-income.dto';
import { UpdateIncomeDto } from './dto/update-income.dto';

@Injectable()
export class IncomesService {
  private readonly logger = new Logger(IncomesService.name);

  constructor(private readonly incomesRepository: IncomesRepository) {}

  async findAll(userId: number, month?: number, year?: number): Promise<incomes[]> {
    return this.incomesRepository.findAll(userId, month, year);
  }

  async findOne(id: number, userId: number): Promise<incomes> {
    const income = await this.incomesRepository.findOne(id, userId);
    if (!income) throw new NotFoundException(`Receita #${id} não encontrada.`);
    return income;
  }

  async create(userId: number, dto: CreateIncomeDto): Promise<incomes> {
    const income = await this.incomesRepository.create(userId, dto);
    this.logger.log(`Receita criada: R$ ${dto.amount} - ${dto.description} (usuário ${userId})`);
    return income;
  }

  async update(id: number, userId: number, dto: UpdateIncomeDto): Promise<incomes> {
    await this.findOne(id, userId); // Valida existência e propriedade
    return this.incomesRepository.update(id, dto);
  }

  async remove(id: number, userId: number): Promise<void> {
    await this.findOne(id, userId);
    await this.incomesRepository.remove(id);
    this.logger.log(`Receita #${id} removida (usuário ${userId})`);
  }

  /** Retorna o total de receitas de um mês. Usado pelo DashboardService. */
  async sumByMonth(userId: number, month: number, year: number): Promise<number> {
    return this.incomesRepository.sumByMonth(userId, month, year);
  }
}

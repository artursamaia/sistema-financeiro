/**
 * ExpenseCategoriesService — Lógica de negócio para categorias de despesa.
 *
 * Regras de negócio:
 *   - Nome deve ser único por usuário
 *   - Categoria com despesas vinculadas não pode ser excluída
 *     (use is_active = false para desativar em vez de excluir)
 */
import {
  Injectable, NotFoundException, ConflictException,
  BadRequestException, Logger,
} from '@nestjs/common';
import { expense_categories } from '@prisma/client';
import { ExpenseCategoriesRepository } from './repositories/expense-categories.repository';
import { CreateExpenseCategoryDto } from './dto/create-expense-category.dto';
import { UpdateExpenseCategoryDto } from './dto/update-expense-category.dto';

@Injectable()
export class ExpenseCategoriesService {
  private readonly logger = new Logger(ExpenseCategoriesService.name);

  constructor(private readonly repo: ExpenseCategoriesRepository) {}

  async findAll(userId: number, onlyActive?: boolean): Promise<expense_categories[]> {
    return this.repo.findAll(userId, onlyActive);
  }

  async findOne(id: number, userId: number): Promise<expense_categories> {
    const cat = await this.repo.findOne(id, userId);
    if (!cat) throw new NotFoundException(`Categoria #${id} não encontrada.`);
    return cat;
  }

  async create(userId: number, dto: CreateExpenseCategoryDto): Promise<expense_categories> {
    const existing = await this.repo.findByName(dto.name, userId);
    if (existing) {
      throw new ConflictException(`Categoria "${dto.name}" já existe.`);
    }

    const cat = await this.repo.create(userId, dto);
    this.logger.log(`Categoria criada: "${cat.name}" (usuário ${userId})`);
    return cat;
  }

  async update(id: number, userId: number, dto: UpdateExpenseCategoryDto): Promise<expense_categories> {
    await this.findOne(id, userId);

    // Verifica nome duplicado apenas se foi alterado
    if (dto.name) {
      const existing = await this.repo.findByName(dto.name, userId);
      if (existing && existing.id !== id) {
        throw new ConflictException(`Categoria "${dto.name}" já existe.`);
      }
    }

    return this.repo.update(id, dto);
  }

  async remove(id: number, userId: number): Promise<void> {
    await this.findOne(id, userId);

    const count = await this.repo.countExpenses(id);
    if (count > 0) {
      throw new BadRequestException(
        `Não é possível excluir: categoria possui ${count} despesa(s) vinculada(s). Desative-a em vez de excluir.`,
      );
    }

    await this.repo.remove(id);
  }
}

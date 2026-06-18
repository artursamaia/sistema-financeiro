/**
 * ExpenseCategoriesRepository — Acesso a dados de categorias de despesa.
 *
 * Isolamento por user_id garante que categorias de um usuário
 * não vazem para outro.
 */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { expense_categories } from '@prisma/client';
import { CreateExpenseCategoryDto } from '../dto/create-expense-category.dto';
import { UpdateExpenseCategoryDto } from '../dto/update-expense-category.dto';

@Injectable()
export class ExpenseCategoriesRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** Lista categorias ativas do usuário, ordenadas por nome. */
  async findAll(userId: number, onlyActive = false): Promise<expense_categories[]> {
    return this.prisma.expense_categories.findMany({
      where: {
        user_id: userId,
        ...(onlyActive && { is_active: true }),
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: number, userId: number): Promise<expense_categories | null> {
    return this.prisma.expense_categories.findFirst({
      where: { id, user_id: userId },
    });
  }

  /** Verifica se já existe categoria com mesmo nome para o usuário. */
  async findByName(name: string, userId: number): Promise<expense_categories | null> {
    return this.prisma.expense_categories.findFirst({
      where: { name, user_id: userId },
    });
  }

  async create(userId: number, dto: CreateExpenseCategoryDto): Promise<expense_categories> {
    return this.prisma.expense_categories.create({
      data: {
        user_id: userId,
        name: dto.name,
        color: dto.color,
        icon: dto.icon,
        is_active: dto.is_active ?? true,
      },
    });
  }

  async update(id: number, dto: UpdateExpenseCategoryDto): Promise<expense_categories> {
    return this.prisma.expense_categories.update({
      where: { id },
      data: {
        ...(dto.name      !== undefined && { name: dto.name }),
        ...(dto.color     !== undefined && { color: dto.color }),
        ...(dto.icon      !== undefined && { icon: dto.icon }),
        ...(dto.is_active !== undefined && { is_active: dto.is_active }),
      },
    });
  }

  async remove(id: number): Promise<expense_categories> {
    return this.prisma.expense_categories.delete({ where: { id } });
  }

  /** Conta despesas vinculadas à categoria. Impede exclusão se > 0. */
  async countExpenses(categoryId: number): Promise<number> {
    return this.prisma.expenses.count({ where: { category_id: categoryId } });
  }
}

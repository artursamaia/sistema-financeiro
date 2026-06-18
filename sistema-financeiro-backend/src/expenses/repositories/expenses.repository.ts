/**
 * ExpensesRepository — Camada de acesso a dados para despesas.
 *
 * Suporta filtros por:
 *   - Período (mês/ano)
 *   - Tipo (fixa/variável)
 *   - Status de pagamento (paga/em aberto)
 *   - Categoria
 *
 * Inclui o relacionamento com expense_categories para retornar
 * nome e cor da categoria junto com cada despesa.
 */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { expenses, Prisma } from '@prisma/client';
import { CreateExpenseDto } from '../dto/create-expense.dto';
import { UpdateExpenseDto } from '../dto/update-expense.dto';
import { DateUtil } from '../../common/utils/date.util';

// Tipo que inclui a categoria junto com a despesa
export type ExpenseWithCategory = expenses & {
  expense_categories: { id: number; name: string; color: string | null; icon: string | null } | null;
};

@Injectable()
export class ExpensesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    userId: number,
    month?: number,
    year?: number,
    isPaid?: boolean,
    isFixed?: boolean,
    categoryId?: number,
  ): Promise<ExpenseWithCategory[]> {
    const where: Prisma.expensesWhereInput = { user_id: userId };

    if (month && year) {
      const { start, end } = DateUtil.monthRange(year, month);
      where.due_date = { gte: start, lt: end };
    }

    if (isPaid  !== undefined) where.is_paid  = isPaid;
    if (isFixed !== undefined) where.is_fixed = isFixed;
    if (categoryId)            where.category_id = categoryId;

    return this.prisma.expenses.findMany({
      where,
      include: {
        // Traz nome, cor e ícone da categoria junto
        expense_categories: {
          select: { id: true, name: true, color: true, icon: true },
        },
      },
      orderBy: { due_date: 'asc' }, // Próximos vencimentos primeiro
    }) as Promise<ExpenseWithCategory[]>;
  }

  async findOne(id: number, userId: number): Promise<ExpenseWithCategory | null> {
    return this.prisma.expenses.findFirst({
      where: { id, user_id: userId },
      include: {
        expense_categories: {
          select: { id: true, name: true, color: true, icon: true },
        },
      },
    }) as Promise<ExpenseWithCategory | null>;
  }

  async create(userId: number, dto: CreateExpenseDto): Promise<expenses> {
    return this.prisma.expenses.create({
      data: {
        user_id:     userId,
        category_id: dto.category_id,
        description: dto.description,
        amount:      dto.amount,
        due_date:    DateUtil.parseLocalDate(dto.due_date),
        paid_at:     DateUtil.parseLocalDate(dto.paid_at),
        is_fixed:    dto.is_fixed  ?? false,
        is_paid:     dto.is_paid   ?? false,
        notes:       dto.notes,
      },
    });
  }

  async update(id: number, dto: UpdateExpenseDto): Promise<expenses> {
    return this.prisma.expenses.update({
      where: { id },
      data: {
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.amount      !== undefined && { amount: dto.amount }),
        ...(dto.due_date !== undefined && { due_date: DateUtil.parseLocalDate(dto.due_date) }),
        ...(dto.paid_at  !== undefined && { paid_at:  DateUtil.parseLocalDate(dto.paid_at) }),
        ...(dto.category_id !== undefined && { category_id: dto.category_id }),
        ...(dto.is_fixed    !== undefined && { is_fixed: dto.is_fixed }),
        ...(dto.is_paid     !== undefined && { is_paid: dto.is_paid }),
        ...(dto.notes       !== undefined && { notes: dto.notes }),
      },
    });
  }

  async remove(id: number): Promise<expenses> {
    return this.prisma.expenses.delete({ where: { id } });
  }

  /**
   * Soma total das despesas de um mês/ano.
   * Usado pelo DashboardService.
   */
  async sumByMonth(userId: number, month: number, year: number): Promise<number> {
    const { start, end } = DateUtil.monthRange(year, month);

    const result = await this.prisma.expenses.aggregate({
      where: {
        user_id:  userId,
        due_date: { gte: start, lt: end },
      },
      _sum: { amount: true },
    });

    return Number(result._sum.amount ?? 0);
  }
}

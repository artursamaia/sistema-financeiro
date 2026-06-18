/**
 * IncomesRepository — Camada de acesso a dados para receitas.
 *
 * Todas as queries garantem isolamento por user_id.
 * Suporte a filtro por período (mês/ano) para relatórios mensais.
 */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { incomes, Prisma } from '@prisma/client';
import { CreateIncomeDto } from '../dto/create-income.dto';
import { UpdateIncomeDto } from '../dto/update-income.dto';
import { DateUtil } from '../../common/utils/date.util';

@Injectable()
export class IncomesRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Lista receitas com filtros opcionais de período.
   *
   * @param userId - Dono das receitas
   * @param month  - Mês (1-12) para filtrar
   * @param year   - Ano para filtrar
   */
  async findAll(
    userId: number,
    month?: number,
    year?: number,
  ): Promise<incomes[]> {
    const where: Prisma.incomesWhereInput = { user_id: userId };

    // Filtro por período: constrói intervalo de datas do mês
    if (month && year) {
      const { start, end } = DateUtil.monthRange(year, month);
      where.received_at = { gte: start, lt: end };
    } else if (year) {
      const { start } = DateUtil.monthRange(year, 1);
      const { end }   = DateUtil.monthRange(year, 12);
      where.received_at = { gte: start, lt: end };
    }

    return this.prisma.incomes.findMany({
      where,
      orderBy: { received_at: 'desc' }, // Mais recentes primeiro
    });
  }

  async findOne(id: number, userId: number): Promise<incomes | null> {
    return this.prisma.incomes.findFirst({ where: { id, user_id: userId } });
  }

  async create(userId: number, dto: CreateIncomeDto): Promise<incomes> {
    return this.prisma.incomes.create({
      data: {
        user_id: userId,
        description: dto.description,
        amount: dto.amount,
        received_at: DateUtil.parseLocalDate(dto.received_at),
        is_recurring: dto.is_recurring ?? false,
        notes: dto.notes,
      },
    });
  }

  async update(id: number, dto: UpdateIncomeDto): Promise<incomes> {
    return this.prisma.incomes.update({
      where: { id },
      data: {
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.amount      !== undefined && { amount: dto.amount }),
        ...(dto.received_at !== undefined && { received_at: DateUtil.parseLocalDate(dto.received_at) }),
        ...(dto.is_recurring !== undefined && { is_recurring: dto.is_recurring }),
        ...(dto.notes       !== undefined && { notes: dto.notes }),
      },
    });
  }

  async remove(id: number): Promise<incomes> {
    return this.prisma.incomes.delete({ where: { id } });
  }

  /**
   * Soma total das receitas de um mês/ano específico.
   * Usado pelo dashboard para exibir "Receitas do mês".
   */
  async sumByMonth(userId: number, month: number, year: number): Promise<number> {
    const { start, end } = DateUtil.monthRange(year, month);

    const result = await this.prisma.incomes.aggregate({
      where: {
        user_id:    userId,
        received_at: { gte: start, lt: end },
      },
      _sum: { amount: true },
    });

    // Converte Decimal do Prisma para number JavaScript
    return Number(result._sum.amount ?? 0);
  }
}

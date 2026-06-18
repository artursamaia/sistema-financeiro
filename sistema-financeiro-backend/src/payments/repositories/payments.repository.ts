/**
 * PaymentsRepository — Acesso a dados de pagamentos.
 *
 * Nota: o campo no banco é `amount_paid` (conforme schema.prisma),
 * não `amount`. O DTO usa `amount` como nome mais limpo para o usuário.
 */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { payments } from '@prisma/client';
import { CreatePaymentDto } from '../dto/create-payment.dto';
import { DateUtil } from '../../common/utils/date.util';

@Injectable()
export class PaymentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: number, dto: CreatePaymentDto): Promise<payments> {
    return this.prisma.payments.create({
      data: {
        installment_id:  dto.installment_id,
        amount_paid:     dto.amount,           // DTO usa 'amount', banco usa 'amount_paid'
        payment_method:  dto.payment_method,
        paid_at:         dto.paid_at ? DateUtil.parseLocalDate(dto.paid_at) : new Date(),
        notes:           dto.notes,
      },
    });
  }

  async findByInstallment(installmentId: number, userId: number): Promise<payments[]> {
    return this.prisma.payments.findMany({
      where: {
        installment_id: installmentId,
        installments: {
          loans: { user_id: userId },
        },
      },
      orderBy: { paid_at: 'asc' },
    });
  }

  /**
   * Soma o total já pago de uma parcela.
   * Retorna 0 se não houver pagamentos ainda.
   */
  async sumByInstallment(installmentId: number): Promise<number> {
    const result = await this.prisma.payments.aggregate({
      where:  { installment_id: installmentId },
      _sum:   { amount_paid: true },
    });

    return Number(result._sum?.amount_paid ?? 0);
  }
}

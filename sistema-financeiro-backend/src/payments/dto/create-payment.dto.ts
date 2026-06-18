/**
 * CreatePaymentDto — Dados para registrar um pagamento de parcela.
 *
 * Regras de negócio:
 *   - installment_id: parcela que está sendo paga
 *   - amount: valor do pagamento (pode ser parcial — menor que o valor da parcela)
 *   - payment_method: dinheiro, pix, transferência, cartão débito/crédito, cheque
 *   - paid_at: data do pagamento (padrão: hoje)
 *   - notes: observações opcionais (ex: "pagamento combinado com visita")
 *
 * Pagamento parcial:
 *   Se amount < parcela.amount, o status da parcela vira "partial".
 *   É permitido registrar múltiplos pagamentos parciais na mesma parcela.
 *   Quando paid_amount >= amount da parcela, o status vira "paid".
 */
import {
  IsInt, IsPositive, IsNumber, IsOptional,
  IsString, IsEnum, IsDateString, IsNotEmpty,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { payments_payment_method } from '@prisma/client';

export class CreatePaymentDto {
  @ApiProperty({ example: 1, description: 'ID da parcela a ser paga' })
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  installment_id: number;

  @ApiProperty({
    example: 350.00,
    description: 'Valor pago. Pode ser menor que o valor da parcela (pagamento parcial).',
  })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive({ message: 'O valor do pagamento deve ser maior que zero.' })
  amount: number;

  @ApiProperty({
    enum: payments_payment_method,
    example: 'pix',
    description: 'Forma de pagamento utilizada.',
  })
  @IsEnum(payments_payment_method, { message: 'Forma de pagamento inválida.' })
  payment_method: payments_payment_method;

  @ApiPropertyOptional({
    example: '2024-06-10',
    description: 'Data do pagamento. Padrão: data atual.',
  })
  @IsOptional()
  @IsDateString({}, { message: 'A data de pagamento deve estar no formato YYYY-MM-DD.' })
  paid_at?: string;

  @ApiPropertyOptional({ example: 'Cliente pagou na visita domiciliar.' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  notes?: string;
}

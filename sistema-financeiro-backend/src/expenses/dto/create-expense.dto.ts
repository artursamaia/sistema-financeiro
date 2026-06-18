/**
 * CreateExpenseDto — Dados para cadastrar uma despesa.
 *
 * Regras de negócio:
 *   - description e amount são obrigatórios
 *   - due_date é a data de vencimento
 *   - is_fixed = true indica despesa recorrente (aluguel, assinatura, etc.)
 *   - is_paid indica se já foi paga; paid_at registra a data do pagamento
 *   - category_id é opcional (despesa sem categoria é permitida)
 */
import {
  IsString, IsNotEmpty, IsNumber, IsPositive,
  IsDateString, IsOptional, IsBoolean, IsInt, Min, MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateExpenseDto {
  @ApiProperty({ example: 'Conta de luz', description: 'Descrição da despesa' })
  @IsString()
  @IsNotEmpty({ message: 'A descrição é obrigatória.' })
  @MaxLength(200)
  description: string;

  @ApiProperty({ example: 150.50, description: 'Valor da despesa em reais' })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive({ message: 'O valor deve ser maior que zero.' })
  amount: number;

  @ApiProperty({ example: '2024-06-10', description: 'Data de vencimento (YYYY-MM-DD)' })
  @IsDateString({}, { message: 'A data de vencimento deve estar no formato YYYY-MM-DD.' })
  due_date: string;

  @ApiPropertyOptional({ example: 1, description: 'ID da categoria (opcional)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'O ID da categoria deve ser um número inteiro.' })
  @Min(1)
  category_id?: number;

  @ApiPropertyOptional({ example: false, description: 'true = despesa fixa recorrente' })
  @IsOptional()
  @IsBoolean()
  is_fixed?: boolean;

  @ApiPropertyOptional({ example: false, description: 'true = despesa já foi paga' })
  @IsOptional()
  @IsBoolean()
  is_paid?: boolean;

  @ApiPropertyOptional({ example: '2024-06-08', description: 'Data do pagamento efetivo (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString({}, { message: 'A data de pagamento deve estar no formato YYYY-MM-DD.' })
  paid_at?: string;

  @ApiPropertyOptional({ example: 'Boleto vencimento dia 10.' })
  @IsOptional()
  @IsString()
  notes?: string;
}

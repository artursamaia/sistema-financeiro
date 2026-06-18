/**
 * CreateIncomeDto — Dados para cadastrar uma receita.
 *
 * Regras de negócio:
 *   - description e amount são obrigatórios
 *   - amount deve ser positivo
 *   - received_at é a data de recebimento (pode ser futura para agendamentos)
 *   - is_recurring indica se é receita mensal recorrente (ex: salário)
 */
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsDateString,
  IsOptional,
  IsBoolean,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateIncomeDto {
  @ApiProperty({ example: 'Salário Junho/2024', description: 'Descrição da receita' })
  @IsString({ message: 'A descrição deve ser um texto.' })
  @IsNotEmpty({ message: 'A descrição é obrigatória.' })
  @MaxLength(200, { message: 'A descrição deve ter no máximo 200 caracteres.' })
  description: string;

  @ApiProperty({ example: 5000.00, description: 'Valor da receita em reais (deve ser positivo)' })
  @Type(() => Number) // Converte string para number automaticamente
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'O valor deve ser um número com até 2 casas decimais.' })
  @IsPositive({ message: 'O valor deve ser maior que zero.' })
  amount: number;

  @ApiProperty({ example: '2024-06-05', description: 'Data de recebimento (formato YYYY-MM-DD)' })
  @IsDateString({}, { message: 'A data deve estar no formato YYYY-MM-DD.' })
  received_at: string;

  @ApiPropertyOptional({ example: true, description: 'true = receita recorrente mensal' })
  @IsOptional()
  @IsBoolean({ message: 'is_recurring deve ser true ou false.' })
  is_recurring?: boolean;

  @ApiPropertyOptional({ example: 'Pagamento referente ao mês de junho.' })
  @IsOptional()
  @IsString()
  notes?: string;
}

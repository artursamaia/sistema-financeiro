/**
 * CreateLoanDto — Dados para registrar um novo empréstimo.
 *
 * Regras de negócio:
 *   - client_id deve referenciar um cliente ativo do usuário
 *   - principal_amount deve ser positivo
 *   - interest_rate >= 0 (0 = sem juros)
 *   - installments_count >= 1
 *   - first_due_date define o vencimento da 1ª parcela
 *   - As demais parcelas vencem mensalmente a partir daí
 */
import {
  IsInt, IsPositive, IsNumber, Min, IsDateString,
  IsOptional, IsString, IsNotEmpty, Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateLoanDto {
  @ApiProperty({ example: 1, description: 'ID do cliente que receberá o empréstimo' })
  @Type(() => Number)
  @IsInt({ message: 'O ID do cliente deve ser um número inteiro.' })
  @IsPositive({ message: 'O ID do cliente deve ser positivo.' })
  client_id: number;

  @ApiProperty({ example: 1000.00, description: 'Valor principal emprestado (sem juros)' })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive({ message: 'O valor principal deve ser maior que zero.' })
  principal_amount: number;

  @ApiProperty({
    example: 5.0,
    description: 'Taxa de juros mensal em % (0 = sem juros). Máximo: 100%',
  })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0, { message: 'A taxa de juros não pode ser negativa.' })
  @Max(100, { message: 'A taxa de juros não pode ultrapassar 100% ao mês.' })
  interest_rate: number;

  @ApiProperty({ example: 12, description: 'Número de parcelas mensais' })
  @Type(() => Number)
  @IsInt({ message: 'O número de parcelas deve ser inteiro.' })
  @Min(1, { message: 'O empréstimo deve ter ao menos 1 parcela.' })
  @Max(360, { message: 'O número máximo de parcelas é 360.' })
  installments_count: number;

  @ApiProperty({ example: '2024-06-01', description: 'Data de concessão do empréstimo' })
  @IsDateString({}, { message: 'A data de início deve estar no formato YYYY-MM-DD.' })
  start_date: string;

  @ApiProperty({ example: '2024-07-01', description: 'Vencimento da primeira parcela' })
  @IsDateString({}, { message: 'A data do primeiro vencimento deve estar no formato YYYY-MM-DD.' })
  first_due_date: string;

  @ApiPropertyOptional({ example: 'Empréstimo para reforma da casa.' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  notes?: string;
}

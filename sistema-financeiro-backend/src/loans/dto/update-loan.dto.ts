/**
 * UpdateLoanDto — Apenas campos editáveis após a criação do empréstimo.
 *
 * Regra importante:
 *   Após criar um empréstimo, os valores financeiros (principal, juros, parcelas)
 *   NÃO podem ser alterados pois as parcelas já foram geradas.
 *   Só é permitido alterar: status e notes.
 *   Para corrigir valores financeiros, cancele e recrie o empréstimo.
 */
import { IsOptional, IsString, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { loans_status } from '@prisma/client';

export class UpdateLoanDto {
  @ApiPropertyOptional({
    enum: loans_status,
    example: 'cancelled',
    description: 'Novo status do empréstimo. "paid" é definido automaticamente pelo sistema.',
  })
  @IsOptional()
  @IsEnum(loans_status, { message: 'Status inválido. Use: active, paid, defaulted ou cancelled.' })
  status?: loans_status;

  @ApiPropertyOptional({ example: 'Cliente solicitou renegociação.' })
  @IsOptional()
  @IsString()
  notes?: string;
}

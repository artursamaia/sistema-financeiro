/**
 * CreateClientDto — Dados para cadastrar um novo cliente.
 *
 * Regras de negócio:
 *   - name é obrigatório
 *   - cpf é opcional mas deve ter formato válido se informado
 *   - status padrão é 'active' (definido no banco)
 *   - Dois clientes do mesmo usuário não podem ter o mesmo CPF
 */
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEmail,
  MaxLength,
  Matches,
  IsEnum,
  Length,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { clients_status } from '@prisma/client';

export class CreateClientDto {
  @ApiProperty({ example: 'Maria da Silva', description: 'Nome completo do cliente' })
  @IsString({ message: 'O nome deve ser um texto.' })
  @IsNotEmpty({ message: 'O nome é obrigatório.' })
  @MaxLength(100, { message: 'O nome deve ter no máximo 100 caracteres.' })
  name: string;

  @ApiPropertyOptional({ example: '123.456.789-00', description: 'CPF no formato 000.000.000-00' })
  @IsOptional()
  @IsString()
  // Valida o formato XXX.XXX.XXX-XX
  @Matches(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, {
    message: 'O CPF deve estar no formato 000.000.000-00.',
  })
  cpf?: string;

  @ApiPropertyOptional({ example: '(11) 99999-9999', description: 'Telefone com DDD' })
  @IsOptional()
  @IsString()
  @MaxLength(20, { message: 'O telefone deve ter no máximo 20 caracteres.' })
  phone?: string;

  @ApiPropertyOptional({ example: 'maria@email.com' })
  @IsOptional()
  @IsEmail({}, { message: 'Informe um e-mail válido.' })
  email?: string;

  @ApiPropertyOptional({ example: 'Rua das Flores, 123, Apto 45' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  address?: string;

  @ApiPropertyOptional({ example: 'São Paulo' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional({ example: 'SP', description: 'UF com 2 letras' })
  @IsOptional()
  @IsString()
  @Length(2, 2, { message: 'O estado deve ter exatamente 2 letras (ex: SP).' })
  state?: string;

  @ApiPropertyOptional({ example: 'active', enum: clients_status })
  @IsOptional()
  @IsEnum(clients_status, { message: 'Status inválido. Use: active, inactive ou defaulter.' })
  status?: clients_status;

  @ApiPropertyOptional({ example: 'Cliente indicado por João.' })
  @IsOptional()
  @IsString()
  notes?: string;
}

/**
 * CreateExpenseCategoryDto — Dados para criar uma categoria de despesa.
 *
 * Regras:
 *   - name obrigatório
 *   - color em hexadecimal (ex: #4CAF50)
 *   - icon deve ser nome de ícone Material (ex: restaurant)
 */
import {
  IsString, IsNotEmpty, IsOptional, MaxLength, Matches, IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateExpenseCategoryDto {
  @ApiProperty({ example: 'Alimentação', description: 'Nome da categoria' })
  @IsString()
  @IsNotEmpty({ message: 'O nome é obrigatório.' })
  @MaxLength(80, { message: 'O nome deve ter no máximo 80 caracteres.' })
  name: string;

  @ApiPropertyOptional({ example: '#4CAF50', description: 'Cor em hexadecimal' })
  @IsOptional()
  @IsString()
  // Aceita #RGB (3 dígitos) ou #RRGGBB (6 dígitos)
  @Matches(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/, {
    message: 'A cor deve estar no formato hexadecimal (ex: #4CAF50).',
  })
  color?: string;

  @ApiPropertyOptional({ example: 'restaurant', description: 'Nome do ícone Material Design' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  icon?: string;

  @ApiPropertyOptional({ example: true, description: 'false = inativa (não aparece em novos lançamentos)' })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

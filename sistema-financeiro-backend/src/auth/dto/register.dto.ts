/**
 * RegisterDto — Dados para registrar um novo usuário.
 *
 * Validações:
 *   - name:     obrigatório, máx 100 chars
 *   - email:    formato válido, obrigatório
 *   - password: mín 8 chars, deve conter maiúscula, minúscula e número
 */
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'João da Silva', description: 'Nome completo do usuário' })
  @IsString({ message: 'O nome deve ser um texto.' })
  @IsNotEmpty({ message: 'O nome é obrigatório.' })
  @MaxLength(100, { message: 'O nome deve ter no máximo 100 caracteres.' })
  name: string;

  @ApiProperty({ example: 'joao@email.com', description: 'E-mail utilizado para login' })
  @IsEmail({}, { message: 'Informe um e-mail válido.' })
  @IsNotEmpty({ message: 'O e-mail é obrigatório.' })
  email: string;

  @ApiProperty({
    example: 'Senha@123',
    description: 'Mínimo 8 caracteres com maiúscula, minúscula e número',
  })
  @IsString({ message: 'A senha deve ser um texto.' })
  @MinLength(8, { message: 'A senha deve ter no mínimo 8 caracteres.' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, {
    message: 'A senha deve conter pelo menos uma letra maiúscula, uma minúscula e um número.',
  })
  password: string;
}

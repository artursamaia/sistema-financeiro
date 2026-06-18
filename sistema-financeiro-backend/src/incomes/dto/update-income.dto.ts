/**
 * UpdateIncomeDto — Todos os campos do CreateIncomeDto tornam-se opcionais.
 * Permite atualizar apenas os campos desejados (PATCH semântico).
 */
import { PartialType } from '@nestjs/swagger';
import { CreateIncomeDto } from './create-income.dto';

export class UpdateIncomeDto extends PartialType(CreateIncomeDto) {}

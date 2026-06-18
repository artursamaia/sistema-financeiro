/**
 * UpdateClientDto — Dados para atualizar um cliente existente.
 *
 * Herda todos os campos do CreateClientDto tornando-os opcionais (PartialType).
 * Isso permite atualizar apenas os campos desejados (PATCH semântico).
 */
import { PartialType } from '@nestjs/swagger';
import { CreateClientDto } from './create-client.dto';

export class UpdateClientDto extends PartialType(CreateClientDto) {}

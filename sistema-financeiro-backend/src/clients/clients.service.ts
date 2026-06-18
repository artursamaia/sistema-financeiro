/**
 * ClientsService — Lógica de negócio para clientes.
 *
 * Responsabilidades:
 *   - Listar clientes do usuário com filtros
 *   - Buscar cliente por ID (validando propriedade)
 *   - Criar cliente (validando CPF duplicado)
 *   - Atualizar cliente (validando CPF duplicado)
 *   - Remover cliente (validando ausência de empréstimos ativos)
 *
 * Regras de negócio:
 *   - Um usuário só acessa seus próprios clientes
 *   - CPF deve ser único por usuário
 *   - Cliente com empréstimo ativo não pode ser excluído
 *   - Ao marcar como inadimplente: apenas via atualização de status
 */
import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { clients, clients_status } from '@prisma/client';
import { ClientsRepository } from './repositories/clients.repository';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';

@Injectable()
export class ClientsService {
  private readonly logger = new Logger(ClientsService.name);

  constructor(private readonly clientsRepository: ClientsRepository) {}

  /**
   * Lista todos os clientes do usuário autenticado.
   * Suporta filtro por nome/CPF e por status.
   */
  async findAll(
    userId: number,
    search?: string,
    status?: clients_status,
  ): Promise<clients[]> {
    return this.clientsRepository.findAll(userId, search, status);
  }

  /**
   * Busca um cliente específico pelo ID.
   * Garante que o cliente pertence ao usuário autenticado.
   *
   * @throws NotFoundException se o cliente não existir ou não pertencer ao usuário
   */
  async findOne(id: number, userId: number): Promise<clients> {
    const client = await this.clientsRepository.findOne(id, userId);

    if (!client) {
      throw new NotFoundException(`Cliente #${id} não encontrado.`);
    }

    return client;
  }

  /**
   * Cria um novo cliente.
   *
   * Fluxo:
   *   1. Se CPF informado, verifica se já existe para o mesmo usuário
   *   2. Cria o cliente
   *
   * @throws ConflictException se o CPF já estiver cadastrado para o usuário
   */
  async create(userId: number, dto: CreateClientDto): Promise<clients> {
    // Verifica CPF duplicado apenas se foi informado
    if (dto.cpf) {
      const existing = await this.clientsRepository.findByCpf(dto.cpf, userId);
      if (existing) {
        throw new ConflictException(`CPF ${dto.cpf} já está cadastrado.`);
      }
    }

    const client = await this.clientsRepository.create(userId, dto);
    this.logger.log(`Cliente criado: ID ${client.id} - ${client.name} (usuário ${userId})`);
    return client;
  }

  /**
   * Atualiza dados de um cliente existente.
   *
   * Fluxo:
   *   1. Verifica se o cliente existe e pertence ao usuário
   *   2. Se CPF foi alterado, verifica duplicidade
   *   3. Atualiza apenas os campos informados
   *
   * @throws NotFoundException se o cliente não existir
   * @throws ConflictException se o novo CPF já estiver em uso por outro cliente
   */
  async update(id: number, userId: number, dto: UpdateClientDto): Promise<clients> {
    // Verifica existência e propriedade
    const existing = await this.findOne(id, userId);

    // Verifica CPF duplicado apenas se foi alterado
    if (dto.cpf && dto.cpf !== existing.cpf) {
      const cpfOwner = await this.clientsRepository.findByCpf(dto.cpf, userId);
      if (cpfOwner) {
        throw new ConflictException(`CPF ${dto.cpf} já está cadastrado para outro cliente.`);
      }
    }

    return this.clientsRepository.update(id, userId, dto);
  }

  /**
   * Remove um cliente.
   *
   * Regra: não permite excluir cliente com empréstimos ativos,
   * pois isso quebraria o histórico financeiro.
   *
   * @throws NotFoundException se o cliente não existir
   * @throws BadRequestException se o cliente tiver empréstimos ativos
   */
  async remove(id: number, userId: number): Promise<void> {
    await this.findOne(id, userId); // Valida existência e propriedade

    const activeLoans = await this.clientsRepository.countActiveLoans(id);
    if (activeLoans > 0) {
      throw new BadRequestException(
        `Não é possível excluir o cliente pois ele possui ${activeLoans} empréstimo(s) ativo(s).`,
      );
    }

    await this.clientsRepository.remove(id);
    this.logger.log(`Cliente #${id} removido pelo usuário ${userId}`);
  }
}

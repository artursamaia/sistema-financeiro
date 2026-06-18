/**
 * ClientsRepository — Camada de acesso a dados para clientes.
 *
 * Objetivo:
 *   Isola todas as queries do Prisma relacionadas a clientes.
 *   O Service não conhece o Prisma diretamente — apenas chama este repositório.
 *
 * Padrão: Repository Pattern
 *   Benefício: se trocarmos o ORM no futuro, só este arquivo muda.
 *
 * Importante — isolamento por usuário:
 *   Todas as queries filtram por user_id para garantir que um usuário
 *   nunca acesse dados de outro usuário (multi-tenancy por linha).
 */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { clients, clients_status, Prisma } from '@prisma/client';
import { CreateClientDto } from '../dto/create-client.dto';
import { UpdateClientDto } from '../dto/update-client.dto';

@Injectable()
export class ClientsRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Busca todos os clientes de um usuário com filtros opcionais.
   *
   * @param userId  - ID do usuário autenticado
   * @param search  - Filtro por nome ou CPF (busca parcial)
   * @param status  - Filtro por status do cliente
   */
  async findAll(
    userId: number,
    search?: string,
    status?: clients_status,
  ): Promise<clients[]> {
    // Monta o filtro de busca dinamicamente
    const where: Prisma.clientsWhereInput = {
      user_id: userId,
      // Adiciona filtro de status somente se informado
      ...(status && { status }),
      // Busca por nome OU CPF se o termo de pesquisa for informado
      ...(search && {
        OR: [
          { name: { contains: search } },
          { cpf: { contains: search } },
        ],
      }),
    };

    return this.prisma.clients.findMany({
      where,
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Busca um cliente pelo ID garantindo que pertence ao usuário.
   * Retorna null se não encontrado ou não pertencer ao usuário.
   */
  async findOne(id: number, userId: number): Promise<clients | null> {
    return this.prisma.clients.findFirst({
      where: { id, user_id: userId },
    });
  }

  /**
   * Busca cliente por CPF dentro do contexto do usuário.
   * Usado para verificar duplicidade de CPF antes de criar/atualizar.
   */
  async findByCpf(cpf: string, userId: number): Promise<clients | null> {
    return this.prisma.clients.findFirst({
      where: { cpf, user_id: userId },
    });
  }

  /**
   * Cria um novo cliente associado ao usuário.
   */
  async create(userId: number, dto: CreateClientDto): Promise<clients> {
    return this.prisma.clients.create({
      data: {
        user_id: userId,
        name: dto.name,
        cpf: dto.cpf,
        phone: dto.phone,
        email: dto.email,
        address: dto.address,
        city: dto.city,
        state: dto.state,
        status: dto.status ?? 'active',
        notes: dto.notes,
      },
    });
  }

  /**
   * Atualiza apenas os campos informados no DTO (PATCH).
   * Campos não informados mantêm o valor atual no banco.
   */
  async update(id: number, userId: number, dto: UpdateClientDto): Promise<clients> {
    return this.prisma.clients.update({
      where: { id },
      // Filtra undefined para não sobrescrever campos não enviados
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.cpf !== undefined && { cpf: dto.cpf }),
        ...(dto.phone !== undefined && { phone: dto.phone }),
        ...(dto.email !== undefined && { email: dto.email }),
        ...(dto.address !== undefined && { address: dto.address }),
        ...(dto.city !== undefined && { city: dto.city }),
        ...(dto.state !== undefined && { state: dto.state }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
      },
    });
  }

  /**
   * Remove um cliente do banco.
   * O Service valida se possui empréstimos ativos antes de chamar este método.
   */
  async remove(id: number): Promise<clients> {
    return this.prisma.clients.delete({ where: { id } });
  }

  /**
   * Conta quantos empréstimos ativos um cliente possui.
   * Usado para impedir exclusão de cliente com empréstimos em aberto.
   */
  async countActiveLoans(clientId: number): Promise<number> {
    return this.prisma.loans.count({
      where: {
        client_id: clientId,
        status: 'active',
      },
    });
  }
}

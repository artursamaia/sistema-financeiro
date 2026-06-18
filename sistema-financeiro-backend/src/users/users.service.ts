/**
 * UsersService — Gerenciamento de usuários do sistema.
 *
 * Responsabilidades:
 *   - Buscar usuário por ID (usado pelo JwtStrategy)
 *   - Buscar usuário por e-mail com senha (usado pelo AuthService no login)
 *   - Criar novo usuário (usado pelo AuthService no registro)
 *
 * Regras de negócio:
 *   - E-mail deve ser único
 *   - O campo password_hash nunca é retornado nas consultas públicas
 */
import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { users } from '@prisma/client';

// Campos públicos retornados sem a senha
const PUBLIC_USER_SELECT = {
  id: true,
  name: true,
  email: true,
  is_active: true,
  created_at: true,
  updated_at: true,
} as const;

// Tipo inferido do select acima — garante que password_hash nunca vaze
export type PublicUser = {
  id: number;
  name: string;
  email: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
};

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Busca usuário pelo ID sem retornar a senha.
   * Utilizado pelo JwtStrategy a cada requisição autenticada.
   *
   * @throws NotFoundException se o ID não existir
   */
  async findById(id: number): Promise<PublicUser> {
    const user = await this.prisma.users.findUnique({
      where: { id },
      select: PUBLIC_USER_SELECT,
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    return user;
  }

  /**
   * Busca usuário pelo e-mail INCLUINDO o hash da senha.
   * Método interno — usado exclusivamente pelo AuthService no login.
   */
  async findByEmailWithPassword(email: string): Promise<users | null> {
    return this.prisma.users.findUnique({ where: { email } });
  }

  /**
   * Cria um novo usuário no banco.
   * A senha já deve vir hasheada com bcrypt antes de chamar este método.
   *
   * @throws ConflictException se o e-mail já estiver cadastrado
   */
  async create(data: {
    name: string;
    email: string;
    passwordHash: string;
  }): Promise<PublicUser> {
    const existing = await this.prisma.users.findUnique({
      where: { email: data.email },
    });

    if (existing) {
      throw new ConflictException('Este e-mail já está cadastrado.');
    }

    return this.prisma.users.create({
      data: {
        name: data.name,
        email: data.email,
        password_hash: data.passwordHash,
      },
      select: PUBLIC_USER_SELECT,
    });
  }
}

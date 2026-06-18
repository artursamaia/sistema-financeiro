/**
 * AuthService — Lógica de autenticação do sistema.
 *
 * Responsabilidades:
 *   - Registrar novos usuários (hash bcrypt + JWT)
 *   - Autenticar usuários existentes (verificar senha + JWT)
 *
 * Regras de negócio:
 *   - Senha hasheada com bcrypt rounds=10 antes de salvar
 *   - JWT contém: id (sub), email e nome do usuário
 *   - Credenciais inválidas retornam mensagem genérica
 *     (não revela se o e-mail existe — prevenção de user enumeration)
 *   - Usuários inativos não conseguem autenticar
 */
import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

const BCRYPT_ROUNDS = 10;

export interface AuthResponse {
  accessToken: string;
  user: {
    id: number;
    name: string;
    email: string;
  };
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Registra um novo usuário.
   *
   * Fluxo:
   *   1. Gera hash bcrypt da senha
   *   2. Persiste no banco via UsersService (lança 409 se e-mail duplicado)
   *   3. Retorna JWT + dados públicos do usuário
   */
  async register(dto: RegisterDto): Promise<AuthResponse> {
    this.logger.log(`Novo registro: ${dto.email}`);

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    const user = await this.usersService.create({
      name: dto.name,
      email: dto.email,
      passwordHash,
    });

    return this.buildAuthResponse(user.id, user.name, user.email);
  }

  /**
   * Autentica um usuário existente.
   *
   * Fluxo:
   *   1. Busca usuário pelo e-mail (com senha)
   *   2. Compara senha com bcrypt.compare (seguro contra timing attacks)
   *   3. Verifica se está ativo
   *   4. Retorna JWT + dados públicos
   */
  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await this.usersService.findByEmailWithPassword(dto.email);

    // Mensagem genérica intencional — não revela se o e-mail existe
    const invalidMsg = 'E-mail ou senha inválidos.';

    if (!user) {
      throw new UnauthorizedException(invalidMsg);
    }

    const passwordMatch = await bcrypt.compare(dto.password, user.password_hash);

    if (!passwordMatch) {
      this.logger.warn(`Senha inválida para: ${dto.email}`);
      throw new UnauthorizedException(invalidMsg);
    }

    if (!user.is_active) {
      throw new UnauthorizedException('Sua conta está inativa. Entre em contato com o suporte.');
    }

    this.logger.log(`Login bem-sucedido: ${dto.email}`);
    return this.buildAuthResponse(user.id, user.name, user.email);
  }

  /**
   * Monta o objeto de resposta com o token JWT assinado.
   * O payload do JWT nunca deve conter dados sensíveis.
   */
  private buildAuthResponse(id: number, name: string, email: string): AuthResponse {
    const payload = { sub: id, email, name };

    return {
      accessToken: this.jwtService.sign(payload),
      user: { id, name, email },
    };
  }
}

/**
 * JwtStrategy — Estratégia Passport para validação de tokens JWT.
 *
 * Fluxo a cada requisição em rota protegida:
 *   1. Passport extrai o token do header: Authorization: Bearer <token>
 *   2. Verifica assinatura e expiração com JWT_SECRET
 *   3. Chama validate() com o payload decodificado
 *   4. O retorno de validate() é injetado em request.user
 *   5. Controllers acessam via @CurrentUser()
 *
 * Token inválido ou expirado → 401 automático pelo Passport.
 */
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';
import { JwtPayload } from '../../common/decorators/current-user.decorator';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  /**
   * Chamado após verificação bem-sucedida do token.
   * Valida se o usuário ainda existe e está ativo no banco.
   * Impede que tokens válidos de usuários desativados sejam aceitos.
   */
  async validate(payload: JwtPayload): Promise<JwtPayload> {
    const user = await this.usersService.findById(payload.sub);

    if (!user || !user.is_active) {
      throw new UnauthorizedException('Usuário não encontrado ou inativo.');
    }

    return { sub: payload.sub, email: payload.email, name: payload.name };
  }
}

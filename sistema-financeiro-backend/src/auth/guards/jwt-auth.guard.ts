/**
 * JwtAuthGuard — Protege rotas que exigem autenticação JWT.
 *
 * Uso:
 *   @UseGuards(JwtAuthGuard)  → em um método específico
 *   aplicado na classe        → protege todos os métodos
 *
 * Token ausente, inválido ou expirado → retorna 401.
 */
import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    return super.canActivate(context);
  }

  handleRequest<TUser>(err: Error, user: TUser): TUser {
    if (err || !user) {
      throw new UnauthorizedException(
        'Token de acesso inválido, expirado ou não informado.',
      );
    }
    return user;
  }
}

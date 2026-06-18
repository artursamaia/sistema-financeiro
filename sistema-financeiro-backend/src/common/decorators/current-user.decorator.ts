/**
 * CurrentUser — Decorator para injetar o usuário autenticado no controller.
 *
 * Uso:
 *   @Get('me')
 *   @UseGuards(JwtAuthGuard)
 *   getProfile(@CurrentUser() user: JwtPayload) { ... }
 *
 *   @Get('email')
 *   getEmail(@CurrentUser('email') email: string) { ... }
 *
 * O objeto user é populado pelo JwtStrategy após validar o token.
 */
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

export interface JwtPayload {
  sub: number;   // ID do usuário
  email: string;
  name: string;
}

export const CurrentUser = createParamDecorator(
  (data: keyof JwtPayload | undefined, ctx: ExecutionContext): JwtPayload | unknown => {
    const request = ctx.switchToHttp().getRequest<Request & { user: JwtPayload }>();
    const user = request.user;
    return data ? user?.[data] : user;
  },
);

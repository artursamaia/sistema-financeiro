/**
 * AuthGuard — Protege rotas que exigem autenticação.
 *
 * Como funciona:
 *   - Verifica se o usuário está autenticado via AuthService
 *   - Se sim: permite o acesso à rota
 *   - Se não: redireciona para /login
 *
 * Usado no app.routes.ts para proteger todas as rotas internas.
 */
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  if (auth.isAuthenticated) return true;

  // Redireciona para login e bloqueia o acesso
  return router.createUrlTree(['/login']);
};

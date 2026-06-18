/**
 * AuthInterceptor — Injeta o token JWT em todas as requisições HTTP.
 *
 * Como funciona:
 *   - Intercepta todas as chamadas HttpClient
 *   - Se o usuário está autenticado, adiciona o header:
 *     Authorization: Bearer <token>
 *   - Rotas públicas (/login, /register) também passam pelo interceptor,
 *     mas como não há token ainda, o header não é adicionado.
 *
 * O interceptor é registrado como função (estilo Angular 17 standalone)
 * no app.config.ts via withInterceptors([authInterceptor]).
 */
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.token;

  // Se não há token, envia a requisição sem modificação
  if (!token) return next(req);

  // Clona a requisição adicionando o header de autorização
  // (requisições HttpClient são imutáveis, por isso o clone)
  const authReq = req.clone({
    setHeaders: { Authorization: `Bearer ${token}` },
  });

  return next(authReq);
};

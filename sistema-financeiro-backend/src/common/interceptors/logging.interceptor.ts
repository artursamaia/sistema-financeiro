/**
 * LoggingInterceptor — Interceptor global de log de requisições.
 *
 * Registra todas as requisições com método HTTP, URL e tempo de resposta.
 * Exemplo: POST /api/auth/login → 201 (142ms)
 */
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req       = context.switchToHttp().getRequest<Request>();
    const res       = context.switchToHttp().getResponse<Response>();
    const startTime = Date.now();

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - startTime;
        this.logger.log(`${req.method} ${req.url} → ${res.statusCode} (${duration}ms)`);
      }),
    );
  }
}

/**
 * HttpExceptionFilter — Filtro global de tratamento de erros HTTP.
 *
 * Intercepta todas as exceções da aplicação e retorna uma resposta
 * JSON padronizada, independentemente de onde o erro foi lançado.
 *
 * Formato padrão de resposta de erro:
 * {
 *   "statusCode": 404,
 *   "message": "Recurso não encontrado",
 *   "timestamp": "2024-01-15T10:30:00.000Z",
 *   "path": "/api/clients/99"
 * }
 */
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx      = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request  = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    // Extrai a mensagem — o ValidationPipe retorna { message: string[] }
    let message: string | string[];
    if (exception instanceof HttpException) {
      const body = exception.getResponse();
      message =
        typeof body === 'object' && body !== null && 'message' in body
          ? (body as { message: string | string[] }).message
          : exception.message;
    } else if (exception instanceof Error) {
      message = exception.message;
    } else {
      message = 'Erro interno do servidor';
    }

    // Erros 5xx: loga com stack trace completo
    if (status >= 500) {
      this.logger.error(
        `[${request.method}] ${request.url} → ${status}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    } else {
      this.logger.warn(`[${request.method}] ${request.url} → ${status}: ${JSON.stringify(message)}`);
    }

    response.status(status).json({
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}

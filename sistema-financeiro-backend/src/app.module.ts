/**
 * AppModule — Módulo raiz da aplicação.
 *
 * Configurações globais:
 *   - ConfigModule: carrega variáveis do .env
 *   - ThrottlerModule: rate limiting (100 req / 60s por IP)
 *   - PrismaModule: conexão com o banco (global)
 *   - HttpExceptionFilter: respostas de erro padronizadas (global)
 *   - LoggingInterceptor: log de todas as requisições (global)
 */
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ClientsModule } from './clients/clients.module';
import { IncomesModule } from './incomes/incomes.module';
import { ExpenseCategoriesModule } from './expense-categories/expense-categories.module';
import { ExpensesModule } from './expenses/expenses.module';
import { LoansModule } from './loans/loans.module';
import { InstallmentsModule } from './installments/installments.module';
import { PaymentsModule } from './payments/payments.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

@Module({
  imports: [
    // Carrega o .env e disponibiliza ConfigService globalmente
    ConfigModule.forRoot({ isGlobal: true }),

    // Rate limiting global: máx 100 requisições por 60 segundos por IP
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),

    PrismaModule,
    AuthModule,
    UsersModule,
    ClientsModule,
    IncomesModule,
    ExpenseCategoriesModule,
    ExpensesModule,
    LoansModule,
    InstallmentsModule,
    PaymentsModule,
  ],
  providers: [
    // Rate limiting aplicado em todas as rotas
    { provide: APP_GUARD, useClass: ThrottlerGuard },

    // Filtro global de exceções — resposta de erro padronizada
    { provide: APP_FILTER, useClass: HttpExceptionFilter },

    // Log de todas as requisições
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
  ],
})
export class AppModule {}

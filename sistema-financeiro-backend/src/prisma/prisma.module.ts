/**
 * PrismaModule — Módulo global do Prisma.
 *
 * @Global() torna o PrismaService disponível em toda a aplicação
 * sem necessidade de reimportá-lo em cada módulo.
 */
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}

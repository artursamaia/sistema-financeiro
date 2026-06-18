/**
 * PaymentsController — Endpoints para registrar e consultar pagamentos.
 *
 * Rotas:
 *   POST /api/payments                            → registrar um pagamento
 *   GET  /api/installments/:id/payments           → pagamentos de uma parcela
 *
 * A segunda rota usa o prefixo 'installments' para refletir a hierarquia
 * de recursos (payments são filhos de installments).
 */
import {
  Controller, Post, Get, Body, Param,
  ParseIntPipe, HttpCode, HttpStatus, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';

@ApiTags('Payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar pagamento',
    description:
      'Registra um pagamento para uma parcela. Atualiza automaticamente o status ' +
      'da parcela (partial/paid) e do empréstimo (paid quando todas as parcelas quitadas).',
  })
  @ApiResponse({ status: 201, description: 'Pagamento registrado com sucesso.' })
  @ApiResponse({ status: 400, description: 'Parcela já paga ou valor excede o saldo.' })
  @ApiResponse({ status: 404, description: 'Parcela não encontrada.' })
  create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreatePaymentDto,
  ) {
    return this.paymentsService.create(user.sub, dto);
  }

  @Get('installment/:installmentId')
  @ApiOperation({ summary: 'Listar pagamentos de uma parcela' })
  @ApiResponse({ status: 200, description: 'Lista de pagamentos da parcela.' })
  @ApiResponse({ status: 404, description: 'Parcela não encontrada.' })
  findByInstallment(
    @CurrentUser() user: JwtPayload,
    @Param('installmentId', ParseIntPipe) installmentId: number,
  ) {
    return this.paymentsService.findByInstallment(installmentId, user.sub);
  }
}

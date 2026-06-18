/**
 * InstallmentsController — Endpoints de consulta de parcelas.
 *
 * Parcelas são somente-leitura via API — criadas pelo LoansController
 * e pagas pelo PaymentsController.
 *
 * Rotas disponíveis:
 *   GET /api/loans/:loanId/installments    → parcelas de um empréstimo
 *   GET /api/installments/overdue          → parcelas vencidas do usuário
 *   GET /api/installments/:id              → detalhes de uma parcela
 */
import {
  Controller, Get, Param, ParseIntPipe, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';
import { InstallmentsService } from './installments.service';

@ApiTags('Installments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('installments')
export class InstallmentsController {
  constructor(private readonly installmentsService: InstallmentsService) {}

  @Get('overdue')
  @ApiOperation({
    summary: 'Parcelas vencidas',
    description: 'Lista todas as parcelas com vencimento anterior a hoje ainda não pagas.',
  })
  @ApiResponse({ status: 200, description: 'Lista de parcelas vencidas com dados do cliente.' })
  findOverdue(@CurrentUser() user: JwtPayload) {
    return this.installmentsService.findOverdue(user.sub);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalhar parcela' })
  @ApiResponse({ status: 200, description: 'Parcela com dados do empréstimo e cliente.' })
  @ApiResponse({ status: 404, description: 'Parcela não encontrada.' })
  findOne(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.installmentsService.findOne(id, user.sub);
  }
}

/**
 * LoansController — Endpoints REST para empréstimos.
 *
 * Todas as rotas exigem autenticação JWT.
 * O user_id nunca vem do body — sempre do token JWT.
 *
 * Rotas disponíveis:
 *   POST   /api/loans              → criar empréstimo (gera parcelas automaticamente)
 *   GET    /api/loans              → listar empréstimos (filtros: status, clientId)
 *   GET    /api/loans/:id          → detalhar empréstimo com parcelas
 *   PATCH  /api/loans/:id          → atualizar status ou notes
 */
import {
  Controller, Get, Post, Patch, Body, Param,
  ParseIntPipe, Query, HttpCode, HttpStatus, UseGuards,
} from '@nestjs/common';
import {
  ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtPayload } from '../common/decorators/current-user.decorator';
import { LoansService } from './loans.service';
import { InstallmentsService } from '../installments/installments.service';
import { CreateLoanDto } from './dto/create-loan.dto';
import { UpdateLoanDto } from './dto/update-loan.dto';
import { loans_status } from '@prisma/client';

@ApiTags('Loans')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('loans')
export class LoansController {
  constructor(
    private readonly loansService: LoansService,
    private readonly installmentsService: InstallmentsService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Criar empréstimo',
    description:
      'Cria um novo empréstimo e gera automaticamente todas as parcelas usando a Tabela Price.',
  })
  @ApiResponse({ status: 201, description: 'Empréstimo criado com parcelas geradas.' })
  @ApiResponse({ status: 400, description: 'Cliente inativo ou dados inválidos.' })
  @ApiResponse({ status: 404, description: 'Cliente não encontrado.' })
  create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateLoanDto,
  ) {
    return this.loansService.create(user.sub, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar empréstimos' })
  @ApiQuery({ name: 'status',   required: false, enum: loans_status })
  @ApiQuery({ name: 'clientId', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Lista de empréstimos com parcelas.' })
  findAll(
    @CurrentUser() user: JwtPayload,
    @Query('status')   status?: loans_status,
    @Query('clientId') clientId?: string,
  ) {
    return this.loansService.findAll(
      user.sub,
      status,
      clientId ? parseInt(clientId, 10) : undefined,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalhar empréstimo' })
  @ApiResponse({ status: 200, description: 'Empréstimo com todas as parcelas.' })
  @ApiResponse({ status: 404, description: 'Empréstimo não encontrado.' })
  findOne(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.loansService.findOne(id, user.sub);
  }

  @Get(':loanId/installments')
  @ApiOperation({ summary: 'Parcelas de um empréstimo' })
  @ApiResponse({ status: 200, description: 'Lista de parcelas ordenadas por número.' })
  @ApiResponse({ status: 404, description: 'Empréstimo não encontrado.' })
  findInstallments(
    @CurrentUser() user: JwtPayload,
    @Param('loanId', ParseIntPipe) loanId: number,
  ) {
    return this.installmentsService.findByLoan(loanId, user.sub);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Atualizar empréstimo',
    description: 'Apenas status e notes podem ser alterados. Valores financeiros são imutáveis.',
  })
  @ApiResponse({ status: 200, description: 'Empréstimo atualizado.' })
  @ApiResponse({ status: 403, description: 'Operação não permitida (ex: reativar cancelado).' })
  @ApiResponse({ status: 404, description: 'Empréstimo não encontrado.' })
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateLoanDto,
  ) {
    return this.loansService.update(id, user.sub, dto);
  }
}

/**
 * LoansService — Regras de negócio para empréstimos.
 *
 * Fluxo de criação:
 *   1. Verifica se o cliente pertence ao usuário e está ativo
 *   2. Calcula as parcelas usando a Tabela Price
 *   3. Cria empréstimo + parcelas atomicamente (via repository)
 *
 * Regras de imutabilidade:
 *   - Após criar, apenas status e notes podem ser alterados
 *   - "paid" é definido automaticamente pelo PaymentsService
 *
 * Multi-tenancy:
 *   - Todas as operações filtram por user_id extraído do JWT
 */
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
// NotFoundException ainda é usado no findOne()
import { LoansRepository, LoanWithDetails } from './repositories/loans.repository';
import { ClientsService } from '../clients/clients.service';
import { CreateLoanDto } from './dto/create-loan.dto';
import { UpdateLoanDto } from './dto/update-loan.dto';
import { LoanCalculatorUtil } from '../common/utils/loan-calculator.util';
import { loans, loans_status } from '@prisma/client';

@Injectable()
export class LoansService {
  constructor(
    private readonly loansRepository: LoansRepository,
    private readonly clientsService: ClientsService,
  ) {}

  async findAll(
    userId: number,
    status?: loans_status,
    clientId?: number,
  ): Promise<LoanWithDetails[]> {
    return this.loansRepository.findAll(userId, status, clientId);
  }

  async findOne(id: number, userId: number): Promise<LoanWithDetails> {
    const loan = await this.loansRepository.findOne(id, userId);

    if (!loan) {
      throw new NotFoundException(`Empréstimo #${id} não encontrado.`);
    }

    return loan;
  }

  async create(userId: number, dto: CreateLoanDto): Promise<loans> {
    // 1. Verifica se o cliente pertence ao usuário (ClientsService já lança NotFoundException)
    const client = await this.clientsService.findOne(dto.client_id, userId);

    // 2. Verifica se o cliente está ativo
    if (client.status !== 'active') {
      throw new BadRequestException(
        `Não é possível criar empréstimo para um cliente com status "${client.status}".`,
      );
    }

    // 3. Calcula as parcelas usando a fórmula Price
    const firstDueDate = new Date(dto.first_due_date);
    const installments = LoanCalculatorUtil.buildInstallments(
      dto.principal_amount,
      dto.interest_rate,
      dto.installments_count,
      firstDueDate,
    );

    // 4. Calcula o total (soma de todas as parcelas)
    const totalAmount = installments.reduce((sum, inst) => sum + inst.amount, 0);
    const roundedTotal = LoanCalculatorUtil.round(totalAmount);

    // 5. Persiste empréstimo + parcelas atomicamente
    return this.loansRepository.createWithInstallments(
      userId,
      dto,
      roundedTotal,
      installments,
    );
  }

  async update(id: number, userId: number, dto: UpdateLoanDto): Promise<loans> {
    // Confirma que o empréstimo existe e pertence ao usuário
    const loan = await this.findOne(id, userId);

    // Não permite reativar um empréstimo cancelado
    if (loan.status === 'cancelled' && dto.status && dto.status !== 'cancelled') {
      throw new ForbiddenException('Empréstimos cancelados não podem ser reativados.');
    }

    // Não permite alterar manualmente para "paid" (definido pelo sistema)
    if (dto.status === 'paid' && loan.status !== 'paid') {
      throw new ForbiddenException(
        'O status "paid" é definido automaticamente quando todas as parcelas são quitadas.',
      );
    }

    return this.loansRepository.update(id, dto);
  }

  /**
   * Chamado pelo PaymentsService após cada pagamento para verificar
   * se o empréstimo foi integralmente quitado.
   * Se não houver mais parcelas pendentes, marca o empréstimo como "paid".
   */
  async checkAndMarkAsPaid(loanId: number): Promise<void> {
    const pending = await this.loansRepository.countPendingInstallments(loanId);

    if (pending === 0) {
      await this.loansRepository.markAsPaid(loanId);
    }
  }
}

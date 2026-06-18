/**
 * LoanDetailComponent — Detalhe do empréstimo com parcelas e pagamentos.
 *
 * Funcionalidades:
 *   - Exibe dados do empréstimo e do cliente
 *   - Lista todas as parcelas com status visual (pago, parcial, vencido, pendente)
 *   - Formulário para registrar pagamento em uma parcela pendente
 *   - Barra de progresso mostrando quanto foi pago vs total
 */
import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { LoanService } from '../../core/services/loan.service';
import { Loan, Installment } from '../../core/models/loan.model';

@Component({
  selector: 'app-loan-detail',
  standalone: true,
  imports: [
    CommonModule, CurrencyPipe, DatePipe, RouterLink, ReactiveFormsModule,
    MatCardModule, MatButtonModule, MatIconModule, MatTableModule, MatChipsModule,
    MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatSnackBarModule, MatProgressBarModule, MatProgressSpinnerModule, MatTooltipModule,
  ],
  template: `
    <div *ngIf="loading" class="loading-center"><mat-spinner></mat-spinner></div>

    <div *ngIf="!loading && loan">
      <!-- Cabeçalho com botão voltar -->
      <div class="page-header">
        <div>
          <a routerLink="/loans" mat-button><mat-icon>arrow_back</mat-icon> Voltar</a>
          <h2>Empréstimo #{{ loan.id }} — {{ loan.clients?.name }}</h2>
        </div>
        <mat-chip [class]="'loan-' + loan.status">{{ statusLabel(loan.status) }}</mat-chip>
      </div>

      <!-- Cards de resumo do empréstimo -->
      <div class="summary-grid">
        <mat-card class="summary-card">
          <div class="summary-label">Principal</div>
          <div class="summary-value">{{ loan.principal_amount | currency:'BRL' }}</div>
        </mat-card>
        <mat-card class="summary-card">
          <div class="summary-label">Total c/ juros</div>
          <div class="summary-value">{{ loan.total_amount | currency:'BRL' }}</div>
        </mat-card>
        <mat-card class="summary-card">
          <div class="summary-label">Parcelas</div>
          <div class="summary-value">{{ loan.installments_count }}x</div>
        </mat-card>
        <mat-card class="summary-card">
          <div class="summary-label">Taxa mensal</div>
          <div class="summary-value">{{ loan.interest_rate }}%</div>
        </mat-card>
        <mat-card class="summary-card">
          <div class="summary-label">Total pago</div>
          <div class="summary-value">{{ totalPaid | currency:'BRL' }}</div>
        </mat-card>
      </div>

      <!-- Barra de progresso do pagamento -->
      <mat-card class="progress-card">
        <div class="progress-header">
          <span>Progresso do pagamento</span>
          <span>{{ progressPercent }}%</span>
        </div>
        <mat-progress-bar mode="determinate" [value]="progressPercent" color="primary"></mat-progress-bar>
      </mat-card>

      <!-- Tabela de parcelas -->
      <mat-card>
        <mat-card-header>
          <mat-card-title>Parcelas</mat-card-title>
        </mat-card-header>
        <table mat-table [dataSource]="loan.installments" class="full-width">

          <ng-container matColumnDef="number">
            <th mat-header-cell *matHeaderCellDef>#</th>
            <td mat-cell *matCellDef="let i">{{ i.installment_number }}</td>
          </ng-container>

          <ng-container matColumnDef="due_date">
            <th mat-header-cell *matHeaderCellDef>Vencimento</th>
            <td mat-cell *matCellDef="let i">{{ i.due_date | date:'dd/MM/yyyy' }}</td>
          </ng-container>

          <ng-container matColumnDef="amount">
            <th mat-header-cell *matHeaderCellDef>Valor</th>
            <td mat-cell *matCellDef="let i">{{ i.amount | currency:'BRL' }}</td>
          </ng-container>

          <ng-container matColumnDef="paid_amount">
            <th mat-header-cell *matHeaderCellDef>Pago</th>
            <td mat-cell *matCellDef="let i">{{ i.paid_amount | currency:'BRL' }}</td>
          </ng-container>

          <ng-container matColumnDef="remaining">
            <th mat-header-cell *matHeaderCellDef>Restante</th>
            <td mat-cell *matCellDef="let i">{{ (i.amount - i.paid_amount) | currency:'BRL' }}</td>
          </ng-container>

          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef>Status</th>
            <td mat-cell *matCellDef="let i">
              <mat-chip [class]="'inst-' + i.status">{{ instStatusLabel(i.status) }}</mat-chip>
            </td>
          </ng-container>

          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef>Pagar</th>
            <td mat-cell *matCellDef="let i">
              <button mat-icon-button color="primary"
                [disabled]="i.status === 'paid'"
                (click)="openPayment(i)"
                matTooltip="Registrar pagamento">
                <mat-icon>payments</mat-icon>
              </button>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="columns"></tr>
          <tr mat-row *matRowDef="let row; columns: columns;"
              [class.inst-paid-row]="row.status === 'paid'"></tr>
        </table>
      </mat-card>
    </div>

    <!-- Dialog de pagamento -->
    <ng-template #paymentDialog>
      <h2 mat-dialog-title>Registrar Pagamento — Parcela #{{ selectedInstallment?.installment_number }}</h2>
      <mat-dialog-content>
        <p class="payment-info">
          Valor da parcela: <strong>{{ selectedInstallment?.amount | currency:'BRL' }}</strong> |
          Pago até agora: <strong>{{ selectedInstallment?.paid_amount | currency:'BRL' }}</strong> |
          Restante: <strong>{{ remaining | currency:'BRL' }}</strong>
        </p>
        <form [formGroup]="payForm" class="dialog-form">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Valor do pagamento (R$) *</mat-label>
            <input matInput type="number" formControlName="amount" [max]="remaining">
            <mat-error>Valor obrigatório e deve ser até o restante</mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Forma de pagamento *</mat-label>
            <mat-select formControlName="payment_method">
              <mat-option value="cash">Dinheiro</mat-option>
              <mat-option value="pix">PIX</mat-option>
              <mat-option value="transfer">Transferência</mat-option>
              <mat-option value="debit_card">Cartão débito</mat-option>
              <mat-option value="credit_card">Cartão crédito</mat-option>
              <mat-option value="check">Cheque</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Data do pagamento</mat-label>
            <input matInput type="date" formControlName="paid_at">
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Observações</mat-label>
            <textarea matInput formControlName="notes" rows="2"></textarea>
          </mat-form-field>
        </form>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button mat-dialog-close>Cancelar</button>
        <button mat-raised-button color="primary" (click)="savePay()" [disabled]="payForm.invalid || saving">
          {{ saving ? 'Registrando...' : 'Registrar pagamento' }}
        </button>
      </mat-dialog-actions>
    </ng-template>
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .page-header h2 { margin: 4px 0 0; }
    .loading-center { display: flex; justify-content: center; padding: 60px; }
    .full-width { width: 100%; }

    .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px; margin-bottom: 16px; }
    .summary-card { padding: 16px; text-align: center; }
    .summary-label { font-size: .75rem; color: #888; text-transform: uppercase; }
    .summary-value { font-size: 1.1rem; font-weight: 600; margin-top: 4px; }

    .progress-card { padding: 16px; margin-bottom: 16px; }
    .progress-header { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: .9rem; }

    .inst-paid-row { opacity: .6; }
    .payment-info { color: #555; font-size: .9rem; margin-bottom: 12px; }
    .dialog-form { min-width: 360px; display: flex; flex-direction: column; gap: 4px; }

    /* Status das parcelas */
    ::ng-deep .inst-pending { background: #e3f2fd !important; color: #1565c0 !important; }
    ::ng-deep .inst-partial  { background: #fff3e0 !important; color: #e65100 !important; }
    ::ng-deep .inst-paid     { background: #e8f5e9 !important; color: #2e7d32 !important; }
    ::ng-deep .inst-overdue  { background: #ffebee !important; color: #c62828 !important; }

    /* Status do empréstimo */
    ::ng-deep .loan-active   { background: #e3f2fd !important; color: #1565c0 !important; font-size: 1rem !important; }
    ::ng-deep .loan-paid     { background: #e8f5e9 !important; color: #2e7d32 !important; font-size: 1rem !important; }
    ::ng-deep .loan-defaulted { background: #ffebee !important; color: #c62828 !important; font-size: 1rem !important; }
    ::ng-deep .loan-cancelled { background: #eeeeee !important; color: #616161 !important; font-size: 1rem !important; }
  `],
})
export class LoanDetailComponent implements OnInit {
  @ViewChild('paymentDialog') paymentDialog!: TemplateRef<any>;

  columns = ['number', 'due_date', 'amount', 'paid_amount', 'remaining', 'status', 'actions'];
  loan?: Loan;
  loading = true;
  saving  = false;

  selectedInstallment?: Installment;

  payForm = this.fb.group({
    amount:         [null, [Validators.required, Validators.min(0.01)]],
    payment_method: ['pix', Validators.required],
    paid_at:        [''],
    notes:          [''],
  });

  constructor(
    private readonly route:       ActivatedRoute,
    private readonly loanService: LoanService,
    private readonly dialog:      MatDialog,
    private readonly snack:       MatSnackBar,
    private readonly fb:          FormBuilder,
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.loanService.getOne(id).subscribe({
      next:  loan => { this.loan = loan; this.loading = false; },
      error: ()   => { this.loading = false; },
    });
  }

  /** Soma de todos os paid_amount das parcelas. */
  get totalPaid(): number {
    return this.loan?.installments.reduce((s, i) => s + Number(i.paid_amount), 0) ?? 0;
  }

  /** Percentual pago em relação ao total com juros. */
  get progressPercent(): number {
    if (!this.loan?.total_amount) return 0;
    return Math.min(100, Math.round((this.totalPaid / Number(this.loan.total_amount)) * 100));
  }

  /** Saldo restante da parcela selecionada. */
  get remaining(): number {
    if (!this.selectedInstallment) return 0;
    return Number(this.selectedInstallment.amount) - Number(this.selectedInstallment.paid_amount);
  }

  openPayment(installment: Installment): void {
    this.selectedInstallment = installment;
    const remaining = this.remaining;

    this.payForm.reset({ payment_method: 'pix' });
    // Preenche automaticamente com o valor restante
    this.payForm.get('amount')?.setValue(remaining as any);
    this.payForm.get('amount')?.setValidators([Validators.required, Validators.min(0.01), Validators.max(remaining)]);
    this.payForm.get('amount')?.updateValueAndValidity();

    this.dialog.open(this.paymentDialog, { width: '440px' });
  }

  savePay(): void {
    if (this.payForm.invalid || !this.selectedInstallment) return;
    this.saving = true;

    const dto = {
      installment_id: this.selectedInstallment.id,
      ...this.payForm.value,
    };

    this.loanService.pay(dto as any).subscribe({
      next: () => {
        this.snack.open('Pagamento registrado!', 'OK', { duration: 3000 });
        this.dialog.closeAll();
        this.saving = false;
        // Recarrega o empréstimo para atualizar os status das parcelas
        this.ngOnInit();
      },
      error: err => {
        this.snack.open(err.error?.message ?? 'Erro ao registrar.', 'OK', { duration: 4000 });
        this.saving = false;
      },
    });
  }

  statusLabel(s: string): string {
    return ({ active:'Ativo', paid:'Quitado', defaulted:'Inadimplente', cancelled:'Cancelado' } as any)[s] ?? s;
  }

  instStatusLabel(s: string): string {
    return ({ pending:'Pendente', partial:'Parcial', paid:'Pago', overdue:'Vencida' } as any)[s] ?? s;
  }
}

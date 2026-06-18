/**
 * LoansComponent — Lista de empréstimos com criação.
 *
 * Funcionalidades:
 *   - Lista com filtro por status
 *   - Formulário para novo empréstimo (carrega lista de clientes)
 *   - Pré-visualização do valor da parcela calculado pelo backend
 *   - Navegação para detalhe/parcelas ao clicar na linha
 */
import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { LoanService } from '../../core/services/loan.service';
import { ClientService } from '../../core/services/client.service';
import { Loan } from '../../core/models/loan.model';
import { Client } from '../../core/models/client.model';

@Component({
  selector: 'app-loans',
  standalone: true,
  imports: [
    CommonModule, CurrencyPipe, ReactiveFormsModule,
    MatTableModule, MatButtonModule, MatIconModule, MatInputModule,
    MatFormFieldModule, MatSelectModule, MatDialogModule, MatSnackBarModule,
    MatProgressSpinnerModule, MatCardModule, MatChipsModule, MatTooltipModule,
  ],
  template: `
    <div class="page-header">
      <h2>Empréstimos</h2>
      <button mat-raised-button color="primary" (click)="openForm()">
        <mat-icon>add</mat-icon> Novo empréstimo
      </button>
    </div>

    <!-- Filtro por status -->
    <mat-card class="filter-card">
      <mat-form-field appearance="outline">
        <mat-label>Filtrar por status</mat-label>
        <mat-select (selectionChange)="onStatusFilter($event.value)">
          <mat-option value="">Todos</mat-option>
          <mat-option value="active">Ativo</mat-option>
          <mat-option value="paid">Quitado</mat-option>
          <mat-option value="defaulted">Inadimplente</mat-option>
          <mat-option value="cancelled">Cancelado</mat-option>
        </mat-select>
      </mat-form-field>
    </mat-card>

    <div *ngIf="loading" class="loading-center"><mat-spinner></mat-spinner></div>

    <mat-card *ngIf="!loading">
      <table mat-table [dataSource]="loans" class="full-width">

        <ng-container matColumnDef="client">
          <th mat-header-cell *matHeaderCellDef>Cliente</th>
          <td mat-cell *matCellDef="let l">{{ l.clients?.name }}</td>
        </ng-container>

        <ng-container matColumnDef="principal">
          <th mat-header-cell *matHeaderCellDef>Principal</th>
          <td mat-cell *matCellDef="let l">{{ l.principal_amount | currency:'BRL' }}</td>
        </ng-container>

        <ng-container matColumnDef="total">
          <th mat-header-cell *matHeaderCellDef>Total c/ juros</th>
          <td mat-cell *matCellDef="let l">{{ l.total_amount | currency:'BRL' }}</td>
        </ng-container>

        <ng-container matColumnDef="installments">
          <th mat-header-cell *matHeaderCellDef>Parcelas</th>
          <td mat-cell *matCellDef="let l">{{ l.installments_count }}x</td>
        </ng-container>

        <ng-container matColumnDef="rate">
          <th mat-header-cell *matHeaderCellDef>Juros/mês</th>
          <td mat-cell *matCellDef="let l">{{ l.interest_rate }}%</td>
        </ng-container>

        <ng-container matColumnDef="status">
          <th mat-header-cell *matHeaderCellDef>Status</th>
          <td mat-cell *matCellDef="let l">
            <mat-chip [class]="'loan-' + l.status">{{ statusLabel(l.status) }}</mat-chip>
          </td>
        </ng-container>

        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef>Ações</th>
          <td mat-cell *matCellDef="let l">
            <button mat-icon-button color="primary" (click)="goToDetail(l.id)" matTooltip="Ver parcelas">
              <mat-icon>visibility</mat-icon>
            </button>
          </td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="columns"></tr>
        <tr mat-row *matRowDef="let row; columns: columns;" class="clickable-row" (click)="goToDetail(row.id)"></tr>
      </table>
      <p class="empty-msg" *ngIf="loans.length === 0">Nenhum empréstimo encontrado.</p>
    </mat-card>

    <!-- Formulário de novo empréstimo -->
    <ng-template #formDialog>
      <h2 mat-dialog-title>Novo Empréstimo</h2>
      <mat-dialog-content>
        <form [formGroup]="form" class="dialog-form">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Cliente *</mat-label>
            <mat-select formControlName="client_id">
              <mat-option *ngFor="let c of activeClients" [value]="c.id">{{ c.name }}</mat-option>
            </mat-select>
            <mat-error>Selecione um cliente</mat-error>
          </mat-form-field>

          <div class="row-2">
            <mat-form-field appearance="outline">
              <mat-label>Valor principal (R$) *</mat-label>
              <input matInput type="number" formControlName="principal_amount" min="0.01">
              <mat-error>Valor obrigatório</mat-error>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Taxa de juros (% a.m.)</mat-label>
              <input matInput type="number" formControlName="interest_rate" min="0">
            </mat-form-field>
          </div>

          <div class="row-2">
            <mat-form-field appearance="outline">
              <mat-label>Nº de parcelas *</mat-label>
              <input matInput type="number" formControlName="installments_count" min="1" max="360">
              <mat-error>Entre 1 e 360</mat-error>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Data de concessão *</mat-label>
              <input matInput type="date" formControlName="start_date">
            </mat-form-field>
          </div>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Vencimento da 1ª parcela *</mat-label>
            <input matInput type="date" formControlName="first_due_date">
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Observações</mat-label>
            <textarea matInput formControlName="notes" rows="2"></textarea>
          </mat-form-field>
        </form>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button mat-dialog-close>Cancelar</button>
        <button mat-raised-button color="primary" (click)="save()" [disabled]="form.invalid || saving">
          {{ saving ? 'Criando...' : 'Criar empréstimo' }}
        </button>
      </mat-dialog-actions>
    </ng-template>
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .filter-card { padding: 16px; margin-bottom: 16px; }
    .full-width { width: 100%; }
    .loading-center { display: flex; justify-content: center; padding: 40px; }
    .empty-msg { text-align: center; color: #888; padding: 24px; }
    .row-2 { display: flex; gap: 12px; }
    .row-2 mat-form-field { flex: 1; }
    .dialog-form { min-width: 400px; display: flex; flex-direction: column; gap: 4px; }
    .clickable-row:hover { background: #f5f5f5; cursor: pointer; }

    ::ng-deep .loan-active   { background: #e3f2fd !important; color: #1565c0 !important; }
    ::ng-deep .loan-paid     { background: #e8f5e9 !important; color: #2e7d32 !important; }
    ::ng-deep .loan-defaulted { background: #ffebee !important; color: #c62828 !important; }
    ::ng-deep .loan-cancelled { background: #eeeeee !important; color: #616161 !important; }
  `],
})
export class LoansComponent implements OnInit {
  @ViewChild('formDialog') formDialog!: TemplateRef<any>;

  columns      = ['client', 'principal', 'total', 'installments', 'rate', 'status', 'actions'];
  loans: Loan[]       = [];
  activeClients: Client[] = [];
  loading = true;
  saving  = false;

  form = this.fb.group({
    client_id:          [null, Validators.required],
    principal_amount:   [null, [Validators.required, Validators.min(0.01)]],
    interest_rate:      [0,   [Validators.min(0), Validators.max(100)]],
    installments_count: [null, [Validators.required, Validators.min(1), Validators.max(360)]],
    start_date:         ['', Validators.required],
    first_due_date:     ['', Validators.required],
    notes:              [''],
  });

  constructor(
    private readonly loanService:   LoanService,
    private readonly clientService: ClientService,
    private readonly dialog: MatDialog,
    private readonly snack:  MatSnackBar,
    private readonly router: Router,
    private readonly fb:     FormBuilder,
  ) {}

  ngOnInit(): void { this.load(); }

  load(status?: string): void {
    this.loading = true;
    this.loanService.getAll(status).subscribe({
      next:  ls => { this.loans = ls; this.loading = false; },
      error: ()  => { this.loading = false; },
    });
  }

  onStatusFilter(status: string): void { this.load(status || undefined); }

  openForm(): void {
    // Carrega apenas clientes ativos para o select
    this.clientService.getAll(undefined, 'active').subscribe(cs => {
      this.activeClients = cs;
      this.form.reset({ interest_rate: 0 });
      this.dialog.open(this.formDialog, { width: '520px' });
    });
  }

  save(): void {
    if (this.form.invalid) return;
    this.saving = true;

    this.loanService.create(this.form.value as any).subscribe({
      next: loan => {
        this.snack.open('Empréstimo criado com sucesso!', 'OK', { duration: 3000 });
        this.dialog.closeAll();
        this.saving = false;
        this.load();
        // Navega direto para o detalhe para ver as parcelas geradas
        this.router.navigate(['/loans', loan.id]);
      },
      error: err => {
        this.snack.open(err.error?.message ?? 'Erro ao criar.', 'OK', { duration: 4000 });
        this.saving = false;
      },
    });
  }

  goToDetail(id: number): void { this.router.navigate(['/loans', id]); }

  statusLabel(s: string): string {
    return ({ active:'Ativo', paid:'Quitado', defaulted:'Inadimplente', cancelled:'Cancelado' } as any)[s] ?? s;
  }
}

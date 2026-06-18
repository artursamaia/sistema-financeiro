/**
 * IncomesComponent — CRUD de receitas com filtro por mês.
 */
import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FinanceService } from '../../core/services/finance.service';
import { Income } from '../../core/models/finance.model';

@Component({
  selector: 'app-incomes',
  standalone: true,
  imports: [
    CommonModule, CurrencyPipe, DatePipe, ReactiveFormsModule, FormsModule,
    MatCardModule, MatTableModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatDialogModule, MatSnackBarModule, MatProgressSpinnerModule,
    MatCheckboxModule, MatTooltipModule,
  ],
  template: `
    <div class="page-header">
      <h2>Receitas</h2>
      <button mat-raised-button color="primary" (click)="openForm()">
        <mat-icon>add</mat-icon> Nova receita
      </button>
    </div>

    <!-- Filtro de período -->
    <mat-card class="filter-card">
      <mat-form-field appearance="outline">
        <mat-label>Mês</mat-label>
        <mat-select [(value)]="selectedMonth" (selectionChange)="load()">
          <mat-option *ngFor="let m of months; let i = index" [value]="i + 1">{{ m }}</mat-option>
        </mat-select>
      </mat-form-field>
      <mat-form-field appearance="outline" style="width:110px">
        <mat-label>Ano</mat-label>
        <input matInput type="number" [(ngModel)]="selectedYear" (change)="load()" [ngModelOptions]="{standalone: true}">
      </mat-form-field>
    </mat-card>

    <div *ngIf="loading" class="loading-center"><mat-spinner></mat-spinner></div>

    <mat-card *ngIf="!loading">
      <!-- Total do período -->
      <div class="period-total">
        Total do período: <strong>{{ total | currency:'BRL' }}</strong>
      </div>

      <table mat-table [dataSource]="incomes" class="full-width">
        <ng-container matColumnDef="description">
          <th mat-header-cell *matHeaderCellDef>Descrição</th>
          <td mat-cell *matCellDef="let i">{{ i.description }}</td>
        </ng-container>
        <ng-container matColumnDef="amount">
          <th mat-header-cell *matHeaderCellDef>Valor</th>
          <td mat-cell *matCellDef="let i">{{ i.amount | currency:'BRL' }}</td>
        </ng-container>
        <ng-container matColumnDef="received_at">
          <th mat-header-cell *matHeaderCellDef>Recebido em</th>
          <td mat-cell *matCellDef="let i">{{ i.received_at | date:'dd/MM/yyyy' }}</td>
        </ng-container>
        <ng-container matColumnDef="recurring">
          <th mat-header-cell *matHeaderCellDef>Recorrente</th>
          <td mat-cell *matCellDef="let i">{{ i.is_recurring ? 'Sim' : 'Não' }}</td>
        </ng-container>
        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef>Ações</th>
          <td mat-cell *matCellDef="let i">
            <button mat-icon-button color="primary" (click)="openForm(i)" matTooltip="Editar"><mat-icon>edit</mat-icon></button>
            <button mat-icon-button color="warn" (click)="remove(i)" matTooltip="Excluir"><mat-icon>delete</mat-icon></button>
          </td>
        </ng-container>
        <tr mat-header-row *matHeaderRowDef="columns"></tr>
        <tr mat-row *matRowDef="let r; columns: columns;"></tr>
      </table>
      <p class="empty-msg" *ngIf="incomes.length === 0">Nenhuma receita neste período.</p>
    </mat-card>

    <!-- Formulário -->
    <ng-template #formDialog>
      <h2 mat-dialog-title>{{ editingId ? 'Editar' : 'Nova' }} Receita</h2>
      <mat-dialog-content>
        <form [formGroup]="form" class="dialog-form">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Descrição *</mat-label>
            <input matInput formControlName="description">
          </mat-form-field>
          <div class="row-2">
            <mat-form-field appearance="outline">
              <mat-label>Valor (R$) *</mat-label>
              <input matInput type="number" formControlName="amount" min="0.01">
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Data de recebimento *</mat-label>
              <input matInput type="date" formControlName="received_at">
            </mat-form-field>
          </div>
          <mat-checkbox formControlName="is_recurring">Receita recorrente</mat-checkbox>
          <mat-form-field appearance="outline" class="full-width" style="margin-top:8px">
            <mat-label>Observações</mat-label>
            <textarea matInput formControlName="notes" rows="2"></textarea>
          </mat-form-field>
        </form>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button mat-dialog-close>Cancelar</button>
        <button mat-raised-button color="primary" (click)="save()" [disabled]="form.invalid || saving">
          {{ saving ? 'Salvando...' : 'Salvar' }}
        </button>
      </mat-dialog-actions>
    </ng-template>
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .filter-card { display: flex; gap: 16px; padding: 16px; margin-bottom: 16px; }
    .period-total { padding: 12px 16px; background: #f5f5f5; border-radius: 4px; margin-bottom: 12px; }
    .full-width { width: 100%; }
    .loading-center { display: flex; justify-content: center; padding: 40px; }
    .empty-msg { text-align: center; color: #888; padding: 24px; }
    .row-2 { display: flex; gap: 12px; }
    .row-2 mat-form-field { flex: 1; }
    .dialog-form { min-width: 380px; display: flex; flex-direction: column; gap: 4px; }
  `],
})
export class IncomesComponent implements OnInit {
  @ViewChild('formDialog') formDialog!: TemplateRef<any>;

  columns = ['description', 'amount', 'received_at', 'recurring', 'actions'];
  incomes: Income[] = [];
  loading = true;
  saving  = false;
  editingId?: number;

  months = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
  selectedMonth = new Date().getMonth() + 1;
  selectedYear  = new Date().getFullYear();

  form = this.fb.group({
    description:  ['', Validators.required],
    amount:       [null, [Validators.required, Validators.min(0.01)]],
    received_at:  ['', Validators.required],
    is_recurring: [false],
    notes:        [''],
  });

  constructor(
    private readonly financeService: FinanceService,
    private readonly dialog: MatDialog,
    private readonly snack:  MatSnackBar,
    private readonly fb:     FormBuilder,
  ) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.financeService.getIncomes(this.selectedMonth, this.selectedYear).subscribe({
      next:  is => { this.incomes = is; this.loading = false; },
      error: ()  => { this.loading = false; },
    });
  }

  get total(): number {
    return this.incomes.reduce((s, i) => s + Number(i.amount), 0);
  }

  openForm(income?: Income): void {
    this.editingId = income?.id;
    this.form.reset({ is_recurring: false });
    if (income) this.form.patchValue({ ...income, received_at: income.received_at?.substring(0, 10) } as any);
    this.dialog.open(this.formDialog, { width: '460px' });
  }

  save(): void {
    if (this.form.invalid) return;
    this.saving = true;

    const dto = this.form.value as any;
    const op  = this.editingId
      ? this.financeService.updateIncome(this.editingId, dto)
      : this.financeService.createIncome(dto);

    op.subscribe({
      next: () => { this.snack.open('Salvo!', 'OK', { duration: 2500 }); this.dialog.closeAll(); this.saving = false; this.load(); },
      error: err => { this.snack.open(err.error?.message ?? 'Erro.', 'OK', { duration: 4000 }); this.saving = false; },
    });
  }

  remove(income: Income): void {
    if (!confirm(`Excluir receita "${income.description}"?`)) return;
    this.financeService.deleteIncome(income.id).subscribe({
      next:  () => { this.snack.open('Excluída.', 'OK', { duration: 2500 }); this.load(); },
      error: err => this.snack.open(err.error?.message ?? 'Erro.', 'OK', { duration: 4000 }),
    });
  }
}

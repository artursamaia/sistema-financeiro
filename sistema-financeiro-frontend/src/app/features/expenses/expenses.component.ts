/**
 * ExpensesComponent — CRUD de despesas com categoria e status de pagamento.
 */
import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
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
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FinanceService } from '../../core/services/finance.service';
import { Expense, ExpenseCategory } from '../../core/models/finance.model';

@Component({
  selector: 'app-expenses',
  standalone: true,
  imports: [
    CommonModule, CurrencyPipe, DatePipe, ReactiveFormsModule, FormsModule,
    MatCardModule, MatTableModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatDialogModule, MatSnackBarModule, MatProgressSpinnerModule,
    MatCheckboxModule, MatChipsModule, MatTooltipModule,
  ],
  template: `
    <div class="page-header">
      <h2>Despesas</h2>
      <button mat-raised-button color="primary" (click)="openForm()">
        <mat-icon>add</mat-icon> Nova despesa
      </button>
    </div>

    <!-- Filtros -->
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
      <div class="period-total">
        Total pago no período: <strong>{{ totalPaid | currency:'BRL' }}</strong> &nbsp;|&nbsp;
        Total previsto: <strong>{{ totalAll | currency:'BRL' }}</strong>
      </div>

      <table mat-table [dataSource]="expenses" class="full-width">
        <ng-container matColumnDef="description">
          <th mat-header-cell *matHeaderCellDef>Descrição</th>
          <td mat-cell *matCellDef="let e">{{ e.description }}</td>
        </ng-container>
        <ng-container matColumnDef="category">
          <th mat-header-cell *matHeaderCellDef>Categoria</th>
          <td mat-cell *matCellDef="let e">{{ e.expense_categories?.name || '—' }}</td>
        </ng-container>
        <ng-container matColumnDef="amount">
          <th mat-header-cell *matHeaderCellDef>Valor</th>
          <td mat-cell *matCellDef="let e">{{ e.amount | currency:'BRL' }}</td>
        </ng-container>
        <ng-container matColumnDef="due_date">
          <th mat-header-cell *matHeaderCellDef>Vencimento</th>
          <td mat-cell *matCellDef="let e">{{ e.due_date | date:'dd/MM/yyyy' }}</td>
        </ng-container>
        <ng-container matColumnDef="status">
          <th mat-header-cell *matHeaderCellDef>Status</th>
          <td mat-cell *matCellDef="let e">
            <mat-chip [class]="e.is_paid ? 'paid' : 'unpaid'">{{ e.is_paid ? 'Paga' : 'Em aberto' }}</mat-chip>
          </td>
        </ng-container>
        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef>Ações</th>
          <td mat-cell *matCellDef="let e">
            <button mat-icon-button color="primary" (click)="openForm(e)" matTooltip="Editar"><mat-icon>edit</mat-icon></button>
            <button mat-icon-button color="warn" (click)="remove(e)" matTooltip="Excluir"><mat-icon>delete</mat-icon></button>
          </td>
        </ng-container>
        <tr mat-header-row *matHeaderRowDef="columns"></tr>
        <tr mat-row *matRowDef="let r; columns: columns;" [class.paid-row]="r.is_paid"></tr>
      </table>
      <p class="empty-msg" *ngIf="expenses.length === 0">Nenhuma despesa neste período.</p>
    </mat-card>

    <!-- Formulário -->
    <ng-template #formDialog>
      <h2 mat-dialog-title>{{ editingId ? 'Editar' : 'Nova' }} Despesa</h2>
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
              <mat-label>Categoria</mat-label>
              <mat-select formControlName="category_id">
                <mat-option [value]="null">Sem categoria</mat-option>
                <mat-option *ngFor="let c of categories" [value]="c.id">{{ c.name }}</mat-option>
              </mat-select>
            </mat-form-field>
          </div>

          <div class="row-2">
            <mat-form-field appearance="outline">
              <mat-label>Vencimento *</mat-label>
              <input matInput type="date" formControlName="due_date">
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Data de pagamento</mat-label>
              <input matInput type="date" formControlName="paid_at">
            </mat-form-field>
          </div>

          <div class="checkboxes">
            <mat-checkbox formControlName="is_paid">Paga</mat-checkbox>
            <mat-checkbox formControlName="is_fixed">Fixa (recorrente)</mat-checkbox>
          </div>

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
    .checkboxes { display: flex; gap: 16px; }
    .dialog-form { min-width: 400px; display: flex; flex-direction: column; gap: 4px; }
    .paid-row { opacity: .7; }

    ::ng-deep .paid   { background: #e8f5e9 !important; color: #2e7d32 !important; }
    ::ng-deep .unpaid { background: #fff3e0 !important; color: #e65100 !important; }
  `],
})
export class ExpensesComponent implements OnInit {
  @ViewChild('formDialog') formDialog!: TemplateRef<any>;

  columns = ['description', 'category', 'amount', 'due_date', 'status', 'actions'];
  expenses: Expense[] = [];
  categories: ExpenseCategory[] = [];
  loading = true;
  saving  = false;
  editingId?: number;

  months = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
  selectedMonth = new Date().getMonth() + 1;
  selectedYear  = new Date().getFullYear();

  form = this.fb.group({
    description: ['', Validators.required],
    amount:      [null, [Validators.required, Validators.min(0.01)]],
    category_id: [null],
    due_date:    ['', Validators.required],
    paid_at:     [''],
    is_paid:     [false],
    is_fixed:    [false],
    notes:       [''],
  });

  constructor(
    private readonly financeService: FinanceService,
    private readonly dialog: MatDialog,
    private readonly snack:  MatSnackBar,
    private readonly fb:     FormBuilder,
  ) {}

  ngOnInit(): void {
    // Carrega categorias uma vez (não mudam com filtro de mês)
    this.financeService.getCategories().subscribe(cs => this.categories = cs);
    this.load();
  }

  load(): void {
    this.loading = true;
    this.financeService.getExpenses(this.selectedMonth, this.selectedYear).subscribe({
      next:  es => { this.expenses = es; this.loading = false; },
      error: ()  => { this.loading = false; },
    });
  }

  get totalPaid(): number  { return this.expenses.filter(e => e.is_paid).reduce((s, e) => s + Number(e.amount), 0); }
  get totalAll(): number   { return this.expenses.reduce((s, e) => s + Number(e.amount), 0); }

  openForm(expense?: Expense): void {
    this.editingId = expense?.id;
    this.form.reset({ is_paid: false, is_fixed: false, category_id: null });
    if (expense) {
      this.form.patchValue({
        ...expense,
        due_date: expense.due_date?.substring(0, 10),
        paid_at:  expense.paid_at?.substring(0, 10) ?? '',
      } as any);
    }
    this.dialog.open(this.formDialog, { width: '480px' });
  }

  save(): void {
    if (this.form.invalid) return;
    this.saving = true;

    const raw = this.form.value as any;
    // Remove paid_at se vazio para não enviar string vazia para a API
    if (!raw.paid_at) delete raw.paid_at;

    const op = this.editingId
      ? this.financeService.updateExpense(this.editingId, raw)
      : this.financeService.createExpense(raw);

    op.subscribe({
      next: () => { this.snack.open('Salvo!', 'OK', { duration: 2500 }); this.dialog.closeAll(); this.saving = false; this.load(); },
      error: err => { this.snack.open(err.error?.message ?? 'Erro.', 'OK', { duration: 4000 }); this.saving = false; },
    });
  }

  remove(expense: Expense): void {
    if (!confirm(`Excluir despesa "${expense.description}"?`)) return;
    this.financeService.deleteExpense(expense.id).subscribe({
      next:  () => { this.snack.open('Excluída.', 'OK', { duration: 2500 }); this.load(); },
      error: err => this.snack.open(err.error?.message ?? 'Erro.', 'OK', { duration: 4000 }),
    });
  }
}

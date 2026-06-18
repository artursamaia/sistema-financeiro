/**
 * ClientsComponent — CRUD completo de clientes.
 *
 * Funcionalidades:
 *   - Lista clientes com busca por nome/CPF e filtro por status
 *   - Formulário inline (MatDialog) para criar e editar
 *   - Confirmação antes de excluir
 *   - Badge colorido por status (ativo / inativo / inadimplente)
 */
import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
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
import { ClientService } from '../../core/services/client.service';
import { Client } from '../../core/models/client.model';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';

@Component({
  selector: 'app-clients',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatTableModule, MatButtonModule, MatIconModule, MatInputModule,
    MatFormFieldModule, MatSelectModule, MatDialogModule, MatSnackBarModule,
    MatProgressSpinnerModule, MatCardModule, MatChipsModule, MatTooltipModule,
  ],
  template: `
    <div class="page-header">
      <h2>Clientes</h2>
      <button mat-raised-button color="primary" (click)="openForm()">
        <mat-icon>add</mat-icon> Novo cliente
      </button>
    </div>

    <!-- Barra de filtros -->
    <mat-card class="filter-card">
      <mat-form-field appearance="outline" class="search-field">
        <mat-label>Buscar por nome ou CPF</mat-label>
        <input matInput (input)="onSearch($event)">
        <mat-icon matSuffix>search</mat-icon>
      </mat-form-field>

      <mat-form-field appearance="outline" class="status-field">
        <mat-label>Status</mat-label>
        <mat-select (selectionChange)="onStatusFilter($event.value)">
          <mat-option value="">Todos</mat-option>
          <mat-option value="active">Ativo</mat-option>
          <mat-option value="inactive">Inativo</mat-option>
          <mat-option value="defaulted">Inadimplente</mat-option>
        </mat-select>
      </mat-form-field>
    </mat-card>

    <!-- Spinner de carregamento -->
    <div *ngIf="loading" class="loading-center"><mat-spinner></mat-spinner></div>

    <!-- Tabela de clientes -->
    <mat-card *ngIf="!loading">
      <table mat-table [dataSource]="clients" class="full-width">

        <ng-container matColumnDef="name">
          <th mat-header-cell *matHeaderCellDef>Nome</th>
          <td mat-cell *matCellDef="let c">{{ c.name }}</td>
        </ng-container>

        <ng-container matColumnDef="cpf">
          <th mat-header-cell *matHeaderCellDef>CPF</th>
          <td mat-cell *matCellDef="let c">{{ c.cpf || '—' }}</td>
        </ng-container>

        <ng-container matColumnDef="phone">
          <th mat-header-cell *matHeaderCellDef>Telefone</th>
          <td mat-cell *matCellDef="let c">{{ c.phone || '—' }}</td>
        </ng-container>

        <ng-container matColumnDef="city">
          <th mat-header-cell *matHeaderCellDef>Cidade/UF</th>
          <td mat-cell *matCellDef="let c">{{ c.city || '—' }}{{ c.state ? '/' + c.state : '' }}</td>
        </ng-container>

        <ng-container matColumnDef="status">
          <th mat-header-cell *matHeaderCellDef>Status</th>
          <td mat-cell *matCellDef="let c">
            <mat-chip [class]="'status-' + c.status">{{ statusLabel(c.status) }}</mat-chip>
          </td>
        </ng-container>

        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef>Ações</th>
          <td mat-cell *matCellDef="let c">
            <button mat-icon-button color="primary" (click)="openForm(c)" matTooltip="Editar">
              <mat-icon>edit</mat-icon>
            </button>
            <button mat-icon-button color="warn" (click)="confirmDelete(c)" matTooltip="Excluir">
              <mat-icon>delete</mat-icon>
            </button>
          </td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="columns"></tr>
        <tr mat-row *matRowDef="let row; columns: columns;"></tr>
      </table>

      <p class="empty-msg" *ngIf="clients.length === 0">Nenhum cliente encontrado.</p>
    </mat-card>

    <!-- Dialog de cadastro/edição -->
    <ng-template #formDialog>
      <h2 mat-dialog-title>{{ editingId ? 'Editar' : 'Novo' }} Cliente</h2>
      <mat-dialog-content>
        <form [formGroup]="form" class="dialog-form">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Nome *</mat-label>
            <input matInput formControlName="name">
            <mat-error>Nome obrigatório (mín. 2 chars)</mat-error>
          </mat-form-field>

          <div class="row-2">
            <mat-form-field appearance="outline">
              <mat-label>CPF</mat-label>
              <input matInput formControlName="cpf" placeholder="000.000.000-00">
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Telefone</mat-label>
              <input matInput formControlName="phone">
            </mat-form-field>
          </div>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>E-mail</mat-label>
            <input matInput type="email" formControlName="email">
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Endereço</mat-label>
            <input matInput formControlName="address">
          </mat-form-field>

          <div class="row-2">
            <mat-form-field appearance="outline">
              <mat-label>Cidade</mat-label>
              <input matInput formControlName="city">
            </mat-form-field>
            <mat-form-field appearance="outline" style="max-width:100px">
              <mat-label>UF</mat-label>
              <input matInput formControlName="state" maxlength="2">
            </mat-form-field>
          </div>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Status</mat-label>
            <mat-select formControlName="status">
              <mat-option value="active">Ativo</mat-option>
              <mat-option value="inactive">Inativo</mat-option>
              <mat-option value="defaulted">Inadimplente</mat-option>
            </mat-select>
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
          {{ saving ? 'Salvando...' : 'Salvar' }}
        </button>
      </mat-dialog-actions>
    </ng-template>
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .filter-card { display: flex; gap: 16px; padding: 16px; margin-bottom: 16px; flex-wrap: wrap; }
    .search-field { flex: 1; min-width: 200px; }
    .status-field { width: 180px; }
    .full-width { width: 100%; }
    .loading-center { display: flex; justify-content: center; padding: 40px; }
    .empty-msg { text-align: center; color: #888; padding: 24px; }
    .row-2 { display: flex; gap: 12px; }
    .row-2 mat-form-field { flex: 1; }
    .dialog-form { min-width: 400px; display: flex; flex-direction: column; gap: 4px; }

    /* Badges de status */
    ::ng-deep .status-active   { background: #e8f5e9 !important; color: #2e7d32 !important; }
    ::ng-deep .status-inactive { background: #eeeeee !important; color: #616161 !important; }
    ::ng-deep .status-defaulted { background: #ffebee !important; color: #c62828 !important; }
  `],
})
export class ClientsComponent implements OnInit {
  @ViewChild('formDialog') formDialog!: TemplateRef<any>;

  columns = ['name', 'cpf', 'phone', 'city', 'status', 'actions'];
  clients: Client[] = [];
  loading = true;
  saving  = false;

  editingId?: number;
  private searchTerm  = '';
  private statusFilter = '';

  // Subject para debounce na busca (evita requisição a cada tecla)
  private search$ = new Subject<string>();

  form = this.fb.group({
    name:    ['', [Validators.required, Validators.minLength(2)]],
    cpf:     [''],
    phone:   [''],
    email:   [''],
    address: [''],
    city:    [''],
    state:   [''],
    status:  ['active'],
    notes:   [''],
  });

  constructor(
    private readonly clientService: ClientService,
    private readonly dialog: MatDialog,
    private readonly snack:  MatSnackBar,
    private readonly fb:     FormBuilder,
  ) {}

  ngOnInit(): void {
    // Aguarda 400ms após parar de digitar para buscar
    this.search$.pipe(debounceTime(400), distinctUntilChanged())
      .subscribe(term => { this.searchTerm = term; this.load(); });

    this.load();
  }

  load(): void {
    this.loading = true;
    this.clientService.getAll(this.searchTerm, this.statusFilter).subscribe({
      next:  cs => { this.clients = cs; this.loading = false; },
      error: ()  => { this.loading = false; },
    });
  }

  onSearch(event: Event): void {
    this.search$.next((event.target as HTMLInputElement).value);
  }

  onStatusFilter(status: string): void {
    this.statusFilter = status;
    this.load();
  }

  openForm(client?: Client): void {
    this.editingId = client?.id;
    this.form.reset({ status: 'active' });
    if (client) this.form.patchValue(client);
    this.dialog.open(this.formDialog, { width: '500px' });
  }

  save(): void {
    if (this.form.invalid) return;
    this.saving = true;

    const dto = this.form.value as any;
    const op  = this.editingId
      ? this.clientService.update(this.editingId, dto)
      : this.clientService.create(dto);

    op.subscribe({
      next: () => {
        this.snack.open(`Cliente ${this.editingId ? 'atualizado' : 'criado'} com sucesso!`, 'OK', { duration: 3000 });
        this.dialog.closeAll();
        this.saving = false;
        this.load();
      },
      error: err => {
        this.snack.open(err.error?.message ?? 'Erro ao salvar.', 'OK', { duration: 4000 });
        this.saving = false;
      },
    });
  }

  confirmDelete(client: Client): void {
    if (!confirm(`Excluir cliente "${client.name}"?`)) return;

    this.clientService.remove(client.id).subscribe({
      next:  () => { this.snack.open('Cliente excluído.', 'OK', { duration: 3000 }); this.load(); },
      error: err => this.snack.open(err.error?.message ?? 'Não foi possível excluir.', 'OK', { duration: 4000 }),
    });
  }

  statusLabel(status: string): string {
    return ({ active: 'Ativo', inactive: 'Inativo', defaulted: 'Inadimplente' } as any)[status] ?? status;
  }
}

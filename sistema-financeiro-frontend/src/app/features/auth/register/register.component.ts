/**
 * RegisterComponent — Tela de cadastro de novo usuário.
 *
 * Validações implementadas:
 *   - Nome obrigatório (mín. 3 chars)
 *   - E-mail válido
 *   - Senha: mín. 8 chars, obrigatória maiúscula, minúscula e número
 *   - Confirmação de senha deve ser idêntica
 */
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/services/auth.service';

/** Validador customizado: confirma que as senhas são iguais. */
function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password')?.value;
  const confirm  = control.get('confirmPassword')?.value;
  return password === confirm ? null : { passwordMismatch: true };
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule, RouterLink, ReactiveFormsModule,
    MatCardModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule, MatProgressSpinnerModule,
  ],
  template: `
    <div class="auth-page">
      <mat-card class="auth-card">
        <mat-card-header>
          <mat-icon mat-card-avatar>person_add</mat-icon>
          <mat-card-title>Criar Conta</mat-card-title>
          <mat-card-subtitle>Preencha os dados para se cadastrar</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <form [formGroup]="form" (ngSubmit)="submit()">

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Nome completo</mat-label>
              <input matInput formControlName="name">
              <mat-error *ngIf="form.get('name')?.hasError('required')">Nome obrigatório</mat-error>
              <mat-error *ngIf="form.get('name')?.hasError('minlength')">Mínimo 3 caracteres</mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>E-mail</mat-label>
              <input matInput type="email" formControlName="email">
              <mat-error *ngIf="form.get('email')?.hasError('required')">E-mail obrigatório</mat-error>
              <mat-error *ngIf="form.get('email')?.hasError('email')">E-mail inválido</mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Senha</mat-label>
              <input matInput [type]="hide ? 'password' : 'text'" formControlName="password">
              <button mat-icon-button matSuffix type="button" (click)="hide = !hide">
                <mat-icon>{{ hide ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
              <mat-hint>Mín. 8 chars, com maiúscula, minúscula e número</mat-hint>
              <mat-error *ngIf="form.get('password')?.hasError('pattern')">
                Senha fraca — inclua maiúscula, minúscula e número
              </mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Confirmar senha</mat-label>
              <input matInput type="password" formControlName="confirmPassword">
              <mat-error *ngIf="form.hasError('passwordMismatch') && form.get('confirmPassword')?.dirty">
                As senhas não coincidem
              </mat-error>
            </mat-form-field>

            <p class="error-msg" *ngIf="errorMsg">{{ errorMsg }}</p>

            <button mat-raised-button color="primary" type="submit"
                    class="full-width submit-btn" [disabled]="form.invalid || loading">
              <mat-spinner diameter="20" *ngIf="loading"></mat-spinner>
              <span *ngIf="!loading">Criar conta</span>
            </button>
          </form>
        </mat-card-content>

        <mat-card-actions align="end">
          <a routerLink="/login" mat-button>Já tenho conta</a>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .auth-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #f5f5f5; }
    .auth-card { width: 100%; max-width: 440px; padding: 16px; }
    .full-width { width: 100%; }
    .submit-btn { margin-top: 12px; height: 44px; }
    .error-msg { color: #f44336; font-size: .85rem; }
  `],
})
export class RegisterComponent {
  // Regex do backend: ao menos 1 maiúscula, 1 minúscula, 1 dígito
  private readonly PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/;

  form = this.fb.group({
    name:            ['', [Validators.required, Validators.minLength(3)]],
    email:           ['', [Validators.required, Validators.email]],
    password:        ['', [Validators.required, Validators.minLength(8), Validators.pattern(this.PASSWORD_REGEX)]],
    confirmPassword: ['', Validators.required],
  }, { validators: passwordMatchValidator });

  loading  = false;
  hide     = true;
  errorMsg = '';

  constructor(
    private readonly fb:          FormBuilder,
    private readonly authService: AuthService,
    private readonly router:      Router,
  ) {}

  submit(): void {
    if (this.form.invalid) return;

    this.loading  = true;
    this.errorMsg = '';

    const { name, email, password } = this.form.value;

    this.authService.register(name!, email!, password!).subscribe({
      next:  () => this.router.navigate(['/dashboard']),
      error: (err) => {
        this.errorMsg = err.error?.message ?? 'Erro ao criar conta. Tente novamente.';
        this.loading  = false;
      },
    });
  }
}

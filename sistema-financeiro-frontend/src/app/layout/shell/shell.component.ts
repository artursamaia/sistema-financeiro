/**
 * ShellComponent — Layout principal com sidebar e header.
 *
 * É o "container" de todas as rotas autenticadas.
 * Usa o MatSidenav do Angular Material para a navegação lateral,
 * com suporte a abertura/fechamento no mobile (modo 'over').
 *
 * O <router-outlet> dentro do mat-sidenav-content renderiza
 * cada feature (dashboard, clientes, etc.) conforme a rota ativa.
 */
import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    CommonModule, RouterOutlet, RouterLink, RouterLinkActive,
    MatSidenavModule, MatToolbarModule, MatListModule,
    MatIconModule, MatButtonModule,
  ],
  template: `
    <mat-sidenav-container class="shell-container">

      <!-- Sidebar de navegação -->
      <mat-sidenav #sidenav mode="side" opened class="sidenav">
        <div class="sidenav-header">
          <mat-icon>account_balance_wallet</mat-icon>
          <span>SisFinanças</span>
        </div>

        <mat-nav-list>
          <a mat-list-item routerLink="/dashboard" routerLinkActive="active-link">
            <mat-icon matListItemIcon>dashboard</mat-icon>
            <span matListItemTitle>Dashboard</span>
          </a>
          <a mat-list-item routerLink="/clients" routerLinkActive="active-link">
            <mat-icon matListItemIcon>people</mat-icon>
            <span matListItemTitle>Clientes</span>
          </a>
          <a mat-list-item routerLink="/loans" routerLinkActive="active-link">
            <mat-icon matListItemIcon>account_balance</mat-icon>
            <span matListItemTitle>Empréstimos</span>
          </a>
          <a mat-list-item routerLink="/incomes" routerLinkActive="active-link">
            <mat-icon matListItemIcon>trending_up</mat-icon>
            <span matListItemTitle>Receitas</span>
          </a>
          <a mat-list-item routerLink="/expenses" routerLinkActive="active-link">
            <mat-icon matListItemIcon>trending_down</mat-icon>
            <span matListItemTitle>Despesas</span>
          </a>
        </mat-nav-list>

        <!-- Botão de logout no rodapé da sidebar -->
        <div class="sidenav-footer">
          <button mat-button class="logout-btn" (click)="logout()">
            <mat-icon>logout</mat-icon> Sair
          </button>
        </div>
      </mat-sidenav>

      <!-- Área principal -->
      <mat-sidenav-content class="main-content">
        <mat-toolbar color="primary">
          <button mat-icon-button (click)="sidenav.toggle()">
            <mat-icon>menu</mat-icon>
          </button>
          <span>{{ userName }}</span>
          <span class="toolbar-spacer"></span>
          <span class="toolbar-version">Sistema Financeiro</span>
        </mat-toolbar>

        <!-- Cada rota filha é renderizada aqui -->
        <div class="page-wrapper">
          <router-outlet />
        </div>
      </mat-sidenav-content>

    </mat-sidenav-container>
  `,
  styles: [`
    .shell-container { height: 100vh; }

    /* Sidebar */
    .sidenav { width: 220px; background: #1e1e2e; color: #fff; display: flex; flex-direction: column; }
    .sidenav-header { display: flex; align-items: center; gap: 10px; padding: 20px 16px; font-size: 1.1rem; font-weight: 600; border-bottom: 1px solid rgba(255,255,255,.1); }
    .sidenav-footer { margin-top: auto; padding: 12px; border-top: 1px solid rgba(255,255,255,.1); }
    .logout-btn { color: #aaa; width: 100%; justify-content: flex-start; }

    /* Links de navegação */
    ::ng-deep .sidenav .mat-mdc-list-item { color: #ccc !important; border-radius: 8px; margin: 2px 8px; }
    ::ng-deep .sidenav .active-link { background: rgba(255,255,255,.15) !important; color: #fff !important; }
    ::ng-deep .sidenav .mat-icon { color: #ccc; }
    ::ng-deep .sidenav .active-link .mat-icon { color: #fff; }

    /* Header */
    .toolbar-spacer { flex: 1; }
    .toolbar-version { font-size: .85rem; opacity: .8; }

    /* Conteúdo */
    .page-wrapper { padding: 24px; }
  `],
})
export class ShellComponent {
  constructor(private readonly authService: AuthService) {}

  get userName(): string {
    return this.authService.currentUser$.value?.name ?? '';
  }

  logout(): void {
    this.authService.logout();
  }
}

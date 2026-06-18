/**
 * Rotas da aplicação.
 *
 * Estrutura:
 *   /login    → tela pública de login
 *   /register → tela pública de cadastro
 *   /         → shell com sidebar (requer authGuard)
 *     dashboard → KPIs e gráfico
 *     clients   → lista de clientes
 *     loans     → lista de empréstimos
 *     loans/:id → detalhes + parcelas
 *     incomes   → receitas
 *     expenses  → despesas
 *
 * Lazy loading: cada feature é carregada apenas quando acessada,
 * reduzindo o bundle inicial da aplicação.
 */
import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then(m => m.LoginComponent),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./features/auth/register/register.component').then(m => m.RegisterComponent),
  },

  // Shell protegido pelo authGuard — contém sidebar + header
  {
    path: '',
    loadComponent: () =>
      import('./layout/shell/shell.component').then(m => m.ShellComponent),
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
      },
      {
        path: 'clients',
        loadComponent: () =>
          import('./features/clients/clients.component').then(m => m.ClientsComponent),
      },
      {
        path: 'loans',
        loadComponent: () =>
          import('./features/loans/loans.component').then(m => m.LoansComponent),
      },
      {
        path: 'loans/:id',
        loadComponent: () =>
          import('./features/loans/loan-detail.component').then(m => m.LoanDetailComponent),
      },
      {
        path: 'incomes',
        loadComponent: () =>
          import('./features/incomes/incomes.component').then(m => m.IncomesComponent),
      },
      {
        path: 'expenses',
        loadComponent: () =>
          import('./features/expenses/expenses.component').then(m => m.ExpensesComponent),
      },
    ],
  },

  { path: '**', redirectTo: 'dashboard' },
];

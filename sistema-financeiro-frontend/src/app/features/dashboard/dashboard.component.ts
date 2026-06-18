/**
 * DashboardComponent — Tela principal com KPIs e gráfico.
 *
 * Carrega os dados do endpoint GET /api/dashboard e exibe:
 *   - 5 cards de KPI (receitas, despesas, saldo, a receber, vencidas)
 *   - Gráfico de barras com receitas vs despesas dos últimos 6 meses
 *
 * O gráfico usa Chart.js via ng2-charts (BaseChartDirective).
 * Os dados são mapeados do formato da API para o formato do Chart.js.
 */
import { Component, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartOptions } from 'chart.js';
import { Chart, registerables } from 'chart.js';
import { FinanceService } from '../../core/services/finance.service';
import { DashboardData } from '../../core/models/finance.model';

// Necessário registrar todos os controllers/plugins do Chart.js
Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, MatCardModule, MatIconModule, MatProgressSpinnerModule, BaseChartDirective],
  template: `
    <div *ngIf="loading" class="loading-center">
      <mat-spinner></mat-spinner>
    </div>

    <div *ngIf="!loading && data">
      <h2 class="page-title">Dashboard — {{ monthName }}/{{ data.month_summary.year }}</h2>

      <!-- KPI Cards -->
      <div class="kpi-grid">
        <mat-card class="kpi-card income">
          <mat-icon>trending_up</mat-icon>
          <div>
            <div class="kpi-label">Receitas do mês</div>
            <div class="kpi-value">{{ data.month_summary.total_income | currency:'BRL':'symbol':'1.2-2' }}</div>
          </div>
        </mat-card>

        <mat-card class="kpi-card expense">
          <mat-icon>trending_down</mat-icon>
          <div>
            <div class="kpi-label">Despesas do mês</div>
            <div class="kpi-value">{{ data.month_summary.total_expense | currency:'BRL':'symbol':'1.2-2' }}</div>
          </div>
        </mat-card>

        <mat-card class="kpi-card" [class.positive]="data.month_summary.balance >= 0" [class.negative]="data.month_summary.balance < 0">
          <mat-icon>account_balance</mat-icon>
          <div>
            <div class="kpi-label">Saldo do mês</div>
            <div class="kpi-value">{{ data.month_summary.balance | currency:'BRL':'symbol':'1.2-2' }}</div>
          </div>
        </mat-card>

        <mat-card class="kpi-card loan">
          <mat-icon>payments</mat-icon>
          <div>
            <div class="kpi-label">A receber (empréstimos)</div>
            <div class="kpi-value">{{ data.loans_summary.total_to_receive | currency:'BRL':'symbol':'1.2-2' }}</div>
          </div>
        </mat-card>

        <mat-card class="kpi-card overdue">
          <mat-icon>warning</mat-icon>
          <div>
            <div class="kpi-label">Parcelas vencidas</div>
            <div class="kpi-value">{{ data.loans_summary.overdue_installments }}</div>
            <div class="kpi-sub">{{ data.loans_summary.defaulted_clients }} cliente(s) inadimplente(s)</div>
          </div>
        </mat-card>
      </div>

      <!-- Gráfico de barras -->
      <mat-card class="chart-card">
        <mat-card-header>
          <mat-card-title>Receitas vs Despesas — últimos 6 meses</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <canvas baseChart
            [data]="chartData"
            [options]="chartOptions"
            type="bar">
          </canvas>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .page-title { font-size: 1.4rem; font-weight: 500; margin-bottom: 20px; color: #333; }
    .loading-center { display: flex; justify-content: center; padding: 60px; }

    /* Grid de KPI cards */
    .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px; }
    .kpi-card { display: flex; align-items: center; gap: 16px; padding: 20px; }
    .kpi-card mat-icon { font-size: 2rem; width: 2rem; height: 2rem; }
    .kpi-label { font-size: .8rem; color: #666; text-transform: uppercase; letter-spacing: .5px; }
    .kpi-value { font-size: 1.3rem; font-weight: 600; margin-top: 2px; }
    .kpi-sub { font-size: .75rem; color: #888; margin-top: 2px; }

    /* Cores dos cards */
    .kpi-card.income mat-icon { color: #4caf50; }
    .kpi-card.expense mat-icon { color: #f44336; }
    .kpi-card.positive mat-icon { color: #2196f3; }
    .kpi-card.negative mat-icon { color: #ff9800; }
    .kpi-card.loan mat-icon { color: #9c27b0; }
    .kpi-card.overdue mat-icon { color: #ff5722; }

    .chart-card { padding: 8px; }
    .chart-card canvas { max-height: 320px; }
  `],
})
export class DashboardComponent implements OnInit {
  data?: DashboardData;
  loading = true;

  /** Configuração do gráfico de barras para Chart.js */
  chartData: ChartData<'bar'> = { labels: [], datasets: [] };

  chartOptions: ChartOptions<'bar'> = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      tooltip: {
        callbacks: {
          // Formata os valores do tooltip como moeda BRL
          label: ctx => ` R$ ${Number(ctx.raw).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`,
        },
      },
    },
    scales: {
      y: { beginAtZero: true },
    },
  };

  get monthName(): string {
    const names = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
    return names[(this.data?.month_summary.month ?? 1) - 1];
  }

  constructor(private readonly financeService: FinanceService) {}

  ngOnInit(): void {
    this.financeService.getDashboard().subscribe({
      next: data => {
        this.data    = data;
        this.loading = false;
        this.buildChart(data);
      },
      error: () => { this.loading = false; },
    });
  }

  private buildChart(data: DashboardData): void {
    const months = data.charts.last_6_months;

    this.chartData = {
      labels: months.map(m => m.label),
      datasets: [
        {
          label:           'Receitas',
          data:            months.map(m => m.income),
          backgroundColor: 'rgba(76, 175, 80, 0.7)',
          borderColor:     '#4caf50',
          borderWidth:     1,
        },
        {
          label:           'Despesas',
          data:            months.map(m => m.expense),
          backgroundColor: 'rgba(244, 67, 54, 0.7)',
          borderColor:     '#f44336',
          borderWidth:     1,
        },
      ],
    };
  }
}

/**
 * FinanceService — Receitas, despesas, categorias e dashboard.
 */
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Income, Expense, ExpenseCategory,
  CreateIncomeDto, CreateExpenseDto, DashboardData,
} from '../models/finance.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class FinanceService {
  private readonly base = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  // ─── Dashboard ───────────────────────────────────────────────────────────────
  getDashboard(): Observable<DashboardData> {
    return this.http.get<DashboardData>(`${this.base}/dashboard`);
  }

  // ─── Receitas ────────────────────────────────────────────────────────────────
  getIncomes(month?: number, year?: number): Observable<Income[]> {
    let params = new HttpParams();
    if (month) params = params.set('month', month.toString());
    if (year)  params = params.set('year',  year.toString());
    return this.http.get<Income[]>(`${this.base}/incomes`, { params });
  }

  createIncome(dto: CreateIncomeDto): Observable<Income> {
    return this.http.post<Income>(`${this.base}/incomes`, dto);
  }

  updateIncome(id: number, dto: Partial<CreateIncomeDto>): Observable<Income> {
    return this.http.patch<Income>(`${this.base}/incomes/${id}`, dto);
  }

  deleteIncome(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/incomes/${id}`);
  }

  // ─── Despesas ────────────────────────────────────────────────────────────────
  getExpenses(month?: number, year?: number): Observable<Expense[]> {
    let params = new HttpParams();
    if (month) params = params.set('month', month.toString());
    if (year)  params = params.set('year',  year.toString());
    return this.http.get<Expense[]>(`${this.base}/expenses`, { params });
  }

  createExpense(dto: CreateExpenseDto): Observable<Expense> {
    return this.http.post<Expense>(`${this.base}/expenses`, dto);
  }

  updateExpense(id: number, dto: Partial<CreateExpenseDto>): Observable<Expense> {
    return this.http.patch<Expense>(`${this.base}/expenses/${id}`, dto);
  }

  deleteExpense(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/expenses/${id}`);
  }

  // ─── Categorias ──────────────────────────────────────────────────────────────
  getCategories(): Observable<ExpenseCategory[]> {
    return this.http.get<ExpenseCategory[]>(`${this.base}/expense-categories`);
  }
}

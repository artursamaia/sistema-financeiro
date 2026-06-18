/**
 * Modelos de receitas, despesas e categorias.
 */

export interface ExpenseCategory {
  id: number;
  name: string;
  color?: string;
  icon?: string;
  is_active: boolean;
}

export interface Income {
  id: number;
  description: string;
  amount: number;
  received_at: string;
  is_recurring: boolean;
  notes?: string;
}

export interface Expense {
  id: number;
  description: string;
  amount: number;
  due_date: string;
  paid_at?: string;
  is_paid: boolean;
  is_fixed: boolean;
  category_id?: number;
  notes?: string;
  expense_categories?: ExpenseCategory;
}

export interface CreateIncomeDto {
  description: string;
  amount: number;
  received_at: string;
  is_recurring?: boolean;
  notes?: string;
}

export interface CreateExpenseDto {
  description: string;
  amount: number;
  due_date: string;
  paid_at?: string;
  is_paid?: boolean;
  is_fixed?: boolean;
  category_id?: number;
  notes?: string;
}

/** Dashboard KPIs retornados pelo backend. */
export interface DashboardData {
  month_summary: {
    year: number;
    month: number;
    total_income: number;
    total_expense: number;
    balance: number;
  };
  loans_summary: {
    active_count: number;
    total_lent: number;
    total_to_receive: number;
    overdue_installments: number;
    defaulted_clients: number;
  };
  charts: {
    last_6_months: {
      year: number;
      month: number;
      label: string;
      income: number;
      expense: number;
      balance: number;
    }[];
  };
}

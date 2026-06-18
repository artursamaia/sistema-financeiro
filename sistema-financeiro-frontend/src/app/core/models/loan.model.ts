/**
 * Modelos de empréstimos, parcelas e pagamentos.
 */
export type LoanStatus        = 'active' | 'paid' | 'defaulted' | 'cancelled';
export type InstallmentStatus = 'pending' | 'partial' | 'paid' | 'overdue';
export type PaymentMethod     = 'cash' | 'pix' | 'transfer' | 'debit_card' | 'credit_card' | 'check';

export interface Installment {
  id: number;
  loan_id: number;
  installment_number: number;
  due_date: string;
  amount: number;
  paid_amount: number;
  status: InstallmentStatus;
  paid_at?: string;
}

export interface Loan {
  id: number;
  client_id: number;
  principal_amount: number;
  interest_rate: number;
  total_amount: number;
  installments_count: number;
  start_date: string;
  first_due_date: string;
  status: LoanStatus;
  notes?: string;
  created_at: string;
  clients: { id: number; name: string; cpf?: string };
  installments: Installment[];
}

export interface CreateLoanDto {
  client_id: number;
  principal_amount: number;
  interest_rate: number;
  installments_count: number;
  start_date: string;
  first_due_date: string;
  notes?: string;
}

export interface CreatePaymentDto {
  installment_id: number;
  amount: number;
  payment_method: PaymentMethod;
  paid_at?: string;
  notes?: string;
}

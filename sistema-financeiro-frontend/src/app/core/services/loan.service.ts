/**
 * LoanService — Empréstimos, parcelas e pagamentos.
 */
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Loan, Installment, CreateLoanDto, CreatePaymentDto } from '../models/loan.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class LoanService {
  private readonly loansUrl    = `${environment.apiUrl}/loans`;
  private readonly paymentsUrl = `${environment.apiUrl}/payments`;

  constructor(private readonly http: HttpClient) {}

  getAll(status?: string, clientId?: number): Observable<Loan[]> {
    let params = new HttpParams();
    if (status)   params = params.set('status', status);
    if (clientId) params = params.set('clientId', clientId.toString());
    return this.http.get<Loan[]>(this.loansUrl, { params });
  }

  getOne(id: number): Observable<Loan> {
    return this.http.get<Loan>(`${this.loansUrl}/${id}`);
  }

  getInstallments(loanId: number): Observable<Installment[]> {
    return this.http.get<Installment[]>(`${this.loansUrl}/${loanId}/installments`);
  }

  create(dto: CreateLoanDto): Observable<Loan> {
    return this.http.post<Loan>(this.loansUrl, dto);
  }

  updateStatus(id: number, status: string): Observable<Loan> {
    return this.http.patch<Loan>(`${this.loansUrl}/${id}`, { status });
  }

  /** Registra um pagamento em uma parcela. */
  pay(dto: CreatePaymentDto): Observable<any> {
    return this.http.post(this.paymentsUrl, dto);
  }

  getPaymentsByInstallment(installmentId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.paymentsUrl}/installment/${installmentId}`);
  }
}

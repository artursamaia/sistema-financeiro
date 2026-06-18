/**
 * AuthService — Gerencia autenticação JWT.
 *
 * Responsabilidades:
 *   - Fazer login e registro via API
 *   - Guardar/remover o token no localStorage
 *   - Expor um Observable do usuário atual para toda a aplicação
 *   - Verificar se o token ainda é válido (não expirou)
 *
 * O BehaviorSubject currentUser$ é o "estado global" de autenticação.
 * Qualquer componente pode observá-lo para reagir a login/logout.
 */
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { AuthResponse, JwtPayload } from '../models/auth.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'sf_token'; // chave no localStorage
  private readonly apiUrl = `${environment.apiUrl}/auth`;

  /** Emite o usuário atual (ou null se não autenticado). */
  currentUser$ = new BehaviorSubject<JwtPayload | null>(this.loadUserFromToken());

  constructor(
    private readonly http: HttpClient,
    private readonly router: Router,
  ) {}

  /** Retorna true se o usuário está autenticado e o token não expirou. */
  get isAuthenticated(): boolean {
    return this.currentUser$.value !== null;
  }

  /** Token JWT salvo no localStorage (usado pelo interceptor HTTP). */
  get token(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, { email, password }).pipe(
      tap(res => this.saveSession(res)),
    );
  }

  register(name: string, email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, { name, email, password }).pipe(
      tap(res => this.saveSession(res)),
    );
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    this.currentUser$.next(null);
    this.router.navigate(['/login']);
  }

  // ─── Privados ────────────────────────────────────────────────────────────────

  /** Salva o token e notifica os observadores com os dados do usuário. */
  private saveSession(res: AuthResponse): void {
    localStorage.setItem(this.TOKEN_KEY, res.accessToken);
    const payload = this.decodeToken(res.accessToken);
    this.currentUser$.next(payload);
  }

  /**
   * Decodifica o payload do JWT sem verificar a assinatura.
   * A verificação real é feita pelo backend a cada requisição.
   * Aqui só precisamos dos dados (nome, email) e da expiração.
   */
  private decodeToken(token: string): JwtPayload | null {
    try {
      const base64 = token.split('.')[1]; // parte do payload
      const json   = atob(base64.replace(/-/g, '+').replace(/_/g, '/'));
      const payload: JwtPayload = JSON.parse(json);

      // Verifica se expirou (exp é unix timestamp em segundos)
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < now) return null;

      return payload;
    } catch {
      return null;
    }
  }

  /** Tenta carregar o usuário do token salvo ao iniciar a aplicação. */
  private loadUserFromToken(): JwtPayload | null {
    const token = localStorage.getItem(this.TOKEN_KEY);
    if (!token) return null;
    return this.decodeToken(token);
  }
}

/**
 * ClientService — CRUD de clientes via API REST.
 */
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Client, CreateClientDto, UpdateClientDto } from '../models/client.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ClientService {
  private readonly url = `${environment.apiUrl}/clients`;

  constructor(private readonly http: HttpClient) {}

  getAll(search?: string, status?: string): Observable<Client[]> {
    let params = new HttpParams();
    if (search) params = params.set('search', search);
    if (status) params = params.set('status', status);
    return this.http.get<Client[]>(this.url, { params });
  }

  getOne(id: number): Observable<Client> {
    return this.http.get<Client>(`${this.url}/${id}`);
  }

  create(dto: CreateClientDto): Observable<Client> {
    return this.http.post<Client>(this.url, dto);
  }

  update(id: number, dto: UpdateClientDto): Observable<Client> {
    return this.http.patch<Client>(`${this.url}/${id}`, dto);
  }

  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}

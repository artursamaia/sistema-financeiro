/**
 * Modelos de clientes.
 */
export type ClientStatus = 'active' | 'inactive' | 'defaulted';

export interface Client {
  id: number;
  name: string;
  cpf?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  status: ClientStatus;
  notes?: string;
  created_at: string;
}

export interface CreateClientDto {
  name: string;
  cpf?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  status?: ClientStatus;
  notes?: string;
}

/** Para edição, todos os campos são opcionais. */
export type UpdateClientDto = Partial<CreateClientDto>;

/**
 * Modelos de autenticação.
 * Representam os dados trocados com a API /auth.
 */

/** Payload retornado após login ou registro. */
export interface AuthResponse {
  accessToken: string;
  user: {
    id: number;
    name: string;
    email: string;
  };
}

/** Payload decodificado do JWT (campos definidos no backend). */
export interface JwtPayload {
  sub: number;    // ID do usuário
  email: string;
  name: string;
  exp: number;    // expiração (unix timestamp)
}

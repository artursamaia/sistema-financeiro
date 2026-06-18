/**
 * Configuração global da aplicação Angular (estilo standalone Angular 17).
 *
 * Registra:
 *   - provideRouter: roteamento da aplicação
 *   - provideHttpClient: com o interceptor JWT embutido
 *   - provideAnimationsAsync: animações do Angular Material
 */
import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    // withInterceptors registra interceptors funcionais (padrão Angular 17+)
    provideHttpClient(withInterceptors([authInterceptor])),
    provideAnimationsAsync(),
  ],
};

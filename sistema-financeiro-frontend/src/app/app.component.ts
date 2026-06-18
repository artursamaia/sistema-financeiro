/**
 * AppComponent — Raiz da aplicação.
 * Apenas renderiza o <router-outlet> onde as rotas são carregadas.
 * Toda a lógica de layout fica no ShellComponent.
 */
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `<router-outlet />`,
})
export class AppComponent {}

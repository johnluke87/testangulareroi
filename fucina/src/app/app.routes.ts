import { Routes } from '@angular/router';
import { bozzaGuard, pattoGuard } from './core/guardie';

/** loadComponent = lazy loading: il codice della pagina arriva solo quando apri la route. */
export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'bacheca' },
  {
    path: 'bacheca',
    title: 'Bacheca',
    loadComponent: () => import('./pagine/bacheca/bacheca').then((m) => m.Bacheca),
  },
  {
    path: 'attivita',
    title: 'Attività',
    loadComponent: () => import('./pagine/attivita/attivita').then((m) => m.AttivitaPagina),
  },
  {
    path: 'note',
    title: 'Note',
    loadComponent: () => import('./pagine/note/note').then((m) => m.NotePagina),
  },
  {
    path: 'note/:id',
    title: 'Nota',
    canDeactivate: [bozzaGuard],
    loadComponent: () => import('./pagine/note/editor-nota').then((m) => m.EditorNota),
  },
  {
    path: 'pomodoro',
    title: 'Pomodoro',
    loadComponent: () => import('./pagine/pomodoro/pomodoro').then((m) => m.PomodoroPagina),
  },
  {
    path: 'ricette',
    title: 'Ricette',
    loadComponent: () => import('./pagine/ricette/ricette').then((m) => m.RicettePagina),
  },
  {
    path: 'ricette/:id',
    title: 'Ricetta',
    loadComponent: () => import('./pagine/ricette/dettaglio-ricetta').then((m) => m.DettaglioRicetta),
  },
  {
    path: 'patto',
    title: 'Patto',
    loadComponent: () => import('./pagine/patto/patto').then((m) => m.PattoPagina),
  },
  {
    path: 'banco',
    title: 'Banco di prova',
    canActivate: [pattoGuard],
    loadComponent: () => import('./pagine/banco/banco').then((m) => m.Banco),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'direttive' },
      {
        path: 'direttive',
        loadComponent: () => import('./pagine/banco/direttive-demo').then((m) => m.DirettiveDemo),
      },
      {
        path: 'pipe',
        loadComponent: () => import('./pagine/banco/pipe-demo').then((m) => m.PipeDemo),
      },
      {
        path: 'defer',
        loadComponent: () => import('./pagine/banco/defer-demo').then((m) => m.DeferDemo),
      },
      {
        path: 'proiezione',
        loadComponent: () => import('./pagine/banco/proiezione-demo').then((m) => m.ProiezioneDemo),
      },
      {
        path: 'injector',
        loadComponent: () => import('./pagine/banco/injector-demo').then((m) => m.InjectorDemo),
      },
      {
        path: 'ciclo',
        loadComponent: () => import('./pagine/banco/ciclo-vita').then((m) => m.CicloVita),
      },
    ],
  },
  {
    path: '**',
    title: 'Non trovata',
    loadComponent: () => import('./pagine/non-trovata/non-trovata').then((m) => m.NonTrovata),
  },
];

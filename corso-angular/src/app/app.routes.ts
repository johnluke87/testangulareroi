import { Routes } from '@angular/router';
import { Pagina0 } from './pagine/pagina0/pagina0';
import { Pagina1 } from './pagine/pagina1/pagina1';
import { Pagina2 } from './pagine/pagina2/pagina2';
import { Dettaglio } from './pagine/dettaglio/dettaglio';
import { Contatti } from './pagine/contatti/contatti';
import { authGuard } from './auth/auth-guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'pagina0' },
  { path: 'pagina0', component: Pagina0 },
  { path: 'dettaglio/:id', component: Dettaglio },
  { path: 'pagina1', component: Pagina1 },
  { path: 'pagina2', component: Pagina2 },
  { path: 'contatti', component: Contatti, canActivate: [authGuard] },

  // Pagine d'esempio caricate in lazy loading: il loro codice (form, Material, HTTP)
  // viene scaricato solo quando si apre la rotta, così il primo caricamento resta leggero.
  {
    path: 'iscrizione',
    loadComponent: () => import('./pagine/iscrizione/iscrizione').then((m) => m.Iscrizione),
  },
  {
    path: 'ngmodel',
    loadComponent: () =>
      import('./pagine/esempi-ngmodel/esempi-ngmodel').then((m) => m.EsempiNgmodel),
  },
  {
    path: 'iscrizione-reactive',
    loadComponent: () =>
      import('./pagine/iscrizione-reactive/iscrizione-reactive').then((m) => m.IscrizioneReactive),
  },
  {
    path: 'corsi-firebase',
    loadComponent: () =>
      import('./pagine/corsi-firebase/corsi-firebase').then((m) => m.CorsiFirebasePagina),
  },
  {
    path: 'material',
    loadComponent: () =>
      import('./pagine/material-esempio/material-esempio').then((m) => m.MaterialEsempio),
  },
];

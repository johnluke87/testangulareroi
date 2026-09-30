import { Routes } from '@angular/router';
import { authGuard, guestGuard, sessionGuard } from './core/guards';
import { Entra } from './pages/entra';
import { Inizio } from './pages/inizio';
import { RadarPage } from './pages/radar';
import { Lista } from './pages/lista';
import { Dettaglio } from './pages/dettaglio';
import { Notifiche } from './pages/notifiche';
import { Profilo } from './pages/profilo';
import { Salvati } from './pages/salvati';

export const routes: Routes = [
  { path: 'entra', component: Entra, canActivate: [guestGuard] },
  { path: 'inizio', component: Inizio, canActivate: [sessionGuard] },
  { path: '', component: RadarPage, canActivate: [authGuard] },
  { path: 'oggi', component: Lista, canActivate: [authGuard], data: { mode: 'today' } },
  { path: 'weekend', component: Lista, canActivate: [authGuard], data: { mode: 'weekend' } },
  { path: 'due-ore', component: Lista, canActivate: [authGuard], data: { mode: 'two-hours' } },
  { path: 'gratis', component: Lista, canActivate: [authGuard], data: { mode: 'free' } },
  { path: 'sorprendimi', component: Lista, canActivate: [authGuard], data: { mode: 'surprise' } },
  { path: 'salvati', component: Salvati, canActivate: [authGuard] },
  { path: 'notifiche', component: Notifiche, canActivate: [authGuard] },
  { path: 'profilo', component: Profilo, canActivate: [authGuard] },
  { path: 'luogo/:id', component: Dettaglio, canActivate: [authGuard] },
];

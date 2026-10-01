import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/guards';
import { DashboardPage } from './pages/dashboard-page/dashboard-page';

export const routes: Routes = [
    {
        path: 'login',
        title: 'Accedi · Dashboard',
        canActivate: [guestGuard],
        // lazy loading: il codice della pagina di login si scarica solo se serve
        //loadComponent invece di component: è il lazy loading. La pagina di login la vedi una volta ogni 30 giorni, quindi è inutile scaricarla ogni volta insieme alla dashboard.
        loadComponent: () => import('./pages/login-page/login-page').then((m) => m.LoginPage),
    },
    { path: '', component: DashboardPage, title: 'Dashboard', canActivate: [authGuard] },
    // qualsiasi altro indirizzo -> dashboard (che a sua volta ti manda al login se serve)
    { path: '**', redirectTo: '' },
];
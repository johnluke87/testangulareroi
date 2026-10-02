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
    {
        path: 'register',
        title: 'Registrati · Dashboard',
        canActivate: [guestGuard], // se sei già collegato non ha senso registrarsi
        loadComponent: () => import('./pages/register-page/register-page').then((m) => m.RegisterPage),
    },
    {
        path: 'settings',
        title: 'Impostazioni · Dashboard',
        canActivate: [authGuard],
        loadComponent: () => import('./pages/settings-page/settings-page').then((m) => m.SettingsPage),
    },
    { path: '', component: DashboardPage, title: 'Dashboard', canActivate: [authGuard] },
    // qualsiasi altro indirizzo -> dashboard (che a sua volta ti manda al login se serve)
    { path: '**', redirectTo: '' },
];

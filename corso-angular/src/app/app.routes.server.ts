import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: 'dettaglio/:id',
    renderMode: RenderMode.Server,
  },
  {
    // Pagina che legge dati dal database: si disegna solo nel browser,
    // così la build non chiama Firebase durante il prerender.
    path: 'corsi-firebase',
    renderMode: RenderMode.Client,
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender,
  },
];

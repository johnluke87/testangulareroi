import { Routes, UrlMatchResult, UrlSegment } from '@angular/router';
import { DettagliEroe } from './dettagli-eroe/dettagli-eroe';
import { Eroi } from './eroi/eroi';
import { Notifiche } from './notifiche/notifiche';

export function dettaglioUrl(segmenti: UrlSegment[]): UrlMatchResult | null {
  if (segmenti.length !== 1) {
    return null;
  }

  const trovato = /^dettaglio-(\d+)$/.exec(segmenti[0].path);
  if (!trovato) {
    return null;
  }

  return {
    consumed: segmenti,
    posParams: {
      id: new UrlSegment(trovato[1], {}),
    },
  };
}

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'eroi' },
  { path: 'eroi', component: Eroi },
  { path: 'notifiche', component: Notifiche },
  { matcher: dettaglioUrl, component: DettagliEroe },
];

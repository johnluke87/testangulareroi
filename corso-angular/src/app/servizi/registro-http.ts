import {
  HttpErrorResponse,
  HttpInterceptorFn,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { tap } from 'rxjs';

export interface VoceRegistro {
  metodo: string;
  url: string;
  headers: string[];
  body: unknown;
  stato: number;
  risposta: unknown;
  ms: number;
}

// Tiene le ultime chiamate HTTP, per mostrarle nella pagina.
@Injectable({ providedIn: 'root' })
export class RegistroHttp {
  readonly voci = signal<VoceRegistro[]>([]);

  aggiungi(voce: VoceRegistro) {
    this.voci.update((lista) => [voce, ...lista].slice(0, 8));
  }

  svuota() {
    this.voci.set([]);
  }
}

function descrivi(req: HttpRequest<unknown>) {
  return {
    metodo: req.method,
    url: req.urlWithParams,
    headers: req.headers.keys().map((k) => `${k}: ${req.headers.get(k)}`),
    body: req.body,
  };
}

// Interceptor: vede passare ogni richiesta e ogni risposta, e le scrive nel registro.
export const registroHttpInterceptor: HttpInterceptorFn = (req, next) => {
  const registro = inject(RegistroHttp);
  const inizio = Date.now();
  return next(req).pipe(
    tap({
      next: (evento) => {
        if (evento instanceof HttpResponse) {
          registro.aggiungi({
            ...descrivi(req),
            stato: evento.status,
            risposta: evento.body,
            ms: Date.now() - inizio,
          });
        }
      },
      error: (err: HttpErrorResponse) =>
        registro.aggiungi({
          ...descrivi(req),
          stato: err.status,
          risposta: err.error ?? err.message,
          ms: Date.now() - inizio,
        }),
    }),
  );
};

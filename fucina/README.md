# Fucina

Officina Angular per imparare il framework usandolo. Le attività, le note e il pomodoro restano nel browser. Le ricette arrivano da [DummyJSON](https://dummyjson.com), senza chiave API.

```bash
cd fucina
npm start
```

Poi apri `http://localhost:4200`.

Angular 21, componenti standalone (non c'è `NgModule`), change detection zoneless.

## Mappa

| Cosa vuoi vedere | Dove |
| --- | --- |
| `bootstrapApplication`, provider, zoneless, locale `it` | `src/app/app.config.ts` |
| Route lazy, figli, redirect, `**`, titoli, guardie | `src/app/app.routes.ts` |
| `input()` da path e query param, view transitions | `withComponentInputBinding` in `app.config.ts`, pagine attività e ricetta |
| `signal`, `computed`, `effect`, `linkedSignal` | `core/attivita.store.ts`, `pagine/attivita` |
| `httpResource`, `toSignal` / `toObservable`, interceptor | `pagine/ricette`, `core/cronometro.interceptor.ts` |
| Form a template (`ngModel`) | `pagine/attivita` |
| Form reattivo, `FormArray`, `canDeactivate` | `pagine/note/editor-nota.ts` |
| `canActivate` | `core/guardie.ts`, route `banco` |
| RxJS `interval`, service singleton | `core/pomodoro.ts` |
| Pipe di Angular e pipe custom | banco → Pipe, `shared/durata.pipe.ts` |
| Direttiva di attributo, class e style binding | banco → Direttive |
| `@defer` | banco → @defer |
| `ng-content`, `model()`, `ngTemplateOutlet` | banco → Proiezione |
| `InjectionToken`, provider sul componente | `core/api-ricette.ts`, banco → Injector |
| `ngOnInit`, `afterNextRender`, `effect`, `viewChild` | banco → Ciclo di vita |
| `@if` `@for` `@switch` `@let` `@empty` | un po' ovunque nei template |
| Test con Vitest | `npm test` |

Il rendering lato server (SSR) non è in questo progetto: sta in `tour-degli-eroi`. Qui la scelta didattica è la change detection zoneless, che con SSR si complica per via di `localStorage`.

I tutorial vecchi parlano di `NgModule`, `*ngIf` e `*ngFor`. In questo progetto l'equivalente è: componenti standalone, `@if` e `@for`.

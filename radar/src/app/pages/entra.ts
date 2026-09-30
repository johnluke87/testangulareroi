import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Api } from '../core/api';

@Component({
  selector: 'app-entra',
  imports: [ReactiveFormsModule],
  template: `
    <main class="auth">
      <p class="brand">Radar</p>
      <h1>{{ mode() === 'register' ? 'Crea il tuo radar' : 'Entra' }}</h1>
      <p class="lead">Ti propone poche cose intorno a te, adesso. Non un elenco di tutti gli eventi.</p>
      <form [formGroup]="form" (ngSubmit)="submit()">
        @if (mode() === 'register') {
          <label class="form-label">Nome <input class="form-control" formControlName="name" /></label>
        }
        <label class="form-label">Email <input class="form-control" type="email" formControlName="email" /></label>
        <label class="form-label">Password <input class="form-control" type="password" formControlName="password" /></label>
        @if (error()) { <p class="text-danger">{{ error() }}</p> }
        <button class="btn btn-primary" type="submit" [disabled]="busy()">{{ mode() === 'register' ? 'Continua' : 'Entra' }}</button>
      </form>
      <button class="btn btn-link px-0" type="button" (click)="toggle()">
        {{ mode() === 'register' ? 'Ho già un account' : 'Non ho un account' }}
      </button>
    </main>
  `,
})
export class Entra {
  private api = inject(Api);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  mode = signal<'login' | 'register'>('register');
  error = signal('');
  busy = signal(false);
  form = this.fb.nonNullable.group({
    name: [''],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  toggle(): void {
    this.mode.set(this.mode() === 'register' ? 'login' : 'register');
  }

  async submit(): Promise<void> {
    this.error.set('');
    if (this.form.invalid) {
      this.error.set('Controlla email e password (minimo 8 caratteri).');
      return;
    }
    this.busy.set(true);
    const v = this.form.getRawValue();
    try {
      const res = this.mode() === 'register'
        ? await this.api.register(v.name || 'Io', v.email, v.password)
        : await this.api.login(v.email, v.password);
      this.api.setSession(res.token, res.user);
      await this.router.navigateByUrl(res.user.latitude != null && res.user.onboarding_done ? '/' : '/inizio');
    } catch (e: unknown) {
      this.error.set(this.read(e) || 'Non sono riuscito a entrare.');
    } finally {
      this.busy.set(false);
    }
  }

  private read(e: unknown): string {
    const err = e as { error?: { error?: string } };
    return err?.error?.error || '';
  }
}

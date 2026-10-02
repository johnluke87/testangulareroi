import { HttpErrorResponse } from '@angular/common/http';
import { Component, effect, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDialog } from '@angular/material/dialog';
import { SmartHome } from '../../../core/services/smart-home';
import { TuyaHelpDialog } from '../tuya-help-dialog/tuya-help-dialog';

// Stesse regole del PHP (tuya.php): lettere e numeri
const KEY_PATTERN = /^[A-Za-z0-9]{10,64}$/;
const UID_PATTERN = /^[A-Za-z0-9]{6,64}$/;

/**
 * La sezione "Casa" delle impostazioni: le chiavi del TUO progetto Tuya.
 * Il secret si scrive ma non si rilegge mai (il server non lo restituisce): se lo lasci vuoto resta quello salvato.
 */
@Component({
  selector: 'app-tuya-settings',
  imports: [ReactiveFormsModule, MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule, MatSelectModule],
  templateUrl: './tuya-settings.html',
  styleUrl: './tuya-settings.scss',
})
export class TuyaSettings {
  protected home = inject(SmartHome);

  protected form = inject(NonNullableFormBuilder).group({
    region: ['eu', Validators.required],
    accessId: ['', [Validators.required, Validators.pattern(KEY_PATTERN)]],
    accessSecret: ['', Validators.pattern(KEY_PATTERN)],
    appUid: ['', [Validators.required, Validators.pattern(UID_PATTERN)]],
  });

  protected saving = signal(false);
  protected result = signal<{ ok: boolean; text: string } | null>(null);
  protected hideSecret = signal(true);
  private dialog = inject(MatDialog);

  /** La guida passo passo, in una finestra. autoFocus false: la guida si apre dall'inizio, non sul bottone in fondo. */
  protected openHelp(): void {
    this.dialog.open(TuyaHelpDialog, { width: '680px', maxWidth: '95vw', autoFocus: false });
  }

  constructor() {
    // quando arriva la configurazione salvata, la metto nel form (tranne il secret, che non arriva mai)
    effect(() => {
      const config = this.home.configValue();
      if (config) {
        this.form.patchValue({ region: config.region, accessId: config.accessId, appUid: config.appUid });
        // la prima volta il secret è obbligatorio; se è già salvato si può lasciare vuoto
        const secret = this.form.controls.accessSecret;
        secret.setValidators(config.configured ? Validators.pattern(KEY_PATTERN) : [Validators.required, Validators.pattern(KEY_PATTERN)]);
        secret.updateValueAndValidity();
      }
    });
  }

  protected save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    this.saving.set(true);
    this.result.set(null);

    this.home
      .saveConfig({
        region: value.region,
        accessId: value.accessId.trim(),
        accessSecret: value.accessSecret.trim() || undefined,
        appUid: value.appUid.trim(),
      })
      .subscribe({
        next: (test) => {
          this.saving.set(false);
          this.form.controls.accessSecret.reset(''); // il secret non resta scritto nella pagina
          this.result.set(
            test.ok
              ? { ok: true, text: `Collegato! Vedo ${test.devices} dispositivi.` }
              : { ok: false, text: `Salvato, ma il collegamento non va: ${test.error}` },
          );
        },
        error: (error: HttpErrorResponse) => {
          this.saving.set(false);
          this.result.set({ ok: false, text: error.error?.error ?? 'Salvataggio non riuscito' });
        },
      });
  }

  protected remove(): void {
    if (!confirm('Togliere il collegamento a Tuya? Le chiavi vengono cancellate dal server.')) {
      return;
    }
    this.home.deleteConfig().subscribe(() => {
      this.form.reset({ region: 'eu', accessId: '', accessSecret: '', appUid: '' });
      this.result.set({ ok: true, text: 'Collegamento rimosso.' });
    });
  }
}

import { AbstractControl, AsyncValidatorFn, ValidationErrors, ValidatorFn } from '@angular/forms';
import { Observable, map, timer } from 'rxjs';

// Nei form reactive un validatore è una semplice funzione:
// riceve il controllo e restituisce null (valido) oppure un oggetto errore.
// Non servono direttive né NG_VALIDATORS come nei form template-driven.

// Validatore con parametro: una funzione che crea il validatore.
// Uso: new FormControl('', [valoreVietato('admin')])
export function valoreVietato(vietato: string): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const valore = String(control.value ?? '').trim().toLowerCase();
    return valore === vietato.toLowerCase() ? { valoreVietato: { vietato } } : null;
  };
}

// Validatore di gruppo: si mette sul FormGroup e confronta due campi figli.
// Uso: new FormGroup({...}, { validators: passwordUguali })
export const passwordUguali: ValidatorFn = (gruppo: AbstractControl): ValidationErrors | null => {
  const password = gruppo.get('password')?.value;
  const conferma = gruppo.get('conferma')?.value;
  return password && conferma && password !== conferma ? { passwordDiverse: true } : null;
};

// Validatore asincrono: restituisce un Observable. Qui simula una chiamata al server.
// Uso: new FormControl('', { asyncValidators: [emailLibera()] })
const EMAIL_GIA_REGISTRATE = ['mario@esempio.it', 'anna@esempio.it'];

export function emailLibera(): AsyncValidatorFn {
  return (control: AbstractControl): Observable<ValidationErrors | null> => {
    const email = String(control.value ?? '').toLowerCase();
    return timer(800).pipe(
      map(() => (EMAIL_GIA_REGISTRATE.includes(email) ? { emailUsata: true } : null)),
    );
  };
}

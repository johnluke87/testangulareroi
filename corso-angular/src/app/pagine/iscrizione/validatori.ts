import { Directive, input } from '@angular/core';
import {
  AbstractControl,
  AsyncValidator,
  NG_ASYNC_VALIDATORS,
  NG_VALIDATORS,
  ValidationErrors,
  Validator,
} from '@angular/forms';
import { Observable, map, timer } from 'rxjs';

// Validatore sincrono su un campo: <input ngModel appValoreVietato="admin">
// Errore: { valoreVietato: { vietato: 'admin' } }
@Directive({
  selector: '[appValoreVietato]',
  providers: [{ provide: NG_VALIDATORS, useExisting: ValoreVietato, multi: true }],
})
export class ValoreVietato implements Validator {
  appValoreVietato = input('');

  validate(control: AbstractControl): ValidationErrors | null {
    const vietato = this.appValoreVietato().toLowerCase();
    const valore = String(control.value ?? '').trim().toLowerCase();
    return vietato && valore === vietato ? { valoreVietato: { vietato } } : null;
  }
}

// Validatore su un gruppo: <div ngModelGroup="credenziali" appPasswordUguali>
// Confronta i due campi figli password e conferma. Errore: { passwordDiverse: true }
@Directive({
  selector: '[appPasswordUguali]',
  providers: [{ provide: NG_VALIDATORS, useExisting: PasswordUguali, multi: true }],
})
export class PasswordUguali implements Validator {
  validate(gruppo: AbstractControl): ValidationErrors | null {
    const password = gruppo.get('password')?.value;
    const conferma = gruppo.get('conferma')?.value;
    return password && conferma && password !== conferma ? { passwordDiverse: true } : null;
  }
}

// Validatore asincrono: finge di chiedere al server se l'email è già registrata.
// Mentre aspetta, il campo e il form sono nello stato PENDING. Errore: { emailUsata: true }
const EMAIL_GIA_REGISTRATE = ['mario@esempio.it', 'anna@esempio.it'];

@Directive({
  selector: '[appEmailLibera]',
  providers: [{ provide: NG_ASYNC_VALIDATORS, useExisting: EmailLibera, multi: true }],
})
export class EmailLibera implements AsyncValidator {
  validate(control: AbstractControl): Observable<ValidationErrors | null> {
    const email = String(control.value ?? '').toLowerCase();
    return timer(800).pipe(
      map(() => (EMAIL_GIA_REGISTRATE.includes(email) ? { emailUsata: true } : null)),
    );
  }
}

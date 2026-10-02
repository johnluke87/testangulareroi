import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { RouterLink } from '@angular/router';
import { SmartHome } from '../../../core/services/smart-home';
import { DeviceValue, SmartDevice } from '../../../models/home';

/** Casa: i dispositivi Smart Life divisi per stanza; luci e prese si accendono e spengono da qui. */
@Component({
  selector: 'app-home-panel',
  imports: [DatePipe, RouterLink, MatButtonModule, MatIconModule, MatSlideToggleModule],
  templateUrl: './home-panel.html',
  styleUrl: './home-panel.scss',
})
export class HomePanel {
  protected home = inject(SmartHome);

  /** Interruttori con un comando in viaggio ("idDispositivo:codice"): li disabilito per evitare doppi clic. */
  protected pending = signal<ReadonlySet<string>>(new Set());
  protected errorMessage = signal<string | null>(null);

  protected switchCount(device: SmartDevice): number {
    return device.values.filter((v) => v.switchable).length;
  }

  protected key(device: SmartDevice, value: DeviceValue): string {
    return `${device.id}:${value.code}`;
  }

  protected toggle(device: SmartDevice, value: DeviceValue, on: boolean): void {
    const key = this.key(device, value);
    this.errorMessage.set(null);
    this.pending.update((set) => new Set(set).add(key));

    this.home.setSwitch(device, value.code, on).subscribe({
      next: () => this.done(key),
      error: (error: HttpErrorResponse) => {
        this.done(key);
        this.errorMessage.set(error.error?.error ?? `Non sono riuscito a comandare "${device.name}"`);
      },
    });
  }

  private done(key: string): void {
    this.pending.update((set) => {
      const next = new Set(set);
      next.delete(key);
      return next;
    });
  }
}

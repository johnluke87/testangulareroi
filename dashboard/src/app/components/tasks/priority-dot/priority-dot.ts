import { Component, computed, input } from '@angular/core';
import { TASK_PRIORITY_LABELS, TaskPriority } from '../../../models/task';

/**
 * Il pallino colorato della priorità: <app-priority-dot [priority]="t.priority" />
 * Prima era uno <span> con lo stesso CSS copiato in due file: ora è un componente, il CSS sta in un posto solo.
 * Template e stile sono "inline" (dentro il .ts) perché sono minuscoli.
 */
@Component({
  selector: 'app-priority-dot',
  template: '',
  styles: `
    :host {
      display: inline-block;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      flex-shrink: 0;
      background: var(--mat-sys-outline);
    }
    :host([data-priority='1']) { background: var(--mat-sys-error); }
    :host([data-priority='2']) { background: #f0a020; }
  `,
  // "host" = attributi messi direttamente sul tag <app-priority-dot>.
  // Il colore lo sceglie il CSS qui sopra in base a data-priority; title e aria-label servono
  // a chi passa col mouse e agli screen reader (un pallino colorato da solo non dice niente).
  host: {
    role: 'img',
    '[attr.data-priority]': 'priority()',
    '[attr.title]': 'label()',
    '[attr.aria-label]': 'label()',
  },
})
export class PriorityDot {
  priority = input.required<TaskPriority>();

  protected label = computed(() => `Priorità ${TASK_PRIORITY_LABELS[this.priority()].toLowerCase()}`);
}

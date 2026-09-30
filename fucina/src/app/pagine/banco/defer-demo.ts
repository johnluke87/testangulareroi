import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BloccoPesante } from './blocco-pesante';

@Component({
  selector: 'app-defer-demo',
  imports: [BloccoPesante],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './defer-demo.html',
})
export class DeferDemo {}

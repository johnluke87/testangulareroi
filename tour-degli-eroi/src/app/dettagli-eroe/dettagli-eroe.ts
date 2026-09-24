import { LowerCasePipe, NgIf, UpperCasePipe } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Eroe } from '../eroe';

@Component({
  selector: 'app-dettagli-eroe',
  imports: [UpperCasePipe, LowerCasePipe, FormsModule],
  templateUrl: './dettagli-eroe.html',
  styleUrl: './dettagli-eroe.scss',
})
export class DettagliEroe {
  @Input() eroeSelezionato: Eroe | undefined;
}

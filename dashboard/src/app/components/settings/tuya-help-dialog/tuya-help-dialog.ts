import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

/**
 * La guida "Come trovo questi codici?" per collegare Smart Life tramite Tuya.
 * È solo testo: nessun dato in ingresso, nessuna logica. La apre TuyaSettings con MatDialog.
 */
@Component({
  selector: 'app-tuya-help-dialog',
  imports: [MatButtonModule, MatDialogModule, MatIconModule],
  templateUrl: './tuya-help-dialog.html',
  styleUrl: './tuya-help-dialog.scss',
})
export class TuyaHelpDialog {}

import { Component, ViewChild, Inject } from "@angular/core";
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogModule,
} from "@angular/material/dialog";
import { CardInputComponent } from "./card-input.component";
import { InfoCard } from "@app/model/card";
import { MatButtonModule } from "@angular/material/button";

@Component({
  standalone: true,
  selector: "app-add-card-dialog",
  imports: [CardInputComponent, MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>Neue Karte anlegen</h2>
    <div mat-dialog-content class="add-card-dialog-content">
      <app-card-input #cardInput [card]="newCard"></app-card-input>
    </div>
    <div mat-dialog-actions>
      <button mat-button mat-dialog-close>Abbrechen</button>
      <button mat-flat-button color="primary" (click)="create()">
        Erstellen
      </button>
    </div>
  `,
})
export class AddCardDialogComponent {
  @ViewChild("cardInput") cardInput!: CardInputComponent;
  newCard: InfoCard;

  constructor(
    private dialogRef: MatDialogRef<AddCardDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { stackId?: number },
  ) {
    this.newCard = { title: "", description: "", stackId: data?.stackId };
  }

  create() {
    if (this.cardInput && this.cardInput.card) {
      this.dialogRef.close(this.cardInput.card());
    }
  }
} 
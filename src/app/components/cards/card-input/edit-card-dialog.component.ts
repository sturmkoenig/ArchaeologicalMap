import { Component, ViewChild, Inject } from "@angular/core";
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogModule,
} from "@angular/material/dialog";
import { CardInputComponent } from "./card-input.component";
import { Card, InfoCard } from "@app/model/card";
import { MatButtonModule } from "@angular/material/button";

@Component({
  standalone: true,
  selector: "app-edit-card-dialog",
  imports: [CardInputComponent, MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>Karte bearbeiten</h2>
    <div mat-dialog-content class="edit-card-dialog-content">
      <app-card-input #cardInput [card]="cardToEdit"></app-card-input>
    </div>
    <div mat-dialog-actions>
      <button mat-button mat-dialog-close>Abbrechen</button>
      <button mat-flat-button color="primary" (click)="save()">
        Speichern
      </button>
    </div>
  `,
})
export class EditCardDialogComponent {
  @ViewChild("cardInput") cardInput!: CardInputComponent;
  cardToEdit: InfoCard;

  constructor(
    private dialogRef: MatDialogRef<EditCardDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { card: Card },
  ) {
    this.cardToEdit = {
      id: data.card.id,
      title: data.card.title,
      description: data.card.description,
      stackId: data.card.stackId,
      regionImageId: data.card.regionImageId,
    };
  }

  save() {
    if (this.cardInput && this.cardInput.card) {
      this.dialogRef.close(this.cardInput.card());
    }
  }
}

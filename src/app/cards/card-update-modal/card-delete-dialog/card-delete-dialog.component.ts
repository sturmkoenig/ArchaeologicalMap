import { Component, EventEmitter, Inject, Output } from "@angular/core";
import { MAT_DIALOG_DATA } from "@angular/material/dialog";
import { CardService } from "src/app/services/card.service";

@Component({
  selector: "app-card-delete-dialog",
  template: `
    <h1 mat-dialog-title>{{ data.title }} Löschen</h1>
    <div mat-dialog-content>
      Soll die Seite unwiederbringlich gelöscht werden?
    </div>
    <div mat-dialog-actions>
      <button mat-button mat-dialog-close>Abbrechen</button>
      <button
        mat-button
        mat-dialog-close
        cdkFocusInitial
        (click)="onDeleteCard(data.id)"
      >
        Ok
      </button>
    </div>
  `,
  styles: [],
})
export class CardDeleteDialogComponent {
  @Output()
  deleted: EventEmitter<boolean> = new EventEmitter();

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private cardService: CardService
  ) {}

  onDeleteCard(id: number) {
    this.deleted.emit();
    this.cardService.deleteCard(id);
  }
}

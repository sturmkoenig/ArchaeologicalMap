import { Component, Inject, Output, EventEmitter } from "@angular/core";
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef,
} from "@angular/material/dialog";
import { LatLng } from "leaflet";
import { CardDB, MarkerDB, MarkerLatLng } from "src/app/model/card";
import { CardService } from "src/app/services/card.service";
import { CardDeleteDialogComponent } from "./card-delete-dialog/card-delete-dialog.component";
import { DialogRef } from "@angular/cdk/dialog";

@Component({
  selector: "app-card-update-modal",
  template: `
    <h1 mat-dialog-title>{{ updatedCard.title }} Bearbeiten</h1>
    <div mat-dialog-content>
      <div class="title-container">
        <mat-form-field>
          <mat-label>Title:</mat-label>
          <input matInput [(ngModel)]="updatedCard.title" />
        </mat-form-field>
        <mat-form-field>
          <mat-label>Beschreibung:</mat-label>
          <input matInput [(ngModel)]="updatedCard.description" />
        </mat-form-field>
      </div>
      <!-- TODO how to handle multiple positions here? SELECT one pos, and then -->
      <app-position-picker
        [(markers)]="updatedMarkers"
        [editable]="true"
      ></app-position-picker>
    </div>
    <div mat-dialog-actions>
      <button mat-button color="primary" mat-dialog-close>Abbrechen</button>
      <button
        mat-button
        color="primary"
        mat-dialog-close
        cdkFocusInitial
        (click)="onUpdate()"
      >
        Speichern
      </button>
      <button
        mat-raised-button
        color="warn"
        (click)="openDeleteDialog(updatedCard.title, updatedCard.id)"
      >
        delete
      </button>
    </div>
  `,
  styles: [
    `
      .title-container {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        padding: 1rem;
      }
      .input-span {
        display: flex;
        flex-direction: column;
      }
    `,
  ],
})
export class CardUpdateModalComponent {
  updatedCard: CardDB;
  updatedMarkers: MarkerLatLng[];

  @Output()
  updated: EventEmitter<boolean> = new EventEmitter();

  @Output()
  deleted: EventEmitter<boolean> = new EventEmitter();

  constructor(
    @Inject(MAT_DIALOG_DATA) public card: { currentCard: CardDB },
    private cardService: CardService,
    public dialog: MatDialog
  ) {
    this.updatedCard = card.currentCard;
    this.updatedMarkers = this.updatedCard.markers;
  }

  onUpdate() {
    this.cardService.updateCard(this.updatedCard, this.updatedMarkers);
    let removedMarkers = this.updatedCard.markers.filter(
      (originalMarker) => this.updatedMarkers.indexOf(originalMarker) === -1
    );
    this.cardService.deleteMarkers(removedMarkers);
    this.updated.emit(true);
  }

  openDeleteDialog(title: string, id: number) {
    let dialogRef = this.dialog.open(CardDeleteDialogComponent, {
      data: {
        title: title,
        id: id,
      },
      enterAnimationDuration: "300ms",
      exitAnimationDuration: "300ms",
    });
    const subscribeDialog = dialogRef.componentInstance.deleted.subscribe(
      (data: boolean) => {
        this.deleted.emit(true);
      }
    );
  }
}

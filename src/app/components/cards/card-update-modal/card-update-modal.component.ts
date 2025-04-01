import { Component, Inject, Output, EventEmitter } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialog } from "@angular/material/dialog";
import { Card, MarkerLatLng } from "src/app/model/card";
import { CardService } from "src/app/services/card.service";
import { CardDeleteDialogComponent } from "./card-delete-dialog/card-delete-dialog.component";
import { StackStore } from "src/app/state/stack.store";
import { Observable } from "rxjs";
import { Stack } from "src/app/model/stack";

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
        <mat-form-field>
          <mat-label>Stapel:</mat-label>
          <mat-select [(ngModel)]="updatedCard.stack_id" name="food">
            <mat-option
              *ngFor="let stack of stacks$ | async"
              [value]="stack.id"
            >
              {{ stack.name }}
            </mat-option>
          </mat-select>
        </mat-form-field>
      </div>

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
        (click)="openDeleteDialog(updatedCard.title, updatedCard.id!)"
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
  updatedCard: Card;
  updatedMarkers: MarkerLatLng[];
  stacks$: Observable<Stack[]>;

  @Output()
  updated: EventEmitter<boolean> = new EventEmitter();

  @Output()
  deleted: EventEmitter<boolean> = new EventEmitter();

  constructor(
    @Inject(MAT_DIALOG_DATA) public card: { currentCard: Card },
    private cardService: CardService,
    public dialog: MatDialog,
    private stackStore: StackStore,
  ) {
    this.updatedCard = card.currentCard;
    const updateMarker: MarkerLatLng = {
      latitude: this.updatedCard.latitude,
      longitude: this.updatedCard.longitude,
      icon_name: this.updatedCard.icon_name,
      radius: this.updatedCard.radius,
    };
    this.updatedMarkers = [updateMarker];
    this.stacks$ = stackStore.stacks$;
  }

  onUpdate() {
    this.cardService.updateCard({
      ...this.updatedCard,
      ...this.updatedMarkers[0],
    });
    this.updated.emit(true);
  }

  openDeleteDialog(title: string, id: number) {
    const dialogRef = this.dialog.open(CardDeleteDialogComponent, {
      data: {
        title: title,
        id: id,
      },
      enterAnimationDuration: "300ms",
      exitAnimationDuration: "300ms",
    });
    dialogRef.componentInstance.deleted.subscribe((_: boolean) => {
      this.deleted.emit(true);
    });
  }
}

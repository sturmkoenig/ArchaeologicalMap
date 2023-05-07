import { Component, Inject, Output, EventEmitter } from "@angular/core";
import { MAT_DIALOG_DATA } from "@angular/material/dialog";
import { LatLng } from "leaflet";
import { Card, CardDB } from "src/app/model/card";
import { CardService } from "src/app/services/card.service";

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
      <app-icon-picker [(icon)]="updatedCard.icon_name"></app-icon-picker>
      <app-position-picker
        [icon]="updatedCard.icon_name"
        [(coordinate)]="updatedCoordinate"
        [(coordinateRadius)]="updatedCard.coordinate_radius"
      ></app-position-picker>
    </div>
    <div mat-dialog-actions>
      <button mat-button mat-dialog-close>No</button>
      <button mat-button mat-dialog-close cdkFocusInitial (click)="onUpdate()">
        speichern
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
  updatedCoordinate: LatLng;
  updatedCard: CardDB;

  @Output()
  updated: EventEmitter<boolean> = new EventEmitter();
  constructor(
    @Inject(MAT_DIALOG_DATA) public card: any,
    private cardService: CardService
  ) {
    this.updatedCard = card.currentCard;
    this.updatedCoordinate = new LatLng(
      card.currentCard.latitude,
      card.currentCard.longitude
    );
  }

  onUpdate() {
    this.updatedCard.latitude = this.updatedCoordinate.lat;
    this.updatedCard.longitude = this.updatedCoordinate.lng;
    this.cardService.updateCard(this.updatedCard);
    this.updated.emit(true);
  }
}

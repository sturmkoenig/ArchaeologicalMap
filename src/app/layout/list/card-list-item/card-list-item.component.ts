import { Component } from "@angular/core";

@Component({
  selector: "app-card-list-item",
  template: `
    <mat-card>
      <mat-card-header>
        <mat-card-title>Actions Buttons</mat-card-title>
        <mat-card-subtitle>Start</mat-card-subtitle>
      </mat-card-header>
      <mat-card-actions>
        <button mat-button>LIKE</button>
        <button mat-button>SHARE</button>
      </mat-card-actions>
    </mat-card>
  `,
  styles: [],
})
export class CardListItemComponent {}

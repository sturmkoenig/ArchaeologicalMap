import { Component, OnInit } from "@angular/core";
import { invoke } from "@tauri-apps/api";
import { throwError } from "rxjs";
import { Card, CardDB } from "src/app/model/card";
import { CardService } from "src/app/services/card.service";

@Component({
  selector: "app-card-list",
  template: `
    <div class="list-container">
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
      <br />
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
    </div>
  `,
  styles: [
    `
      .list-container {
        padding: 1rem;
      }
      .example-card {
        max-width: 400px;
        margin-bottom: 8px;
      }
    `,
  ],
})
export class CardListComponent implements OnInit {
  public allCards: CardDB[] = [];

  constructor(private cardService: CardService) {}

  ngOnInit(): void {
    this.cardService.readCards().then((res) => {
      this.allCards = res;
    });
  }
}

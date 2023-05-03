import { Component, OnInit } from "@angular/core";
import { WebviewWindow } from "@tauri-apps/api/window";
import { invoke, tauri } from "@tauri-apps/api";
import { Observable, from, throwError } from "rxjs";
import { Card, CardDB } from "src/app/model/card";
import { CardService } from "src/app/services/card.service";

@Component({
  selector: "app-card-list",
  template: `
    <div class="list-container">
      <ng-container *ngFor="let card of allCards | async">
        <mat-card>
          <mat-card-header>
            <mat-card-title>{{ card.title }}</mat-card-title>
            <mat-card-subtitle>{{ card.description }}</mat-card-subtitle>
          </mat-card-header>
          <mat-card-actions>
            <button mat-button (click)="goToDetailsPage(card.id, card.title)">
              Bearbeiten
            </button>
          </mat-card-actions>
        </mat-card>
        <br />
      </ng-container>
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
  public allCards: Observable<CardDB[]>;

  constructor(private cardService: CardService) {}

  ngOnInit(): void {
    this.allCards = from(this.cardService.readCards());
  }

  goToDetailsPage(cardId: number, cardTitle: string) {
    const webview = new WebviewWindow(cardId.toString(), {
      url: "cards/details?id=" + cardId,
    });
    webview.once("tauri://error", function (e) {
      console.log("window creation error: " + JSON.stringify(e));
    });
  }
}

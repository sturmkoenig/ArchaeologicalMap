import { Component, OnInit } from "@angular/core";
import { WebviewWindow } from "@tauri-apps/api/window";
import { invoke, tauri } from "@tauri-apps/api";
import { Observable, from, throwError } from "rxjs";
import { Card, CardDB } from "src/app/model/card";
import { CardService } from "src/app/services/card.service";
import { PageEvent } from "@angular/material/paginator";
import { MatDialog } from "@angular/material/dialog";
import { CardUpdateModalComponent } from "../card-update-modal/card-update-modal.component";

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
            <button mat-button (click)="openUpdateDialog(card)">
              Bearbeiten
            </button>
            <button mat-button (click)="goToDetailsPage(card.id, card.title)">
              Info-Seite öffnen
            </button>
          </mat-card-actions>
        </mat-card>
        <br />
      </ng-container>
      <mat-paginator
        [length]="numCards"
        [pageSizeOptions]="[5]"
        [pageIndex]="pageIndex"
        (page)="changePage($event)"
        aria-label="Select page"
      >
      </mat-paginator>
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
  pageIndex: number = 0;
  numCards: number = 0;

  constructor(private cardService: CardService, public dialog: MatDialog) {}

  ngOnInit(): void {
    this.cardService
      .getNumberOfCards()
      .then((count) => (this.numCards = count));
    this.allCards = from(this.cardService.readCardsPaginated(0));
  }

  goToDetailsPage(cardId: number, cardTitle: string) {
    const webview = new WebviewWindow(cardId.toString(), {
      url: "cards/details?id=" + cardId,
    });
    webview.once("tauri://error", function (e) {
      console.log("window creation error: " + JSON.stringify(e));
    });
  }

  changePage($event: PageEvent) {
    this.allCards = from(this.cardService.readCardsPaginated($event.pageIndex));
  }

  openUpdateDialog(currentCard: CardDB) {
    this.dialog.open(CardUpdateModalComponent, {
      data: {
        currentCard,
      },
      enterAnimationDuration: "200ms",
      exitAnimationDuration: "150ms",
    });
  }
}

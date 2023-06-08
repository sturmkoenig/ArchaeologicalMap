import { Component, OnInit, Output, EventEmitter } from "@angular/core";
import { WebviewWindow } from "@tauri-apps/api/window";
import { invoke, tauri } from "@tauri-apps/api";
import {
  Observable,
  Subject,
  Subscription,
  debounceTime,
  from,
  throwError,
} from "rxjs";
import { CardDB, NewCard } from "src/app/model/card";
import { CardService } from "src/app/services/card.service";
import { PageEvent } from "@angular/material/paginator";
import { MatDialog } from "@angular/material/dialog";
import { CardUpdateModalComponent } from "../card-update-modal/card-update-modal.component";
import { MatSnackBar } from "@angular/material/snack-bar";
import { ICONS, IconService } from "src/app/services/icon.service";
import { RandomCardsService } from "src/app/services/random-cards.service";

@Component({
  selector: "app-card-list",
  template: `
    <div class="list-container">
      <mat-form-field class="example-form-field">
        <mat-label>Suche...</mat-label>
        <input
          matInput
          type="text"
          [(ngModel)]="filter"
          (keydown)="inputChanged()"
        />
        <button
          *ngIf="filter"
          matSuffix
          mat-icon-button
          aria-label="Clear"
          (click)="filter = ''"
        >
          <mat-icon>close</mat-icon>
        </button>
      </mat-form-field>
      <ng-container *ngFor="let card of allCards | async">
        <mat-card>
          <mat-card-header>
            <div mat-card-avatar class="card-avatar">
              <!-- TODO land flag or something as icon -->
              <img src="{{ iconService.getIconPath('iconDefault') }}" />
            </div>
            <mat-card-title>{{ card.title }}</mat-card-title>
            <mat-card-subtitle>{{ card.description }}</mat-card-subtitle>
          </mat-card-header>
          <mat-card-actions>
            <button mat-button color="primary" (click)="openUpdateDialog(card)">
              Bearbeiten
            </button>
            <button
              mat-raised-button
              color="accent"
              (click)="goToDetailsPage(card.id, card.title)"
            >
              Info-Seite öffnen
            </button>
          </mat-card-actions>
        </mat-card>
        <br />
      </ng-container>
      <mat-paginator
        [length]="numCards"
        [pageSizeOptions]="[20]"
        [pageIndex]="pageIndex"
        (page)="changePage($event)"
        aria-label="Select page"
      >
      </mat-paginator>
      <button
        mat-raised-button
        color="primary"
        (click)="addThousandRandomEntities()"
      >
        Add 1000 entities
      </button>
    </div>
  `,
  styles: [
    `
      button {
        margin: 0.2rem;
      }
      .list-container {
        padding: 2rem;
        display: flex;
        flex-direction: column;
      }
      .example-card {
        max-width: 400px;
        margin-bottom: 8px;
      }
    `,
  ],
})
export class CardListComponent implements OnInit {
  allCards: Observable<CardDB[]>;
  numCards: number = 0;
  filter: string = "";
  modelChanged: Subject<string> = new Subject<string>();
  subscription!: Subscription;
  debounceTime = 500;
  pageIndex: number = 0;

  constructor(
    private cardService: CardService,
    public dialog: MatDialog,
    public iconService: IconService,
    private _snackBar: MatSnackBar,
    private randomCardService: RandomCardsService
  ) {
    this.cardService
      .getNumberOfCards()
      .then((count) => (this.numCards = count));
    this.allCards = from(this.cardService.readCardsPaginated(0, ""));
  }

  addThousandRandomEntities() {
    for (let i = 0; i < 1000; i++) {
      let newRandomCard: NewCard =
        this.randomCardService.generateRandomEntity();
      console.log(newRandomCard);
      this.cardService.cardCreate(newRandomCard);
    }
  }

  ngOnInit(): void {
    this.subscription = this.modelChanged
      .pipe(debounceTime(this.debounceTime))
      .subscribe((filter) => {
        this.allCards = from(
          this.cardService.readCardsPaginated(this.pageIndex, filter)
        );
      });
  }

  inputChanged() {
    this.modelChanged.next(this.filter);
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
    this.allCards = from(
      this.cardService.readCardsPaginated($event.pageIndex, "")
    );
  }

  openUpdateDialog(currentCard: CardDB) {
    const dialogRef = this.dialog.open(CardUpdateModalComponent, {
      data: {
        currentCard,
      },
      enterAnimationDuration: "200ms",
      exitAnimationDuration: "150ms",
    });
    const subscribeDialogDeleted =
      dialogRef.componentInstance.deleted.subscribe((data: boolean) => {
        if (data === true) {
          console.log("Geloescht");
          this._snackBar.open("Seite gelöscht", "⌫");
          dialogRef.close();
          this.inputChanged();
        }
      });
    const subscribeDialogUpdated =
      dialogRef.componentInstance.updated.subscribe((data: boolean) => {
        if (data === true) {
          this._snackBar.open("Änderungen gespeichert!", "💾");
        }
      });
  }
}

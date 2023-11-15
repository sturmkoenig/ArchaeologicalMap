import { Component, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { invoke } from "@tauri-apps/api";
import { TauriEvent, emit } from "@tauri-apps/api/event";
import { CardService } from "src/app/services/card.service";

import { MatDialog } from "@angular/material/dialog";
import { MatSnackBar } from "@angular/material/snack-bar";
import { BehaviorSubject, Observable, from } from "rxjs";
import { EditorComponent } from "src/app/layout/editor/editor.component";
import { CardDB, MarkerDB } from "src/app/model/card";
import { MarkerService } from "src/app/services/marker.service";
import { CardDetailsStore } from "src/app/state/card-details.store";
import { CardUpdateModalComponent } from "../card-update-modal/card-update-modal.component";
import { CardContentService } from "src/app/services/card-content.service";
import { WebviewWindow, appWindow } from "@tauri-apps/api/window";

@Component({
  selector: "app-card-details",
  template: `
    <div class="card-details-component-container">
      <div class="card-details-side-nav">
        <ng-container
          *ngFor="let card of cardDetailsStore.allCardsInStack$ | async"
        >
          <span
            class="card-details-side-nav--container"
            [routerLink]="'/cards/details'"
            [queryParams]="{ id: card.id }"
            [ngClass]="{ 'current-card': card.id === this.cardId }"
            >{{ card.title }}
          </span>
        </ng-container>
      </div>
      <div class="card-details-container">
        <ng-container *ngIf="card$ | async as card">
          <div class="card">
            <span
              *ngIf="cardDetailsStore.previousCardId$ | async as previousCardId"
              class="card--nav"
            >
              <button
                mat-icon-button
                [routerLink]="'/cards/details'"
                [queryParams]="{ id: previousCardId }"
              >
                <mat-icon>arrow_back_ios</mat-icon>
              </button>
            </span>
            <div class="card--properties">
              <h1>{{ card.title }}</h1>
              <div class="card-content">
                <p>
                  {{ card.description }}
                </p>
              </div>
              <span class="card--buttons">
                <button
                  mat-raised-button
                  color="accent"
                  (click)="openUpdateDialog(this.card)"
                >
                  Ändern
                </button>
                <ng-container *ngIf="card.markers">
                  <button
                    mat-mini-fab
                    color="warn"
                    (click)="panToLatLng(card.markers)"
                    aria-label="Example icon button with a home icon"
                  >
                    <mat-icon>pin_drop</mat-icon>
                  </button>
                </ng-container>
              </span>
            </div>
            <span
              *ngIf="cardDetailsStore.nextCardId$ | async as nextCardId"
              class="card--nav"
            >
              <button
                mat-icon-button
                [routerLink]="'/cards/details'"
                [queryParams]="{ id: nextCardId }"
              >
                <mat-icon>arrow_forward_ios</mat-icon>
              </button>
            </span>
          </div>
        </ng-container>
      </div>
    </div>
    <div class="container">
      <app-editor [cardTitleMapping]="cardTitleMapping"></app-editor>
      <span class="button-row">
        <button mat-raised-button color="accent" (click)="onSaveContent()">
          save content
        </button>
      </span>
    </div>
  `,
  styles: [
    `
      .card-details-component-container {
        display: flex;
        height: 15rem;
        margin-bottom: 20px;
        padding: 10px;
        margin-top: 10px;
      }
      .card-details-container {
        flex-grow: 1;
      }
      .card-details-side-nav {
        display: flex;
        border: solid;
        border-color: #cccccc;
        border-width: 0;
        border-radius: 5px;
        box-shadow: rgba(0, 0, 0, 0.24) 0px 3px 8px;
        margin-left: 5px;
        margin-right: 5px;
        flex-direction: column;
        flex-grow: 0;
        height: 100%;
        overflow: scroll;

        span {
          border-radius: 3px;
          height: 2rem;
          padding: 0.6rem;
        }
        span:nth-child(odd) {
          background-color: #fdfefe;
        }
      }
      .current-card {
        background-color: #bf616a !important;
        color: white;
      }

      .card {
        height: 100%;
        margin-left: 10px;
        margin-right: 10px;
        border: solid;
        border-radius: 5px;
        border-color: #cccccc;
        border-width: 0;
        background-color: #fdfefe;
        box-shadow: rgba(0, 0, 0, 0.24) 0px 3px 8px;
        display: flex;

        &--properties {
          flex-grow: 1;
          display: flex;
          flex-direction: column;
          margin: 2rem;
        }
        &--buttons {
          display: flex;
          margin-top: auto;
        }
        &--nav {
          display: flex;
          align-items: center;
          width: 50px;
        }
        button:last-of-type {
          margin-left: auto;
        }
      }

      .marker-map {
        top: 100px;
        left: 100px;
        margin-left: auto;
      }
      .card-content {
        display: flex;
        flex-direction: row;
      }

      .container {
        display: flex;
        flex-direction: column;
      }
      .button-row {
        margin: 10px;
      }
    `,
  ],
})
export class CardDetailsComponent implements OnInit, OnDestroy {
  cardId!: number;
  card$!: Observable<CardDB | undefined>;

  @ViewChild(EditorComponent)
  editor!: EditorComponent;
  cardTitleMapping!: [{ id: number; title: string }];
  allCardsInStack$: Observable<CardDB[]>;

  constructor(
    private route: ActivatedRoute,
    private markerService: MarkerService,
    public dialog: MatDialog,
    private _snackBar: MatSnackBar,
    private cardService: CardService,
    private cardContentService: CardContentService,
    public cardDetailsStore: CardDetailsStore
  ) {
    this.allCardsInStack$ = this.cardDetailsStore.allCardsInStack$;
  }

  async ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      if (this.editor) {
        this.cardContentService.cardContent.next(this.editor.getContents());
      }
      this.cardId = +params["id"];
      this.cardDetailsStore.loadStackOfCards(this.cardId);
      this.card$ = this.cardDetailsStore.currentCard$;
      this.cardContentService.setCardId(this.cardId);
    });

    this.cardService.readCardTitleMapping().then((ctm) => {
      this.cardTitleMapping = ctm;
    });
    appWindow.onCloseRequested(async () => {
      this.cardContentService.cardContent.next(this.editor.getContents());
      await this.cardContentService.saveCardContent();
    });
    // window.getCurrent().listen(TauriEvent.WINDOW_CLOSE_REQUESTED, () => {
    //   alert("Closing window and maybe saving some data :)")
    // })
    // appWindow.listen("close", async ({ event, payload }) => {
    //   await this.cardContentService.setCardId(0);
    // });
  }

  async ngOnDestroy() {
    this.cardContentService.saveCardContent();
  }

  onSaveContent() {}

  createdEditor(editor: any) {}

  panToLatLng(marker: MarkerDB[]) {
    if (marker === null) {
      return;
    }
    if (marker.length === 1) {
      emit("panTo", {
        lat: marker[0].latitude,
        lng: marker[0].longitude,
        id: marker[0].id ?? 0,
      });
    } else {
      let bounds = this.markerService.getBounds(marker);
      emit("panToBounds", {
        minLat: bounds.getSouthWest().lat,
        minLng: bounds.getSouthWest().lng,
        maxLat: bounds.getNorthEast().lat,
        maxLng: bounds.getNorthEast().lng,
        markerIds: marker.map((marker) => marker.id ?? 0),
      });
    }
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
          this._snackBar.open("Seite gelöscht", "⌫");
          dialogRef.close();
        }
      });
    const subscribeDialogUpdated =
      dialogRef.componentInstance.updated.subscribe((data: boolean) => {
        if (data === true) {
          this._snackBar.open("Änderungen gespeichert!", "💾");
        }
      });
  }

  onClickBackward() {
    throw new Error("Method not implemented.");
  }
}

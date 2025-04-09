import {
  animate,
  state,
  style,
  transition,
  trigger,
} from "@angular/animations";
import { Component, OnInit } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { MatSnackBar } from "@angular/material/snack-bar";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import { debounceTime, from, Observable, Subject, Subscription } from "rxjs";
import { Card } from "@app/model/card";
import { CardService } from "@service/card.service";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";
import { MatTableModule } from "@angular/material/table";
import { MatFormField, MatLabel } from "@angular/material/form-field";
import { CommonModule } from "@angular/common";
import { MatInputModule } from "@angular/material/input";
import { emit } from "@tauri-apps/api/event";
import { MatDivider } from "@angular/material/divider";
import { MatTooltip } from "@angular/material/tooltip";

@Component({
  standalone: true,
  selector: "app-card-list",
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatIconModule,
    MatInputModule,
    MatLabel,
    MatButtonModule,
    MatTableModule,
    MatFormField,
    MatDivider,
    MatTooltip,
  ],
  template: `
    <div class="flex flex-col p-2">
      <mat-form-field>
        <mat-label>Suche...</mat-label>
        <input
          matInput
          type="text"
          [(ngModel)]="filter"
          data-test-id="title-search-input"
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
      @for (card of allCards | async; track card.id; let isLast = $last) {
        <div class="flex flex-direction items-center">
          <span class="flex-1 pl-5">{{ card.title }}</span>
          <button
            class="flex-none"
            mat-icon-button
            color="primary"
            matTooltip="Auf Karte zeigen"
            (click)="showCardOnMap(card)"
          >
            <mat-icon>travel_explore</mat-icon>
          </button>
          <button
            class="flex-none"
            mat-icon-button
            color="accent"
            matTooltip="Detail Seite öffnen"
            (click)="goToDetailsPage(card.id!)"
          >
            <mat-icon>article</mat-icon>
          </button>
        </div>
        <mat-divider *ngIf="!isLast"></mat-divider>
      }
    </div>
  `,
  animations: [
    trigger("detailExpand", [
      state("collapsed,void", style({ height: "0px", minHeight: "0" })),
      state("expanded", style({ height: "*" })),
      transition(
        "expanded <=> collapsed",
        animate("225ms cubic-bezier(0.4, 0.0, 0.2, 1)"),
      ),
    ]),
  ],
})
export class CardListComponent implements OnInit {
  allCards: Observable<Card[]>;
  numCards: number = 0;
  filter: string = "";
  modelChanged: Subject<string> = new Subject<string>();
  subscription!: Subscription;
  displayedColumns = ["title", "description"];
  columnsToDisplayWithExpand = [...this.displayedColumns, "expand"];
  expandedElement: Card | null;
  debounceTime = 500;

  constructor(
    private cardService: CardService,
    public dialog: MatDialog,
    private _snackBar: MatSnackBar,
  ) {
    this.cardService
      .getNumberOfCards()
      .then((count) => (this.numCards = count));
    this.allCards = from(this.cardService.readCardByTitle(""));
    this.expandedElement = null;
  }

  async ngOnInit() {
    this.subscription = this.modelChanged
      .pipe(debounceTime(this.debounceTime))
      .subscribe(async (filter) => {
        this.allCards = from(this.cardService.readCardByTitle(filter));
      });
  }

  inputChanged() {
    this.modelChanged.next(this.filter);
  }

  goToDetailsPage(cardId: number) {
    const webview = new WebviewWindow(cardId.toString(), {
      url: "cards/details/" + cardId,
    });
    webview.once("tauri://error", function (e) {
      console.error("window creation error: " + JSON.stringify(e));
      webview.emit("set-focus-to");
    });
  }

  showCardOnMap(card: Card) {
    return emit("panTo", {
      lat: card.latitude,
      lng: card.longitude,
      id: card.id,
    });
  }
}

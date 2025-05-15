import {
  animate,
  state,
  style,
  transition,
  trigger,
} from "@angular/animations";
import {
  Component,
  Input,
  model,
  OnDestroy,
  OnInit,
  signal,
  WritableSignal,
} from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { debounceTime, Observable, Subscription } from "rxjs";
import { InfoCard, isLocationCard, LocationCard } from "@app/model/card";
import { CardService } from "@service/card.service";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";
import { MatTableModule } from "@angular/material/table";
import { MatFormField, MatLabel } from "@angular/material/form-field";
import { CommonModule } from "@angular/common";
import { MatInputModule } from "@angular/material/input";
import { emit, listen, UnlistenFn } from "@tauri-apps/api/event";
import { MatDivider } from "@angular/material/divider";
import { MatTooltip } from "@angular/material/tooltip";
import { toObservable } from "@angular/core/rxjs-interop";
import { createCardDetailsWindow } from "@app/util/window-util";

@Component({
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
          data-testid="title-search-input"
        />
        <button
          *ngIf="filter"
          data-testid="clear-input"
          matSuffix
          mat-icon-button
          aria-label="Clear"
          (click)="filter.set('')"
        >
          <mat-icon>close</mat-icon>
        </button>
      </mat-form-field>
      @for (card of allCards(); track card.id; let isLast = $last) {
        <div data-testid="card-row" class="flex flex-direction items-center">
          <span class="flex-1 pl-5">{{ card.title }}</span>
          <button
            *ngIf="isLocationCard(card)"
            [attr.data-testid]="'nav-to-card-' + card.id"
            class="flex-none"
            mat-icon-button
            color="primary"
            matTooltip="Auf Karte zeigen"
            (click)="showCardOnMap(card)"
          >
            <mat-icon>travel_explore</mat-icon>
          </button>
          <button
            [attr.data-testid]="'open-details-for-card-' + card.id"
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
export class CardListComponent implements OnInit, OnDestroy {
  allCards: WritableSignal<(LocationCard | InfoCard)[]> = signal([]);
  subscription!: UnlistenFn;
  @Input()
  debounceTime?: number;
  filter = model<string>("");
  filter$: Observable<string>;

  constructor(
    private cardService: CardService,
    public dialog: MatDialog,
  ) {
    this.filter$ = toObservable(this.filter);
  }

  ngOnDestroy(): void {
    this.subscription();
  }

  async ngOnInit() {
    this.allCards.set(await this.cardService.readCardByTitle(""));
    this.filter$
      .pipe(debounceTime(this.debounceTime ?? 200))
      .subscribe(async (filter) =>
        this.allCards.set(await this.cardService.readCardByTitle(filter)),
      );
    this.subscription = await listen(
      "card-deleted",
      (event: { payload: number }) => {
        this.allCards.update((allCards) =>
          allCards.reduce<(LocationCard | InfoCard)[]>(
            (acc, card) =>
              card.id !== event.payload ? [...acc, ...[card]] : acc,
            [],
          ),
        );
      },
    );
  }

  async goToDetailsPage(cardId: number) {
    await createCardDetailsWindow(cardId);
  }

  showCardOnMap(card: LocationCard) {
    return emit("panTo", {
      lat: card.latitude,
      lng: card.longitude,
      id: card.id,
    });
  }

  protected readonly isLocationCard = isLocationCard;
}

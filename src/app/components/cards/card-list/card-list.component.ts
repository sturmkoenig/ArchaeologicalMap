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
  ],
  template: `
    <div class="list-container">
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
      <table mat-table [dataSource]="allCards" multiTemplateDataRows>
        <ng-container matColumnDef="title">
          <th mat-header-cell *matHeaderCellDef>Title</th>
          <td mat-cell *matCellDef="let element">
            <b>{{ element.title }}</b>
          </td>
        </ng-container>
        <ng-container matColumnDef="description">
          <th mat-header-cell *matHeaderCellDef>Description</th>
          <td mat-cell *matCellDef="let element">{{ element.description }}</td>
        </ng-container>

        <ng-container matColumnDef="expand">
          <th mat-header-cell *matHeaderCellDef aria-label="row actions">
            &nbsp;
          </th>
          <td mat-cell *matCellDef="let element">
            <button
              mat-icon-button
              aria-label="expand row"
              (click)="
                expandedElement = expandedElement === element ? null : element;
                $event.stopPropagation()
              "
            >
              @if (expandedElement === element) {
                <mat-icon>keyboard_arrow_up</mat-icon>
              } @else {
                <mat-icon>keyboard_arrow_down</mat-icon>
              }
            </button>
          </td>

          <ng-container matColumnDef="expandedDetail">
            <td
              mat-cell
              *matCellDef="let card"
              [attr.colspan]="columnsToDisplayWithExpand.length"
            >
              <div
                class="expanded-card--actions"
                [@detailExpand]="
                  card === expandedElement ? 'expanded' : 'collapsed'
                "
              >
                <button
                  mat-button
                  color="primary"
                  (click)="showCardOnMap(card)"
                >
                  Auf Karte Zeigen
                </button>
                <button
                  mat-raised-button
                  color="accent"
                  (click)="goToDetailsPage(card.id!)"
                >
                  Info-Seite öffnen
                </button>
              </div>
            </td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="columnsToDisplayWithExpand"></tr>
          <tr
            mat-row
            *matRowDef="let card; columns: columnsToDisplayWithExpand"
            class="card-row"
            data-test-id="table-row"
            [class.expanded-row]="expandedElement === card"
            (click)="expandedElement = expandedElement === card ? null : card"
          ></tr>
          <tr
            mat-row
            *matRowDef="let row; columns: ['expandedDetail']"
            class="card-detail-row"
          ></tr>
        </ng-container>
      </table>
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
  styles: [
    `
      button {
        margin: 0.2rem;
      }

      .card-row td {
        border-bottom-width: 0;
      }

      .list-container {
        padding-top: 2rem;
        display: flex;
        flex-direction: column;
      }
      .example-card {
        z-index: 1000;
        max-width: 400px;
        margin-bottom: 8px;
      }
      tr {
        padding-left: 10px;
      }
      tr:nth-child(even) {
        background-color: white;
      }
      tr.card-detail-row {
        height: 0;
      }

      tr.card-row:not(.expanded-row):hover {
        background: whitesmoke;
      }

      tr.card-row:not(.expanded-row):active {
        background: #efefef;
      }
    `,
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

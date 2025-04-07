import {
  animate,
  state,
  style,
  transition,
  trigger,
} from "@angular/animations";
import { Component, OnInit } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { PageEvent } from "@angular/material/paginator";
import { MatSnackBar } from "@angular/material/snack-bar";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import { Observable, Subject, Subscription, debounceTime, from } from "rxjs";
import { CardDB } from "@app/model/card";
import { CardService } from "@service/card.service";
import { CardUpdateModalComponent } from "@app/components/cards/card-update-modal/card-update-modal.component";

@Component({
  selector: "app-card-list",
  template: `
    <div class="list-container">
      <mat-form-field>
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
              *matCellDef="let element"
              [attr.colspan]="columnsToDisplayWithExpand.length"
            >
              <div
                class="expanded-card--actions"
                [@detailExpand]="
                  element === expandedElement ? 'expanded' : 'collapsed'
                "
              >
                <button
                  mat-button
                  color="primary"
                  (click)="openUpdateDialog(element)"
                >
                  Bearbeiten
                </button>
                <button
                  mat-raised-button
                  color="accent"
                  (click)="goToDetailsPage(element.id!)"
                >
                  Info-Seite öffnen
                </button>
              </div>
            </td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="columnsToDisplayWithExpand"></tr>
          <tr
            mat-row
            *matRowDef="let element; columns: columnsToDisplayWithExpand"
            class="card-row"
            [class.expanded-row]="expandedElement === element"
            (click)="
              expandedElement = expandedElement === element ? null : element
            "
          ></tr>
          <tr
            mat-row
            *matRowDef="let row; columns: ['expandedDetail']"
            class="card-detail-row"
          ></tr>
        </ng-container>
      </table>
      <mat-paginator
        [length]="numCards"
        [pageSizeOptions]="[1000]"
        [pageIndex]="pageIndex"
        (page)="changePage($event)"
        aria-label="Select page"
      >
      </mat-paginator>
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
  allCards: Observable<CardDB[]>;
  numCards: number = 0;
  filter: string = "";
  modelChanged: Subject<string> = new Subject<string>();
  subscription!: Subscription;
  displayedColumns = ["title", "description"];
  columnsToDisplayWithExpand = [...this.displayedColumns, "expand"];
  expandedElement: CardDB | null;
  debounceTime = 500;
  pageIndex: number = 0;

  constructor(
    private cardService: CardService,
    public dialog: MatDialog,
    private _snackBar: MatSnackBar,
  ) {
    this.cardService
      .getNumberOfCards()
      .then((count) => (this.numCards = count));
    this.allCards = from(this.cardService.readCardsPaginated(0, ""));
    this.expandedElement = null;
  }

  ngOnInit(): void {
    this.subscription = this.modelChanged
      .pipe(debounceTime(this.debounceTime))
      .subscribe((filter) => {
        this.allCards = from(
          this.cardService.readCardsPaginated(this.pageIndex, filter),
        );
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

  changePage($event: PageEvent) {
    this.allCards = from(
      this.cardService.readCardsPaginated($event.pageIndex, ""),
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
    dialogRef.componentInstance.deleted.subscribe((data: boolean) => {
      if (data) {
        this._snackBar.open("Seite gelöscht", "⌫");
        dialogRef.close();
        this.inputChanged();
      }
    });
    dialogRef.componentInstance.updated.subscribe((data: boolean) => {
      if (data) {
        this._snackBar.open("Änderungen gespeichert!", "💾");
      }
    });
  }
}

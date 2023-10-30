import { AfterViewInit, Component, OnInit, ViewChild } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { MatCard } from "@angular/material/card";
import { BehaviorSubject, catchError, Observable, throwError } from "rxjs";
import { CardService } from "src/app/services/card.service";
import { invoke } from "@tauri-apps/api";
import { emit, listen } from "@tauri-apps/api/event";

import { CardDB, MarkerDB, MarkerLatLng } from "src/app/model/card";
import { MatSnackBar } from "@angular/material/snack-bar";
import Quill from "quill";
import { RangeStatic } from "quill";
import { EditorComponent } from "src/app/layout/editor/editor.component";
import { IconService } from "src/app/services/icon.service";
import { MatDialog } from "@angular/material/dialog";
import { CardUpdateModalComponent } from "../card-update-modal/card-update-modal.component";
import { MarkerService } from "src/app/services/marker.service";

@Component({
  selector: "app-card-details",
  template: `
    <ng-container *ngIf="card$ | async as card">
      <mat-card class="card">
        <mat-card-header>
          <!--TODO adjust card avatar to land or something-->
          <!-- <div mat-card-avatar class="card-avatar">
            <img
              src="{{ iconService.getIconPath(card.markers[0].icon_name) }}"
            />
          </div> -->
          <mat-card-title>{{ card.title }}</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div class="card-content">
            <p>
              {{ card.description }}
            </p>
            <!-- <app-position-picker
              class="marker-map"
              [editable]="false"
              [markers]="card.markers"
            ></app-position-picker> -->
          </div>
        </mat-card-content>
        <mat-card-actions>
          <!-- TODO what marker to pan to? -->
          <div class="card-buttons">
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
          </div>
        </mat-card-actions>
      </mat-card>
    </ng-container>

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
      .card {
        margin: 2rem;
      }
      .card-buttons {
        width: 100%;
        display: flex;
        flex-direction: row;
      }
      button:last-of-type {
        margin-left: auto;
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
export class CardDetailsComponent implements OnInit {
  cardId!: number;
  card$!: Promise<CardDB>;

  @ViewChild(EditorComponent)
  editor!: EditorComponent;
  cardTitleMapping!: [{ id: number; title: string }];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private markerService: MarkerService,
    public dialog: MatDialog,
    private _snackBar: MatSnackBar,
    private cardService: CardService,
    public iconService: IconService
  ) {}

  async ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      this.cardId = +params["id"];
      this.card$ = this.cardService.readCard(this.cardId);
    });
    invoke("read_card_content", { id: this.cardId.toString() }).then(
      (res: any) => {
        let loadedContent: any;
        try {
          this.editor.setContents(JSON.parse(res));
        } catch (error) {
          return;
        }
      }
    );
    this.cardService.readCardTitleMapping().then((ctm) => {
      this.cardTitleMapping = ctm;
    });
  }

  onSaveContent() {
    invoke("write_card_content", {
      id: this.cardId.toString(),
      content: JSON.stringify(this.editor.getContents()),
    }).then((res) => {
      this._snackBar.open("Gespeichert!", "💾");
    });
  }

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
}

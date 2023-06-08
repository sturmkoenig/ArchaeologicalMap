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
          <p>
            {{ card.description }}
          </p>
        </mat-card-content>
        <mat-card-actions>
          <!-- TODO what marker to pan to? -->
          <ng-container *ngIf="card.markers && card.markers[0]">
            <button
              mat-raised-button
              color="primary"
              (click)="panToLatLng(card.markers)"
            >
              auf karte zeigen
            </button>
          </ng-container>
        </mat-card-actions>
      </mat-card>
    </ng-container>

    <div class="container">
      <app-editor [cardTitleMapping]="cardTitleMapping"></app-editor>
      <span class="button-row">
        <button mat-button (click)="onSaveContent()">save content</button>
      </span>
    </div>
  `,
  styles: [
    `
      .card {
        margin: 2rem;
      }

      .container {
        display: flex;
        flex-direction: column;
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

  panToLatLng(marker: MarkerLatLng[]) {
    if (marker != null && marker[0])
      emit("panTo", { lat: marker[0].latitude, lng: marker[0].longitude });
  }
}

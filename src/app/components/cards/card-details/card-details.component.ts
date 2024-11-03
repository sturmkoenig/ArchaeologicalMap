import { Component, OnInit, ViewChild } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { emit, listen } from "@tauri-apps/api/event";
import { CardService } from "src/app/services/card.service";

import { MatDialog } from "@angular/material/dialog";
import { MatSnackBar } from "@angular/material/snack-bar";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { Observable } from "rxjs";
import { EditorComponent } from "src/app/layout/editor/editor.component";
import { CardDB, MarkerDB } from "src/app/model/card";
import { CardContentService } from "src/app/services/card-content.service";
import { MarkerService } from "src/app/services/marker.service";
import { CardDetailsStore } from "src/app/state/card-details.store";
import { ImageEntity } from "src/app/model/image";

const appWindow = getCurrentWebviewWindow();

@Component({
  selector: "app-card-details",
  templateUrl: "./card-details.component.html",
  styleUrls: ["./card-details.component.scss"],
})
export class CardDetailsComponent implements OnInit {
  cardId!: number;
  card$!: Observable<CardDB | undefined>;

  @ViewChild(EditorComponent)
  editor!: EditorComponent;
  allCardsInStack$: Observable<CardDB[]>;
  currentStackId$: Observable<number | undefined>;
  regionImage$: Observable<ImageEntity | undefined>;

  constructor(
    private route: ActivatedRoute,
    private markerService: MarkerService,
    public dialog: MatDialog,
    private _snackBar: MatSnackBar,
    private cardService: CardService,
    private cardContentService: CardContentService,
    public cardDetailsStore: CardDetailsStore,
  ) {
    this.allCardsInStack$ = this.cardDetailsStore.allCardsInStack$;
    this.currentStackId$ = this.cardDetailsStore.currentStackId$;
    this.card$ = this.cardDetailsStore.currentCard$;
    this.regionImage$ = this.cardDetailsStore.currentImage$;
    listen("tauri://focus", async () => {
      this.cardContentService.cardContent.next(this.editor.getContents());
      await this.cardContentService.saveCardContent();
    });
  }

  async ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      if (this.editor) {
        this.cardContentService.cardContent.next(this.editor.getContents());
      }
      this.cardId = +params["id"];
      this.cardDetailsStore.loadStackOfCards(this.cardId);
      this.cardContentService.setCardId(this.cardId);
      listen("set-focus-to", async () => {
        console.log("set-focus-to");
        await appWindow.setFocus();
      });
    });

    appWindow.onCloseRequested(async () => {
      this.cardContentService.cardContent.next(this.editor.getContents());
      await this.cardContentService.saveCardContent();
    });
  }

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
      const bounds = this.markerService.getBounds(marker);
      emit("panToBounds", {
        minLat: bounds.getSouthWest().lat,
        minLng: bounds.getSouthWest().lng,
        maxLat: bounds.getNorthEast().lat,
        maxLng: bounds.getNorthEast().lng,
        markerIds: marker.map((marker) => marker.id ?? 0),
      });
    }
  }
}

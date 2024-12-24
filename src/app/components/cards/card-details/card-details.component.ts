import { Component, OnInit, ViewChild } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { emit, listen } from "@tauri-apps/api/event";

import { MatDialog } from "@angular/material/dialog";
import { MatSnackBar } from "@angular/material/snack-bar";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { Observable } from "rxjs";
import { EditorComponent } from "@app/layout/editor/editor.component";
import { CardDB, MarkerDB } from "@app/model/card";
import { CardContentService } from "@service/card-content.service";
import { MarkerService } from "@service/marker.service";
import { CardDetailsStore } from "@app/state/card-details.store";
import { ImageEntity } from "@app/model/image";

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
    const appWindow = getCurrentWindow();
    this.route.paramMap.subscribe((params) => {
      if (this.editor) {
        this.cardContentService.cardContent.next(this.editor.getContents());
      }
      const cardId = params.get("id");
      if (cardId) {
        this.cardId = Number(cardId);
      }
      this.cardDetailsStore.loadStackOfCards(this.cardId);
      this.cardContentService.setCardId(this.cardId);
      listen("set-focus-to", async () => {
        await appWindow.setFocus();
      });
    });

    await appWindow.onCloseRequested(async () => {
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

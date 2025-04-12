import { Component, OnInit, ViewChild } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { emit, listen } from "@tauri-apps/api/event";

import { MatDialog } from "@angular/material/dialog";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { Observable } from "rxjs";
import { EditorComponent } from "@app/layout/editor/editor.component";
import { Card } from "@app/model/card";
import { CardContentService } from "@service/card-content.service";
import { CardDetailsStore } from "@app/state/card-details.store";
import { ImageEntity } from "@app/model/image";
import { Window } from "@tauri-apps/api/window";

@Component({
  selector: "app-card-details",
  templateUrl: "./card-details.component.html",
  styleUrls: ["./card-details.component.scss"],
  standalone: false,
})
export class CardDetailsComponent implements OnInit {
  cardId!: number;
  card$!: Observable<Card | undefined>;

  @ViewChild(EditorComponent)
  editor!: EditorComponent;
  allCardsInStack$: Observable<Card[]>;
  currentStackId$: Observable<number | undefined>;
  regionImage$: Observable<ImageEntity | undefined>;

  constructor(
    private route: ActivatedRoute,
    public dialog: MatDialog,
    private cardContentService: CardContentService,
    public cardDetailsStore: CardDetailsStore,
  ) {
    this.allCardsInStack$ = this.cardDetailsStore.allCardsInStack$;
    this.currentStackId$ = this.cardDetailsStore.currentStackId$;
    this.card$ = this.cardDetailsStore.currentCard$;
    this.regionImage$ = this.cardDetailsStore.currentImage$;
    this.cardDetailsStore.currentStack$.subscribe(async (stack) => {
      await Window.getCurrent().setTitle(stack?.name ?? "");
    });

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
      } else {
        console.error("cardId not provided!");
      }
      this.cardDetailsStore.loadStackOfCards(this.cardId);
      this.cardContentService.setCardId(this.cardId);
      listen(`set-focus-to-${cardId}`, async () => {
        await appWindow.setFocus();
      });
    });
    listen("card-changed", (_) => {
      // TODO only reload if changed card is in stack!
      this.cardDetailsStore.resetState$();
      this.cardDetailsStore.loadStackOfCards(this.cardId);
    });

    await appWindow.onCloseRequested(async () => {
      this.cardContentService.cardContent.next(this.editor.getContents());
      await this.cardContentService.saveCardContent();
    });
  }

  async panToLatLng(card: Card) {
    return emit("panTo", {
      lat: card.latitude,
      lng: card.longitude,
      id: card.id ?? 0,
    });
  }
}

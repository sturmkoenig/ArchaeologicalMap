import { Component, effect, inject, OnInit, ViewChild } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { emit, listen } from "@tauri-apps/api/event";

import { MatDialog } from "@angular/material/dialog";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { EditorComponent } from "@app/layout/editor/editor.component";
import { Card, InfoCard, isLocationCard } from "@app/model/card";
import { CardContentService } from "@service/card-content.service";
import { AddCardDialogComponent } from "../card-input/add-card-dialog.component";
import { EditCardDialogComponent } from "../card-input/edit-card-dialog.component";
import { CardService } from "@service/card.service";
import { CardDetailsSignalStore } from "@app/state/card-details-signal.store";

@Component({
  selector: "app-card-details",
  templateUrl: "./card-details.component.html",
  styleUrls: ["./card-details.component.scss"],
  providers: [CardDetailsSignalStore],
  standalone: false,
})
export class CardDetailsComponent implements OnInit {
  @ViewChild(EditorComponent)
  editor!: EditorComponent;
  readonly store = inject(CardDetailsSignalStore);

  constructor(
    private route: ActivatedRoute,
    public dialog: MatDialog,
    private cardContentService: CardContentService,
    private cardService: CardService,
  ) {
    listen("tauri://focus", async () => {
      this.cardContentService.cardContent.next(this.editor.getContents());
      await this.cardContentService.saveCardContent();
    });
    effect(() => {
      const newCardId = this.store.currentCard()?.id;
      if (newCardId && newCardId !== this.cardContentService.cardId.value)
        this.cardContentService.setCardId(newCardId);
    });
  }

  async ngOnInit() {
    const appWindow = getCurrentWindow();
    this.route.paramMap.subscribe((params) => {
      if (this.editor) {
        this.cardContentService.cardContent.next(this.editor.getContents());
      }
      const cardId = Number(params.get("cardId"));
      const stackId = Number(params.get("stackId"));
      if (cardId) {
        this.store.setCard(cardId);
        listen(`set-focus-to-${cardId}`, async () => {
          await appWindow.setFocus();
        });
      } else if (stackId) {
        this.store.setStack(stackId);
      } else {
        console.error("cardId not provided!");
      }
    });
    listen("card-changed", async (event: { payload: Card }) => {
      const changedCard = event.payload;
      const currentStack = this.store.stack();
      const currentCard = this.store.currentCard();

      if (!changedCard?.id || !currentCard?.id) return;

      const isViewingStack = currentStack !== undefined;
      const changedCardIsInCurrentStack =
        changedCard.stackId === currentStack?.id;
      const changedCardIsCurrentCard = changedCard.id === currentCard.id;

      if (isViewingStack) {
        if (changedCardIsInCurrentStack) {
          this.store.setStack(currentStack.id, changedCard.id);
        } else if (changedCardIsCurrentCard) {
          this.store.setStack(currentStack.id);
        }
      } else {
        if (changedCardIsCurrentCard) {
          this.store.setCard(changedCard.id);
        }
      }
    });

    await appWindow.onCloseRequested(async () => {
      this.cardContentService.cardContent.next(this.editor.getContents());
      await this.cardContentService.saveCardContent();
    });
  }

  async onShowOnMap(card: Card) {
    if (isLocationCard(card)) {
      return emit("panTo", {
        lat: card.latitude,
        lng: card.longitude,
        id: card.id ?? 0,
      });
    } else {
      this.openEditCardDialog(card);
    }
  }

  openEditCardDialog(card: Card) {
    const dialogRef = this.dialog.open(EditCardDialogComponent, {
      data: { card },
    });

    dialogRef.afterClosed().subscribe(async (result: Card) => {
      if (result) {
        try {
          await this.cardService.updateCard(result);
        } catch (e) {
          console.error("Failed to update card:", e);
        }
      }
    });
  }

  openAddCardDialog() {
    const stackId = this.store.stack()?.id;
    if (!stackId) return;

    const dialogRef = this.dialog.open(AddCardDialogComponent, {
      data: { stackId },
    });

    dialogRef.afterClosed().subscribe(async (result: InfoCard) => {
      if (result) {
        try {
          const createdCard = await this.cardService.createCard(result);
          this.store.setStack(stackId!, createdCard.id);
        } catch (e) {
          console.error("Failed to create card:", e);
        }
      }
    });
  }

  protected readonly isLocationCard = isLocationCard;
}

import { Injectable } from "@angular/core";
import { ComponentStore } from "@ngrx/component-store";
import {
  Observable,
  combineLatest,
  from,
  of,
  switchMap,
  tap,
  EMPTY,
} from "rxjs";
import { CardDB } from "../model/card";
import { CardService } from "../services/card.service";
import { ImageEntity } from "../model/image";
import { ImageService } from "../services/image.service";
import { Stack } from "../model/stack";

export enum status {
  loaded,
  loading,
}

export type CardDetailsState =
  | {
      status: status.loaded;
      currentStackId?: number;
      previousCard?: CardDB;
      currentCard: CardDB;
      currentImage?: ImageEntity;
      nextCard?: CardDB;
      cardsInStack: CardDB[];
    }
  | {
      status: status.loading;
      stackId?: number;
    };

@Injectable()
export class CardDetailsStore extends ComponentStore<CardDetailsState> {
  private calculateNextAndPreviousCard(
    allCardsInStack: CardDB[],
    currentCardIndex: number,
  ): { previousCard?: CardDB; nextCard?: CardDB } {
    let previousCard: CardDB | undefined = undefined;
    let nextCard: CardDB | undefined = undefined;

    if (currentCardIndex > 0 && currentCardIndex < allCardsInStack.length) {
      previousCard = allCardsInStack[currentCardIndex - 1];
    }
    if (currentCardIndex >= 0 && currentCardIndex < allCardsInStack.length) {
      nextCard = allCardsInStack[currentCardIndex + 1];
    }

    return { previousCard: previousCard, nextCard: nextCard };
  }

  readonly allCardsInStack$ = this.select((state) => {
    if (state.status === status.loading) {
      return [];
    } else {
      return state.cardsInStack;
    }
  });

  readonly currentCard$ = this.select((state) => {
    if (state.status === status.loading) {
      return undefined;
    }
    return state.currentCard;
  });

  readonly currentImage$ = this.select((state) => {
    if (state.status === status.loading) {
      return undefined;
    }
    return state.currentImage;
  });

  readonly previousCardId$ = this.select((state) => {
    if (state.status === status.loading) {
      return undefined;
    }
    if (state.previousCard) {
      return state.previousCard.id;
    }
    return undefined;
  });

  readonly nextCardId$ = this.select((state) => {
    if (state.status === status.loading) {
      return undefined;
    }
    if (state.nextCard) {
      return state.nextCard.id;
    }
    return undefined;
  });

  readonly currentStackId$ = this.select((state) => {
    if (state.status === status.loading) {
      return undefined;
    } else {
      return state.currentStackId;
    }
  });
  readonly setAllCards = this.updater((state, newState: any) => {
    return {
      status: status.loaded,
      cardsInStack: newState.cardsInStack,
      currentStackId: newState.currentStackId,
      previousCard: newState.previousCard,
      currentCard: newState.currentCard,
      nextCard: newState.nextCard,
    };
  });

  readonly loadStackOfCards = this.effect((cardId$: Observable<number>) => {
    const card$ = cardId$.pipe(
      switchMap((cardId) => {
        const card = this.cardService.readCard(cardId);
        return card;
      }),
    );
    return combineLatest([card$, this.currentStackId$]).pipe(
      switchMap(([card, currentStackId]) => {
        if (card.stack_id === undefined || card.stack_id === null) {
          return of(
            this.setAllCards({
              status: status.loaded,
              currentCardIndex: 0,
              currentCard: card,
              cardsInStack: [card],
            }),
          );
        }

        if (currentStackId && currentStackId === card.stack_id) {
          this.updateCurrentCard(card.id!);
          return of();
        }

        return from(this.cardService.getAllCardsForStack(card.stack_id)).pipe(
          tap({
            next: (allCardsInStack) => {
              allCardsInStack.sort((card, nextCard) =>
                card.title.localeCompare(nextCard.title),
              );
              const currentCardIndex: number = allCardsInStack.findIndex(
                (x) => x.id === card.id,
              );

              const { previousCard, nextCard } =
                this.calculateNextAndPreviousCard(
                  allCardsInStack,
                  currentCardIndex,
                );

              this.setAllCards({
                status: status.loaded,
                previousCard: previousCard,
                currentCardIndex: currentCardIndex,
                currentStackId: card.stack_id,
                nextCard: nextCard,
                currentCard: card,
                cardsInStack: allCardsInStack,
              });
            },
            error: (e) => console.error(e),
          }),
        );
      }),
    );
  });
  readonly setImage = this.updater((state, image: ImageEntity | undefined) => {
    return {
      ...state,
      currentImage: image,
    };
  });

  readonly updateCurrentImage = this.effect(
    (imageId$: Observable<number | undefined>) => {
      return imageId$.pipe(
        switchMap((imageId) => {
          if (imageId === undefined || imageId === null) {
            return EMPTY;
          } else {
            return this.imageService.readImage(imageId);
          }
        }),
        tap({
          next: (image: ImageEntity | undefined) => {
            this.setImage(image);
          },
          error: (e) => console.error(e),
        }),
      );
    },
  );

  readonly updateCurrentCard = this.updater((state, cardId: number) => {
    if (state.status === status.loading) {
      return state;
    }
    const currentCardIndex: number = state.cardsInStack.findIndex(
      (x) => x.id === cardId,
    );
    const { nextCard, previousCard } = this.calculateNextAndPreviousCard(
      state.cardsInStack,
      currentCardIndex,
    );
    const imageId = state.cardsInStack[currentCardIndex].region_image_id;
    this.updateCurrentImage(imageId);
    return {
      ...state,
      nextCard: nextCard,
      previousCard: previousCard,
      currentCard: state.cardsInStack[currentCardIndex],
    };
  });

  constructor(
    private cardService: CardService,
    private imageService: ImageService,
  ) {
    super({ status: status.loading });
  }
}

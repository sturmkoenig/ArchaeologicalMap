import { Injectable } from "@angular/core";
import { ComponentStore } from "@ngrx/component-store";
import {
  combineLatest,
  EMPTY,
  from,
  map,
  Observable,
  of,
  switchMap,
  tap,
} from "rxjs";
import { CardDB } from "../model/card";
import { CardService } from "../services/card.service";
import { ImageEntity } from "../model/image";
import { ImageService } from "../services/image.service";
import { StackService } from "@service/stack.service";
import { Stack } from "@app/model/stack";

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
      currentStack?: Stack;
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
  readonly currentStack$ = this.select((state) => {
    if (state.status === status.loading) {
      return undefined;
    }
    return state.currentStack;
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
  readonly setAllCards = this.updater(
    (state, newState: Extract<CardDetailsState, { status: status.loaded }>) => {
      return {
        status: status.loaded,
        cardsInStack: newState.cardsInStack,
        currentStackId: newState.currentStackId,
        currentStack: newState.currentStack,
        previousCard: newState.previousCard,
        currentCard: newState.currentCard,
        nextCard: newState.nextCard,
      };
    },
  );

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
          this.setAllCards(
            of({
              status: status.loaded,
              currentCard: card,
              cardsInStack: [card],
            }),
          );
          return EMPTY;
        }

        if (currentStackId && currentStackId === card.stack_id) {
          this.updateCurrentCard(card.id!);
          return EMPTY;
        }

        return from(this.cardService.getAllCardsForStack(card.stack_id)).pipe(
          map((cards: { stack: Stack; cards: CardDB[] }) => ({
            cards: cards.cards,
            stack: cards.stack,
            card,
          })),
        );
      }),
      tap({
        next: ({ cards: allCardsInStack, stack, card: card }) => {
          allCardsInStack.sort((card, nextCard) =>
            card.title.localeCompare(nextCard.title),
          );
          const currentCardIndex: number = allCardsInStack.findIndex(
            (x) => x.id === card.id,
          );

          const { previousCard, nextCard } = this.calculateNextAndPreviousCard(
            allCardsInStack,
            currentCardIndex,
          );

          this.setAllCards({
            status: status.loaded,
            previousCard: previousCard,
            currentStackId: card.stack_id ?? undefined,
            currentStack: stack,
            nextCard: nextCard,
            currentCard: card,
            cardsInStack: allCardsInStack,
          });
        },
        error: (e) => console.error(e),
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
    private stackService: StackService,
  ) {
    super({ status: status.loading });
  }
}

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
import { Card } from "../model/card";
import { CardService } from "@service/card.service";
import { ImageEntity } from "../model/image";
import { ImageService } from "@service/image.service";
import { Stack } from "@app/model/stack";

export enum status {
  loaded,

  loading,
}

export type CardDetailsState =
  | {
      status: status.loaded;
      currentStackId?: number;
      previousCard?: Card;
      currentCard?: Card;
      currentImage?: ImageEntity;
      currentStack?: Stack;
      nextCard?: Card;
      cardsInStack: Card[];
    }
  | {
      status: status.loading;
      stackId?: number;
    };

@Injectable()
export class CardDetailsStore extends ComponentStore<CardDetailsState> {
  private calculateNextAndPreviousCard(
    allCardsInStack: Card[],
    currentCardIndex: number,
  ): { previousCard?: Card; nextCard?: Card } {
    let previousCard: Card | undefined = undefined;
    let nextCard: Card | undefined = undefined;

    if (currentCardIndex > 0 && currentCardIndex < allCardsInStack.length) {
      previousCard = allCardsInStack[currentCardIndex - 1];
    }
    if (currentCardIndex >= 0 && currentCardIndex < allCardsInStack.length) {
      nextCard = allCardsInStack[currentCardIndex + 1];
    }

    return { previousCard: previousCard, nextCard: nextCard };
  }

  private readonly setCardsFromStack = this.updater(
    (
      _state,
      {
        cards,
        stack,
        currentCardId,
      }: {
        cards: Card[];
        stack: Stack;
        currentCardId?: number;
      },
    ): CardDetailsState => {
      cards.sort((a, b) => a.title.localeCompare(b.title));

      const index =
        currentCardId !== undefined
          ? cards.findIndex((x) => x.id === currentCardId)
          : 0;

      const currentCard = cards[index];
      const { previousCard, nextCard } = this.calculateNextAndPreviousCard(
        cards,
        index,
      );

      this.updateCurrentImage(currentCard?.regionImageId);

      return {
        status: status.loaded,
        previousCard,
        currentCard,
        nextCard,
        currentStack: stack,
        currentStackId: stack.id,
        cardsInStack: cards,
      };
    },
  );

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
  readonly resetState$ = this.updater((_) => {
    return {
      status: status.loading,
    };
  });
  readonly setAllCards = this.updater(
    (
      _state,
      newState: Extract<CardDetailsState, { status: status.loaded }>,
    ) => {
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
  readonly loadStack = this.effect((stackId$: Observable<number>) => {
    return stackId$.pipe(
      switchMap((stackId) =>
        from(this.cardService.getAllCardsForStack(stackId)).pipe(
          map(({ cards, stack }) => ({ cards, stack })),
        ),
      ),
      tap({
        next: ({ cards, stack }) => {
          if (!cards || cards.length === 0) {
            this.setAllCards({
              status: status.loaded,
              cardsInStack: [],
              currentStackId: stack.id,
              currentStack: stack,
              currentCard: undefined, // optionally guard against this in your template
              previousCard: undefined,
              nextCard: undefined,
            });
            return;
          }

          this.setCardsFromStack({
            cards,
            stack,
          });
        },
        error: (e) => console.error("Failed to load stack", e),
      }),
    );
  });

  readonly loadStackOfCards = this.effect((cardId$: Observable<number>) => {
    const card$ = cardId$.pipe(
      switchMap((cardId) => {
        return this.cardService.readCard(cardId);
      }),
    );
    return combineLatest([card$, this.currentStackId$]).pipe(
      switchMap(([card, currentStackId]) => {
        if (card.stackId === undefined || card.stackId === null) {
          this.setAllCards(
            of({
              status: status.loaded,
              currentCard: card,
              cardsInStack: [card],
            }),
          );
          return EMPTY;
        }

        if (currentStackId && currentStackId === card.stackId) {
          this.updateCurrentCard(card.id!);
          return EMPTY;
        }

        return from(this.cardService.getAllCardsForStack(card.stackId)).pipe(
          map((cards) => ({
            cards: cards.cards,
            stack: cards.stack,
            card,
          })),
        );
      }),
      tap({
        next: ({ cards, stack, card }) => {
          this.setCardsFromStack({
            cards,
            stack,
            currentCardId: card.id,
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

  readonly updateCurrentCard = this.updater(
    (state: CardDetailsState, cardId: number): CardDetailsState => {
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
      const imageId = state.cardsInStack[currentCardIndex].regionImageId;
      this.updateCurrentImage(imageId);
      return {
        ...state,
        nextCard: nextCard,
        previousCard: previousCard,
        currentCard: state.cardsInStack[currentCardIndex],
      };
    },
  );

  constructor(
    private cardService: CardService,
    private imageService: ImageService,
  ) {
    super({ status: status.loading });
  }
}

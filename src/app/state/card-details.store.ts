import { Injectable } from "@angular/core";
import { ComponentStore } from "@ngrx/component-store";
import { Observable, combineLatest, from, map, of, switchMap, tap } from "rxjs";
import { CardDB } from "../model/card";
import { CardService } from "../services/card.service";

export enum status {
  loaded,
  loading,
}

export type CardDetailsState =
  | {
      status: status.loaded;
      currentStackId: number;
      previousCard?: CardDB;
      currentCard: CardDB;
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
    currentCardIndex: number
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
      return null;
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

  readonly loadStackOfCards = this.effect((cardId$: Observable<number>) =>
    combineLatest([
      cardId$.pipe(
        switchMap((cardId) => {
          console.log(cardId);
          return this.cardService.readCard(cardId);
        })
      ),
      this.currentStackId$,
    ]).pipe(
      switchMap(([card, currentStackId]) => {
        if (currentStackId && currentStackId === card.stack_id) {
          this.updateCurrentCard(card.id!);
          return of();
        }
        if (currentStackId === 0) {
          return of(
            this.setAllCards({
              status: status.loaded,
              previousCard: undefined,
              nextCard: undefined,
              currentStackId: 0,
              currentCardIndex: 0,
              currentCard: card,
              cardsInStack: [card],
            })
          );
        }
        return from(this.cardService.getAllCardsForStack(card.stack_id)).pipe(
          tap({
            next: (allCardsInStack) => {
              let currentCardIndex: number = allCardsInStack.findIndex(
                (x) => x.id === card.id
              );

              let { previousCard, nextCard } =
                this.calculateNextAndPreviousCard(
                  allCardsInStack,
                  currentCardIndex
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
          })
        );
      })
    )
  );

  readonly updateCurrentCard = this.updater((state, cardId: number) => {
    if (state.status === status.loading) {
      return state;
    }
    let currentCardIndex: number = state.cardsInStack.findIndex(
      (x) => x.id === cardId
    );
    let { nextCard, previousCard } = this.calculateNextAndPreviousCard(
      state.cardsInStack,
      currentCardIndex
    );
    return {
      ...state,
      nextCard: nextCard,
      previousCard: previousCard,
      currentCard: state.cardsInStack[currentCardIndex],
    };
  });

  constructor(
    private cardService: CardService,
    private readonly componentStore: ComponentStore<CardDetailsState>
  ) {
    super({ status: status.loading });
  }
}
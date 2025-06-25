import { computed, inject, resource } from "@angular/core";
import { Card } from "@app/model/card";
import { Stack } from "@app/model/stack";
import {
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withProps,
  withState,
} from "@ngrx/signals";
import { CardService } from "@service/card.service";
import { ImageService } from "@service/image.service";

type CardDetailsState = {
  isLoading: boolean;
  index: number;
  imageId: number | undefined;
  stack: Stack | undefined;
  cards: Card[];
};

const initialState: CardDetailsState = {
  isLoading: false,
  index: 0,
  stack: undefined,
  imageId: undefined,
  cards: [],
};

const saveGet = <T>(array: T[], index: number): T | undefined =>
  index < array.length && index >= 0 ? array[index] : undefined;

export const CardDetailsSignalStore = signalStore(
  withState<CardDetailsState>(initialState),
  withProps(() => ({
    imageService: inject(ImageService),
    cardService: inject(CardService),
  })),
  withProps((store) => ({
    _imageResource: resource({
      request: () => store.imageId(),
      loader: ({ request }) =>
        request
          ? store.imageService.readImage(request)
          : Promise.resolve(undefined),
    }),
  })),
  withComputed((store) => ({
    cardsLength: computed(() => store.cards().length),
    currentCard: computed(() => store.cards()[store.index()]),
    nextCard: computed(() => saveGet(store.cards(), store.index() + 1)),
    previousCard: computed(() => saveGet(store.cards(), store.index() - 1)),
    image: computed(
      () => store._imageResource.hasValue() ?? store._imageResource.value(),
    ),
  })),
  withMethods((store) => ({
    setStack: async (stackId: number, cardId?: number) => {
      const { stack, cards } =
        await store.cardService.getAllCardsForStack(stackId);
      patchState(store, (_) => ({
        isLoading: false,
        index: cardId ? cards.findIndex((card) => card.id === cardId) : 0,
        imageId: cards[0].regionImageId,
        stack,
        cards,
      }));
    },
  })),
  withMethods((store) => ({
    setCard: async (cardId: number) => {
      const card = await store.cardService.readCard(cardId);
      if (card.stackId) store.setStack(card.stackId, cardId);
    },
    addCard: async (card: Card) => {
      store.cardService.createCard(card);
      const stackId = store.stack()?.id;
      if (stackId) store.setStack(stackId);
    },
  })),
);

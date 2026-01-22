import { TestBed } from "@angular/core/testing";
import { CardDetailsSignalStore } from "./card-details-signal.store";
import { CardService } from "@service/card.service";
import { ImageService } from "@service/image.service";
import { Card } from "@app/model/card";
import { Stack } from "@app/model/stack";

const mockStack: Stack = {
  id: 1,
  name: "Test Stack",
  imageName: "test-image.jpg",
};

const mockCards: Card[] = [
  {
    id: 1,
    title: "Card 1",
    description: "Description 1",
    latitude: 0,
    longitude: 0,
    iconName: "iconMiscBlack",
    radius: 10,
    regionImageId: 101,
  },
  {
    id: 2,
    title: "Card 2",
    description: "Description 2",
    latitude: 0,
    longitude: 0,
    iconName: "iconMiscBlack",
    radius: 10,
    regionImageId: 102,
  },
  {
    id: 3,
    title: "Card 3",
    description: "Description 3",
    latitude: 0,
    longitude: 0,
    iconName: "iconMiscBlack",
    radius: 10,
    regionImageId: 103,
  },
];

describe("CardDetailsSignalStore", () => {
  let store: InstanceType<typeof CardDetailsSignalStore>;
  let cardService: jest.Mocked<CardService>;

  beforeEach(() => {
    const cardServiceMock = {
      getAllCardsForStack: jest.fn(),
      readCard: jest.fn(),
      createCard: jest.fn(),
    } as unknown as jest.Mocked<CardService>;

    const imageServiceMock = {
      readImage: jest.fn(),
    } as unknown as jest.Mocked<ImageService>;

    TestBed.configureTestingModule({
      providers: [
        CardDetailsSignalStore,
        { provide: CardService, useValue: cardServiceMock },
        { provide: ImageService, useValue: imageServiceMock },
      ],
    });

    store = TestBed.inject(CardDetailsSignalStore);
    cardService = TestBed.inject(CardService) as jest.Mocked<CardService>;
  });

  const givenStackHasCards = (cards: Card[]) => {
    cardService.getAllCardsForStack.mockResolvedValue({
      stack: mockStack,
      cards,
    });
  };

  const givenStackIsEmpty = () => {
    givenStackHasCards([]);
  };

  const whenSetStackIsCalled = async (stackId: number, cardId?: number) => {
    await store.setStack(stackId, cardId);
  };

  const thenIndexShouldBe = (expectedIndex: number | undefined) => {
    expect(store.index()).toBe(expectedIndex);
  };

  const thenCurrentCardShouldBe = (expectedCard: Card | undefined) => {
    expect(store.currentCard()).toEqual(expectedCard);
  };

  const thenCurrentCardShouldBeUndefined = () => {
    thenCurrentCardShouldBe(undefined);
  };

  const thenImageIdShouldBe = (expectedImageId: number | undefined) => {
    expect(store.imageId()).toBe(expectedImageId);
  };

  const thenCardsShouldBe = (expectedCards: Card[]) => {
    expect(store.cards()).toEqual(expectedCards);
  };

  const thenStackShouldBe = (expectedStack: Stack) => {
    expect(store.stack()).toEqual(expectedStack);
  };

  const thenPreviousCardShouldBe = (expectedCard: Card | undefined) => {
    expect(store.previousCard()).toEqual(expectedCard);
  };

  const thenNextCardShouldBe = (expectedCard: Card | undefined) => {
    expect(store.nextCard()).toEqual(expectedCard);
  };

  describe("setStack", () => {
    it("should set index to undefined when stack is empty", async () => {
      givenStackIsEmpty();

      await whenSetStackIsCalled(1);

      thenIndexShouldBe(undefined);
      thenCurrentCardShouldBeUndefined();
      thenCardsShouldBe([]);
      thenStackShouldBe(mockStack);
    });

    it("should set index to 0 and select first card when stack has cards and no cardId is provided", async () => {
      givenStackHasCards(mockCards);

      await whenSetStackIsCalled(1);

      thenIndexShouldBe(0);
      thenCurrentCardShouldBe(mockCards[0]);
      thenImageIdShouldBe(101);
      thenCardsShouldBe(mockCards);
      thenStackShouldBe(mockStack);
    });

    it("should set index to the specified card when cardId is provided", async () => {
      givenStackHasCards(mockCards);

      await whenSetStackIsCalled(1, 2);

      thenIndexShouldBe(1);
      thenCurrentCardShouldBe(mockCards[1]);
      thenImageIdShouldBe(102);
      thenCardsShouldBe(mockCards);
      thenStackShouldBe(mockStack);
    });

    it("should set index to -1 when cardId is provided but not found", async () => {
      givenStackHasCards(mockCards);

      await whenSetStackIsCalled(1, 999);

      thenIndexShouldBe(-1);
      thenCurrentCardShouldBeUndefined();
      thenCardsShouldBe(mockCards);
      thenStackShouldBe(mockStack);
    });

    it("should correctly set imageId for first card (index 0)", async () => {
      givenStackHasCards(mockCards);

      await whenSetStackIsCalled(1);

      thenIndexShouldBe(0);
      thenImageIdShouldBe(101);
      expect(store.currentCard()?.regionImageId).toBe(101);
    });

    it("should set undefined imageId when card has no regionImageId", async () => {
      const cardsWithoutImage = [
        {
          ...mockCards[0],
          regionImageId: undefined,
        },
      ];
      givenStackHasCards(cardsWithoutImage);

      await whenSetStackIsCalled(1);

      thenIndexShouldBe(0);
      thenImageIdShouldBe(undefined);
    });
  });

  describe("navigation", () => {
    it("should compute previousCard correctly for middle card", async () => {
      givenStackHasCards(mockCards);

      await whenSetStackIsCalled(1, 2);

      thenCurrentCardShouldBe(mockCards[1]);
      thenPreviousCardShouldBe(mockCards[0]);
      thenNextCardShouldBe(mockCards[2]);
    });

    it("should have no previousCard for first card", async () => {
      givenStackHasCards(mockCards);

      await whenSetStackIsCalled(1, 1);

      thenCurrentCardShouldBe(mockCards[0]);
      thenPreviousCardShouldBe(undefined);
      thenNextCardShouldBe(mockCards[1]);
    });

    it("should have no nextCard for last card", async () => {
      givenStackHasCards(mockCards);

      await whenSetStackIsCalled(1, 3);

      thenCurrentCardShouldBe(mockCards[2]);
      thenPreviousCardShouldBe(mockCards[1]);
      thenNextCardShouldBe(undefined);
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
});

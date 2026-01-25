import { CardDetailsComponent } from "@app/components/cards/card-details/card-details.component";
import { Component, CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { ActivatedRoute, convertToParamMap, ParamMap } from "@angular/router";
import { BehaviorSubject } from "rxjs";
import { InfoCard, LocationCard, LocationData } from "@app/model/card";
import { emit } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import { StackService } from "@service/stack.service";
import { Stack } from "@app/model/stack";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/angular";
import "@testing-library/jest-dom";
import { MarkerService } from "@service/marker.service";
import { CardContentService } from "@service/card-content.service";
import { CardService } from "@service/card.service";
import { ImageService } from "@service/image.service";
import { MatDialog, MatDialogModule } from "@angular/material/dialog";
import { AddCardDialogComponent } from "../card-input/add-card-dialog.component";
import { EditCardDialogComponent } from "../card-input/edit-card-dialog.component";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { CardInputComponent } from "@app/components/cards/card-input/card-input.component";
import { StackStore } from "@app/state/stack.store";
import { ComponentFixture } from "@angular/core/testing";

@Component({
  selector: "app-editor",
  template: "<div>Mock Editor</div>",
})
class MockEditorComponent {
  getContents() {
    return "Mock content";
  }
}

jest.mock("quill-image-resize-module", () => {
  return jest.fn();
});

jest.mock("@tauri-apps/api/window", () => ({
  getCurrentWindow: () => ({
    setFocus: jest.fn(),
    onCloseRequested: jest.fn(),
    label: "test-window",
  }),
}));

jest.mock("@tauri-apps/api/core", () => ({
  invoke: jest.fn().mockResolvedValue(null),
  convertFileSrc: jest.fn((src: string) => src),
}));

const mockListeners = new Map<string, Function>();

jest.mock("@tauri-apps/api/event", () => ({
  emit: jest.fn(),
  listen: jest.fn((eventName: string, callback: Function) => {
    mockListeners.set(eventName, callback);
    return Promise.resolve();
  }),
}));

jest.mock("@tauri-apps/api/webviewWindow", () => ({
  WebviewWindow: (_x: string, _y: unknown) => {
    jest.fn();
  },
}));

const defaultCard: LocationCard = {
  description: "A simple test card",
  id: 1,
  iconName: "iconBorderLimesRed",
  radius: 0,
  latitude: 0,
  longitude: 0,
  title: "A simple title",
};
const testStack: LocationCard[] = [
  {
    description: "",
    id: 2,
    stackId: 1,
    radius: 0,
    latitude: 0,
    longitude: 0,
    iconName: "iconBorderLimesRed",
    title: "A. First card.",
  },
  {
    description: "",
    id: 3,
    stackId: 1,
    radius: 0,
    latitude: 0,
    longitude: 0,
    iconName: "iconBorderLimesRed",
    title: "B. Last card.",
  },
];

const defaultStack: Stack = {
  id: 1,
  imageName: "some flag",
  name: "My testing Stack",
};

async function waitComponentRender(fixture: ComponentFixture<unknown>) {
  await new Promise((resolve) => setTimeout(resolve, 1));
  fixture.detectChanges();
  await fixture.whenStable();
}

const markerServiceMock = {
  getBounds: jest.fn(),
};
const cardContentServiceMock = {
  setCardId: jest.fn(),
  cardId: {
    next: {
      value: undefined,
    },
  },
  cardContent: jest.fn(),
  saveCardContent: jest.fn(),
};
const stackServiceMock = {
  getStackById: jest.fn(),
  getAll: jest.fn().mockResolvedValue([]),
};

const cardServiceMock = {
  readCard: jest.fn(),
  getAllCardsForStack: jest.fn(),
  createCard: jest.fn(),
  updateCard: jest.fn(),
};

const imageServiceMock = {
  readImage: jest.fn(),
  getImageUrl: jest.fn(),
};

const paramMapSubject = new BehaviorSubject<ParamMap>(
  convertToParamMap({ cardId: "1" }),
);

const renderComponent = async (route = "cards/details/1") => {
  const cardIdMatch = route.match(/\/(\d+)(?:\?|$)/);
  const cardId = cardIdMatch ? cardIdMatch[1] : "1";

  const stackIdMatch = route.match(/stackId=(\d+)/);
  const stackId = stackIdMatch ? stackIdMatch[1] : undefined;

  const params = {
    cardId,
    ...(stackId ? { stackId } : {}),
  };

  paramMapSubject.next(convertToParamMap(params));

  const activatedRouteMock = {
    paramMap: paramMapSubject.asObservable(),
  };

  const component = await render(CardDetailsComponent, {
    imports: [MatDialogModule, NoopAnimationsModule],
    providers: [
      { provide: ActivatedRoute, useValue: activatedRouteMock },
      { provide: MarkerService, useValue: markerServiceMock },
      { provide: StackService, useValue: stackServiceMock },
      { provide: CardContentService, useValue: cardContentServiceMock },
      { provide: ImageService, useValue: imageServiceMock },
      { provide: CardService, useValue: cardServiceMock },
      StackStore,
      MatDialog,
    ],
    declarations: [
      MockEditorComponent,
      AddCardDialogComponent,
      EditCardDialogComponent,
      CardInputComponent,
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    excludeComponentDeclaration: false,
    autoDetectChanges: true,
  });
  await waitComponentRender(component.fixture);
  return component;
};

const givenAStackWithCards = (cards: LocationCard[], stack = defaultStack) => {
  cardServiceMock.getAllCardsForStack.mockResolvedValue({ stack, cards });
};

const givenACard = (card: Partial<LocationCard>) => {
  cardServiceMock.readCard.mockResolvedValue({
    ...card,
  });
};

beforeEach(() => {
  (invoke as jest.Mock).mockClear();
  (invoke as jest.Mock).mockResolvedValue(null);
});

it("should create", async () => {
  givenACard(defaultCard);
  const { fixture } = await renderComponent();
  expect(fixture.componentInstance).toBeTruthy();
});

it("should display no side-nav if given card has no stackId", async () => {
  givenACard(defaultCard);
  await renderComponent();

  const cardTitle = screen.getByTestId("card-title");
  expect(cardTitle).toHaveTextContent(defaultCard.title);

  const sideNav = screen.queryByTestId("stack-side-nav");
  expect(sideNav).not.toBeInTheDocument();
});

it("should display a side-nav and highlight the current card when the card is in a stack", async () => {
  givenAStackWithCards(testStack);
  givenACard(testStack[0]);
  await renderComponent("cards/details/2");

  const sideNav = screen.getByTestId("stack-side-nav");
  expect(sideNav).toBeInTheDocument();

  const currentCard = screen.getByTestId("stack-side-nav-card-2");
  expect(currentCard).toHaveClass("current-card");

  const otherCard = screen.getByTestId("stack-side-nav-card-3");
  expect(otherCard).not.toHaveClass("current-card");
});

it("should navigate to next card in stack", async () => {
  givenAStackWithCards(testStack);
  givenACard(testStack[0]);
  await renderComponent("cards/details/2?stackId=1");

  const nextButton = screen.getByTestId("next-card-button");
  expect(nextButton).toBeInTheDocument();

  const prevButton = screen.queryByTestId("previous-card-button");
  expect(prevButton).not.toBeInTheDocument();
});

it("should display the current stack's name", async () => {
  givenAStackWithCards(testStack, defaultStack);
  givenACard(testStack[0]);
  await renderComponent("cards/details/2?stackId=1");

  const stackTitle = screen.getByTestId("stack-title");
  expect(stackTitle).toHaveTextContent(defaultStack.name);
});

it("should be able to navigate to the previous card", async () => {
  givenAStackWithCards(testStack);
  givenACard(testStack[1]);
  await renderComponent("cards/details/3?stackId=1");

  const nextButton = screen.queryByTestId("next-card-button");
  expect(nextButton).not.toBeInTheDocument();

  const prevButton = screen.getByTestId("previous-card-button");
  expect(prevButton).toBeInTheDocument();
});

it("should pan to a single marker of a card", async () => {
  const givenMarker: LocationData = {
    iconName: "iconBorderLimesRed",
    radius: 0,
    latitude: 0,
    longitude: 0,
  };
  givenACard({
    ...defaultCard,
    ...givenMarker,
  });
  const { fixture } = await renderComponent("cards/details/1");

  fixture.detectChanges();
  await fixture.whenStable();

  fireEvent.click(screen.getByTestId("show-on-map-button"));

  expect(emit).toHaveBeenCalledWith("panTo", {
    lat: givenMarker.latitude,
    lng: givenMarker.longitude,
    id: 1,
  });
});

it("should display a pin_drop icon for cards with valid location data", async () => {
  const givenMarker: LocationData = {
    iconName: "iconBorderLimesRed",
    radius: 0,
    latitude: 10,
    longitude: 20,
  };
  givenACard({
    ...defaultCard,
    ...givenMarker,
  });
  await renderComponent("cards/details/1");

  const button = screen.getByTestId("show-on-map-button");
  expect(button).toBeInTheDocument();

  const icon = within(button).getByTestId("location-icon");
  expect(icon).toHaveTextContent("pin_drop");
});

it("should display an edit icon for cards without valid location data", async () => {
  givenACard({
    ...defaultCard,
    latitude: undefined,
    longitude: undefined,
  });
  await renderComponent("cards/details/1");

  const button = screen.getByTestId("show-on-map-button");
  expect(button).toBeInTheDocument();

  const icon = within(button).getByTestId("location-icon");
  expect(icon).toHaveTextContent("edit");
});

it("should open edit dialog when edit icon is clicked", async () => {
  const card = {
    ...defaultCard,
    id: 1,
    latitude: undefined,
    longitude: undefined,
  };
  givenACard(card);
  await renderComponent("cards/details/1");

  const button = screen.getByTestId("show-on-map-button");
  fireEvent.click(button);

  const dialog = await screen.findByRole("dialog");
  expect(dialog).toBeInTheDocument();

  const dialogTitle = within(dialog).getByText("Karte bearbeiten");
  expect(dialogTitle).toBeInTheDocument();
});

it("should create a new card when add card button is clicked", async () => {
  const stackId = 1;
  const newCardId = 999;

  givenAStackWithCards(testStack, defaultStack);
  givenACard(testStack[0]);

  const newCard: InfoCard = {
    id: newCardId,
    title: "New Test Card",
    description: "This is a new test card",
    stackId: stackId,
  };
  cardServiceMock.createCard.mockResolvedValue(newCard);

  await renderComponent(`cards/details/2?stackId=${stackId}`);

  const addCardButton = screen.getByTestId("add-card-button");
  expect(addCardButton).toBeInTheDocument();

  fireEvent.click(addCardButton);

  const dialog = await screen.findByRole("dialog");
  expect(dialog).toBeInTheDocument();

  const titleInput = within(dialog).getByLabelText("Title:");
  fireEvent.input(titleInput, { target: { value: newCard.title } });

  const descriptionInput = within(dialog).getByLabelText("Beschreibung:");
  fireEvent.input(descriptionInput, {
    target: { value: newCard.description },
  });

  const createButton = within(dialog).getByText("Erstellen");
  fireEvent.click(createButton);

  await waitFor(() => {
    expect(cardServiceMock.createCard).toHaveBeenCalledWith(
      expect.objectContaining({
        title: newCard.title,
        description: newCard.description,
        stackId: newCard.stackId,
      }),
    );
  });

  await waitFor(() => {
    expect(cardServiceMock.getAllCardsForStack).toHaveBeenCalledWith(stackId);
  });
});

describe("edit card dialog stack handling", () => {
  const createInfoCard = (stackId: number, id = 2): InfoCard => ({
    id,
    title: "Info card without location",
    description: "A card that can be edited",
    stackId,
  });

  const givenCardInStack = (card: InfoCard) => {
    const stackWithCard = [card, testStack[1]];
    givenAStackWithCards(stackWithCard as LocationCard[], defaultStack);
    givenACard(card);
    cardServiceMock.updateCard.mockResolvedValue(undefined);
  };

  const whenEditDialogClosesWithCard = async (
    component: CardDetailsComponent,
    originalCard: InfoCard,
    resultCard: InfoCard,
  ) => {
    cardServiceMock.getAllCardsForStack.mockClear();
    component.openEditCardDialog(originalCard);
    const dialogRef = (component.dialog as MatDialog).openDialogs[0];
    dialogRef.close(resultCard);

    await waitFor(() => {
      expect(cardServiceMock.updateCard).toHaveBeenCalledWith(resultCard);
    });

    const cardChangedListener = mockListeners.get("card-changed");
    if (cardChangedListener) {
      await cardChangedListener({ payload: resultCard });
    }
  };

  const thenStackShouldBeRefreshed = async (expectedStackId: number) => {
    await waitFor(() => {
      const calls = cardServiceMock.getAllCardsForStack.mock.calls;
      expect(calls.length).toBeGreaterThan(0);
      expect(calls[calls.length - 1][0]).toBe(expectedStackId);
    });
  };

  const thenCurrentCardShouldBe = async (
    component: CardDetailsComponent,
    expectedCardId: number,
  ) => {
    await waitFor(() => {
      expect(component.store.currentCard()?.id).toBe(expectedCardId);
    });
  };

  it("should refresh current stack without selecting moved card when card is moved to different stack", async () => {
    const originalStackId = 1;
    const targetStackId = 2;
    const originalCard = createInfoCard(originalStackId);
    const movedCard: InfoCard = { ...originalCard, stackId: targetStackId };

    givenCardInStack(originalCard);

    const { fixture } = await renderComponent(
      `cards/details/2?stackId=${originalStackId}`,
    );

    await whenEditDialogClosesWithCard(
      fixture.componentInstance,
      originalCard,
      movedCard,
    );

    await thenStackShouldBeRefreshed(originalStackId);
  });

  it("should select updated card when card stays in same stack after edit", async () => {
    const stackId = 1;
    const originalCard = createInfoCard(stackId);
    const updatedCard: InfoCard = { ...originalCard, title: "Updated title" };

    givenCardInStack(originalCard);

    const { fixture } = await renderComponent(
      `cards/details/2?stackId=${stackId}`,
    );

    await whenEditDialogClosesWithCard(
      fixture.componentInstance,
      originalCard,
      updatedCard,
    );

    await thenStackShouldBeRefreshed(stackId);
    await thenCurrentCardShouldBe(fixture.componentInstance, updatedCard.id!);
  });
});

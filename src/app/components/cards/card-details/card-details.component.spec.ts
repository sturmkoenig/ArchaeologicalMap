import { CardDetailsComponent } from "@app/components/cards/card-details/card-details.component";
import { Component, CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { ActivatedRoute, convertToParamMap, ParamMap } from "@angular/router";
import { BehaviorSubject } from "rxjs";
import { LocationCard, LocationData } from "@app/model/card";
import { emit } from "@tauri-apps/api/event";
import { StackService } from "@service/stack.service";
import { Stack } from "@app/model/stack";
import { fireEvent, render, screen } from "@testing-library/angular";
import "@testing-library/jest-dom";
import { MarkerService } from "@service/marker.service";
import { CardContentService } from "@service/card-content.service";
import { CardService } from "@service/card.service";
import { ImageService } from "@service/image.service";

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
  // Provide any mock implementation if necessary
  return jest.fn();
});

jest.mock("@tauri-apps/api/window", () => ({
  getCurrentWindow: () => ({
    setFocus: jest.fn(),
    onCloseRequested: jest.fn(),
  }),
}));
jest.mock("@tauri-apps/api/event", () => ({
  emit: jest.fn(),
  listen: jest.fn(),
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
  image_name: "some flag",
  name: "My testing Stack",
};

describe("CardDetailsComponent", () => {
  const markerServiceMock = {
    getBounds: jest.fn(),
  };
  const cardContentServiceMock = {
    setCardId: jest.fn(),
    cardContent: jest.fn(),
    saveCardContent: jest.fn(),
  };
  const stackServiceMock = {
    getStackById: jest.fn(),
  };

  const cardServiceMock = {
    readCard: jest.fn(),
    getAllCardsForStack: jest.fn(),
  };

  const imageServiceMock = {
    readImage: jest.fn(),
  };

  const paramMapSubject = new BehaviorSubject<ParamMap>(
    convertToParamMap({ cardId: "1" }),
  );

  const renderComponent = async (route = "cards/details/1") => {
    const cardIdMatch = route.match(/\/(\d+)(?:\?|$)/);
    const cardId = cardIdMatch ? cardIdMatch[1] : "1";

    const stackIdMatch = route.match(/stackId=(\d+)/);
    const stackId = stackIdMatch ? stackIdMatch[1] : undefined;

    const params: any = { cardId };
    if (stackId) {
      params.stackId = stackId;
    }
    paramMapSubject.next(convertToParamMap(params));

    const activatedRouteMock = {
      paramMap: paramMapSubject.asObservable(),
    };

    const result = await render(CardDetailsComponent, {
      providers: [
        { provide: ActivatedRoute, useValue: activatedRouteMock },
        { provide: MarkerService, useValue: markerServiceMock },
        { provide: StackService, useValue: stackServiceMock },
        { provide: CardContentService, useValue: cardContentServiceMock },
        { provide: ImageService, useValue: imageServiceMock },
        { provide: CardService, useValue: cardServiceMock },
      ],
      declarations: [MockEditorComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      excludeComponentDeclaration: false,
      autoDetectChanges: true,
    });

    return result;
  };

  it("should create", async () => {
    await givenACard(defaultCard);
    const { fixture } = await renderComponent();
    expect(fixture.componentInstance).toBeTruthy();
  });

  const givenACard = async (card: Partial<LocationCard>) => {
    cardServiceMock.readCard.mockResolvedValue({
      ...card,
    });
  };

  it("should display no side-nav if given card has no stackId", async () => {
    await givenACard(defaultCard);
    const { fixture } = await renderComponent();
    fixture.detectChanges();

    const cardTitle = getElementByTestId("card-title");
    expect(cardTitle).toHaveTextContent(defaultCard.title);

    const sideNav = queryElementByTestId("stack-side-nav");
    expect(sideNav).not.toBeInTheDocument();
  });

  it("should display a side-nav and highlight the current card when the card is in a stack", async () => {
    givenAStackWithCards(testStack);
    await givenACard(testStack[0]);
    const { fixture } = await renderComponent("cards/details/2");

    await new Promise((resolve) => setTimeout(resolve, 1));
    fixture.detectChanges();
    await fixture.whenStable();

    const sideNav = getElementByTestId("stack-side-nav");
    expect(sideNav).toBeInTheDocument();

    const currentCard = getElementByTestId("stack-side-nav-card-2");
    expect(currentCard).toHaveClass("current-card");

    const otherCard = getElementByTestId("stack-side-nav-card-3");
    expect(otherCard).not.toHaveClass("current-card");
  });

  it("should navigate to next card in stack", async () => {
    givenAStackWithCards(testStack);
    await givenACard(testStack[0]);
    const { fixture } = await renderComponent("cards/details/2?stackId=1");

    await new Promise((resolve) => setTimeout(resolve, 1));
    fixture.detectChanges();
    await fixture.whenStable();

    const nextButton = getElementByTestId("next-card-button");
    expect(nextButton).toBeInTheDocument();

    const prevButton = queryElementByTestId("previous-card-button");
    expect(prevButton).not.toBeInTheDocument();
  });

  it("should display the current stack's name", async () => {
    givenAStackWithCards(testStack, defaultStack);
    await givenACard(testStack[0]);
    const { fixture } = await renderComponent("cards/details/2?stackId=1");

    await new Promise((resolve) => setTimeout(resolve, 1));
    fixture.detectChanges();
    await fixture.whenStable();

    const stackTitle = getElementByTestId("stack-title");
    expect(stackTitle).toHaveTextContent(defaultStack.name);
  });

  it("should be able to navigate to the previous card", async () => {
    givenAStackWithCards(testStack);
    await givenACard(testStack[1]);
    const { fixture } = await renderComponent("cards/details/3?stackId=1");

    await new Promise((resolve) => setTimeout(resolve, 1));
    fixture.detectChanges();
    await fixture.whenStable();

    const nextButton = queryElementByTestId("next-card-button");
    expect(nextButton).not.toBeInTheDocument();

    const prevButton = getElementByTestId("previous-card-button");
    expect(prevButton).toBeInTheDocument();
  });

  it("should pan to a single marker of a card", async () => {
    const givenMarker: LocationData = {
      iconName: "iconBorderLimesRed",
      radius: 0,
      latitude: 0,
      longitude: 0,
    };
    await givenACard({
      ...defaultCard,
      ...givenMarker,
    });
    const { fixture } = await renderComponent("cards/details/1");

    fixture.detectChanges();
    await fixture.whenStable();

    await whenIClickAButton("show-on-map-button");

    expect(emit).toHaveBeenCalledWith("panTo", {
      lat: givenMarker.latitude,
      lng: givenMarker.longitude,
      id: 1,
    });
  });

  const getElementByTestId = (testId: string) => {
    return screen.getByTestId(testId);
  };

  const queryElementByTestId = (testId: string) => {
    return screen.queryByTestId(testId);
  };

  const givenAStackWithCards = (
    cards: LocationCard[],
    stack = defaultStack,
  ) => {
    cardServiceMock.getAllCardsForStack.mockResolvedValue({ stack, cards });
  };

  const whenIClickAButton = async (testId: string) => {
    fireEvent.click(screen.getByTestId(testId));
  };
});

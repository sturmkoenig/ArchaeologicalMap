import { CardDetailsComponent } from "@app/components/cards/card-details/card-details.component";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MarkerService } from "@service/marker.service";
import { CardContentService } from "@service/card-content.service";
import { CardDetailsStore } from "@app/state/card-details.store";
import { CardService } from "@service/card.service";
import { ImageService } from "@service/image.service";
import { CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { provideRouter, RouterModule } from "@angular/router";
import { BehaviorSubject } from "rxjs";
import { CardDB } from "@app/model/card";
import { By } from "@angular/platform-browser";
import { listen } from "@tauri-apps/api/event";
import { RouterTestingHarness } from "@angular/router/testing";
import { StackService } from "@service/stack.service";
import { Stack } from "@app/model/stack";

jest.mock("quill-image-resize-module", () => {
  // Provide any mock implementation if necessary
  return jest.fn();
});

jest.mock("@tauri-apps/api/window", () => ({
  getCurrentWindow: () => ({
    setFocus: jest.fn(),
  }),
}));

jest.mock("@tauri-apps/api/webviewWindow", () => ({
  WebviewWindow: (_x: string, _y: unknown) => {
    jest.fn();
  },
}));

const defaultCard: CardDB = {
  description: "A simple test card",
  id: 1,
  markers: [],
  stack_id: null,
  title: "A simple title",
};
const testStack = {
  firstCard: {
    description: "",
    id: 2,
    stack_id: 1,
    markers: [],
    title: "A. First card.",
  },
  secondCard: {
    description: "",
    id: 3,
    stack_id: 1,
    markers: [],
    title: "B. Last card.",
  },
};

const defaultStack: Stack = {
  id: 0,
  image_name: "some flag",
  name: "My testing Stack",
};

describe("CardDetailsComponent", () => {
  let fixture: ComponentFixture<CardDetailsComponent>;
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
  const listenMock = listen as jest.Mock;
  const queryParamsSubject: BehaviorSubject<{ id: number }> =
    new BehaviorSubject({ id: 1 });

  beforeAll(async () => {});

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CardDetailsComponent],
      imports: [RouterModule],
      providers: [
        provideRouter([
          { path: "cards/details/:id", component: CardDetailsComponent },
        ]),
        { provide: MarkerService, useValue: markerServiceMock },
        { provide: StackService, useValue: stackServiceMock },
        { provide: CardContentService, useValue: cardContentServiceMock },
        { provide: ImageService, useValue: imageServiceMock },
        { provide: CardService, useValue: cardServiceMock },

        CardDetailsStore,
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();
  });

  it("should create", async () => {
    givenACard(defaultCard);
    const harness = await RouterTestingHarness.create("/cards/details/1");
    const component = await harness.navigateByUrl(
      "cards/details/1",
      CardDetailsComponent,
    );
    expect(component).toBeTruthy();
  });

  const givenACard = async (card: Partial<CardDB>) => {
    cardServiceMock.readCard.mockResolvedValue({
      ...card,
    });
    queryParamsSubject.next({ id: card.id ?? 1 });
  };

  it("should display a card without stack without side-nav", async () => {
    await givenACard(defaultCard);
    const harness = await RouterTestingHarness.create("/cards/details/1");
    harness.detectChanges();
    const cardTitle = getElementByDataTestId("card-title", harness);
    expect(cardTitle.nativeElement.textContent).toContain(defaultCard.title);
    const sideNav = getElementByDataTestId("stack-side-nav", harness);
    expect(sideNav).toBeFalsy();
  });

  const givenARegionImageWithId = (regionImageId: number) => {
    imageServiceMock.readImage.mockResolvedValue(
      "<svg data-testid='myTestImage'></svg>",
    );
  };

  // it("should show card image for a card", async () => {
  //   const regionImageId = 1;
  //   givenARegionImageWithId(regionImageId);
  //   await givenACard({ ...defaultCard, region_image_id: regionImageId });
  //   const harness = await RouterTestingHarness.create("/cards/details/1");
  //   harness.detectChanges();
  //   expect(getElementByDataTestId("myTestImage", harness)).toBeTruthy();
  // });

  it("should display a side-nav and highlight the current card when the card is in a stack", async () => {
    givenAStackWithCards([testStack.firstCard, testStack.secondCard]);
    await givenACard(testStack.firstCard);
    const harness = await RouterTestingHarness.create("/cards/details/2");
    harness.detectChanges();
    expect(getElementByDataTestId("stack-side-nav", harness)).toBeTruthy();
    expect(
      getElementByDataTestId(
        "stack-side-nav-card-2",
        harness,
      ).nativeElement.classList.contains("current-card"),
    ).toBeTruthy();
    expect(
      getElementByDataTestId(
        "stack-side-nav-card-3",
        harness,
      ).nativeElement.classList.contains("current-card"),
    ).toBeFalsy();
  });

  it("should navigate to next card in stack", async () => {
    givenAStackWithCards([testStack.firstCard, testStack.secondCard]);
    await givenACard(testStack.firstCard);
    const harness = await RouterTestingHarness.create("/cards/details/2");
    harness.detectChanges();
    expect(getElementByDataTestId("next-card-button", harness)).toBeTruthy();
    expect(getElementByDataTestId("previous-card-button", harness)).toBeFalsy();
  });

  it("should display the current stack's name", async () => {
    givenAStackWithCards(
      [testStack.firstCard, testStack.secondCard],
      defaultStack,
    );
    await givenACard(testStack.firstCard);
    const harness = await RouterTestingHarness.create("/cards/details/2");
    harness.detectChanges();
    expect(
      getElementByDataTestId("stack-title", harness).nativeElement.textContent,
    ).toBe(defaultStack.name);
  });

  it("should be able to navigate to the previous card", async () => {
    givenAStackWithCards([testStack.firstCard, testStack.secondCard]);
    await givenACard(testStack.secondCard);
    const harness = await RouterTestingHarness.create("/cards/details/3");
    harness.detectChanges();
    expect(getElementByDataTestId("next-card-button", harness)).toBeFalsy();
    expect(
      getElementByDataTestId("previous-card-button", harness),
    ).toBeTruthy();
  });

  const getElementByDataTestId = (
    dataTestId: string,
    harness: RouterTestingHarness,
  ) => {
    return harness.fixture.debugElement.query(
      By.css(`[data-testid="${dataTestId}"]`),
    );
  };

  const givenAStackWithCards = (cards: CardDB[], stack = defaultStack) => {
    cardServiceMock.getAllCardsForStack.mockResolvedValue({ stack, cards });
  };
  const whenIClickAButton = async (
    dataTestId: string,
    harness: RouterTestingHarness,
  ) => {
    getElementByDataTestId(dataTestId, harness).nativeElement.click();
    harness.detectChanges();
  };
});

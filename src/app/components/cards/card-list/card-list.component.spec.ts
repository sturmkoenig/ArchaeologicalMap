import { CardListComponent } from "./card-list.component";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { CardService } from "@service/card.service";
import { LocationCard } from "@app/model/card";
import { By } from "@angular/platform-browser";
import { CommonModule } from "@angular/common";
import { MatButtonModule } from "@angular/material/button";
import { MatTableModule } from "@angular/material/table";
import { MatIconModule } from "@angular/material/icon";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MatInputModule } from "@angular/material/input";
import { MatFormField, MatLabel } from "@angular/material/form-field";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { emit } from "@tauri-apps/api/event";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import { HarnessLoader } from "@angular/cdk/testing";
import { TestbedHarnessEnvironment } from "@angular/cdk/testing/testbed";
import { MatInputHarness } from "@angular/material/input/testing";
import { render, screen } from "@testing-library/angular";
import userEvent from "@testing-library/user-event";

let cardDeletedCallback: (event: { payload: number }) => void;

jest.mock("@tauri-apps/api/event", () => ({
  listen: jest.fn((eventName, callback) => {
    if (eventName === "card-deleted") {
      cardDeletedCallback = callback;
    }
    return Promise.resolve(() => jest.fn());
  }),
  emit: jest.fn(),
}));

jest.mock("@tauri-apps/api/webviewWindow", () => ({
  WebviewWindow: jest.fn().mockImplementation(() => ({ once: jest.fn() })),
}));
const testCards: LocationCard[] = [
  {
    id: 0,
    title: "Monument in Deutschland",
    description: "schöne Lage",
    latitude: 0,
    longitude: 0,
    iconName: "iconCaveBlack",
    radius: 0,
  },
  {
    id: 1,
    title: "Monument in Frankreich",
    description: "schöne Lage",
    latitude: 0,
    longitude: 0,
    iconName: "iconCaveBlack",
    radius: 0,
  },
  {
    id: 2,
    title: "Kirche in Frankreich",
    description: "schöne Lage",
    latitude: 0,
    longitude: 0,
    iconName: "iconCaveBlack",
    radius: 0,
  },
];
const setupRender = async () =>
  await render(CardListComponent, {
    inputs: { debounceTime: 0 },
    imports: [
      FormsModule,
      ReactiveFormsModule,
      CommonModule,
      MatInputModule,
      MatLabel,
      MatIconModule,
      MatButtonModule,
      MatTableModule,
      MatFormField,
      NoopAnimationsModule,
    ],
    providers: [
      {
        provide: CardService,
        useValue: {
          readCardByTitle: jest
            .fn()
            .mockImplementation((title) =>
              testCards.filter((card) => card.title.includes(title)),
            ),
          createCard: jest.fn(),
          updateCard: jest.fn(),
          readCard: jest.fn(),
          readCardsPaginated: jest.fn().mockResolvedValue([]),
          getNumberOfCards: jest.fn().mockResolvedValue(0),
          deleteCard: jest.fn(),
          deleteMarker: jest.fn(),
        },
      },
    ],
  });

it("should filter the cards by their title", async () => {
  await setupRender();
  const input = screen.getByLabelText(/Suche/i);
  await userEvent.type(input, "Monument");
  const cards = screen.getAllByTestId(/card-row/i);
  expect(cards.length).toBe(2);
});

it("should reset the filter when the clear filter button is pressed", async () => {
  const renderResult = await setupRender();
  const input = screen.getByLabelText(/Suche/i);
  await userEvent.type(input, "Monument");
  const clearSearchButton = screen.getByTestId("clear-input");
  await userEvent.click(clearSearchButton);
  renderResult.fixture.detectChanges();
  const cards = screen.getAllByTestId(/card-row/i);
  expect(cards.length).toBe(3);
});

it("Given cards with id 1, 2 and 3 When a delete event for card with id 2 is received Then the card is removed from the list", async () => {
  const renderResult = await setupRender();
  const input = screen.getByLabelText(/Suche/i);
  await userEvent.type(input, "in");
  cardDeletedCallback({ payload: 2 });
  renderResult.fixture.detectChanges();
  const cards = screen.getAllByTestId(/card-row/i);
  expect(cards.length).toBe(2);
});

describe("CardListComponent", () => {
  let component: CardListComponent;
  let fixture: ComponentFixture<CardListComponent>;
  let loader: HarnessLoader;
  let cardServiceMock: {
    createCard: jest.Mock;
    readCard: jest.Mock;
    readCardByTitle: jest.Mock;
    readCardsPaginated: jest.Mock;
    getNumberOfCards: jest.Mock;
    updateCard: jest.Mock;
    deleteCard: jest.Mock;
    deleteMarker: jest.Mock;
  };
  beforeAll(() => {});

  beforeEach(async () => {
    cardServiceMock = {
      readCardByTitle: jest
        .fn()
        .mockImplementation((title) =>
          testCards.filter((card) => card.title.includes(title)),
        ),
      createCard: jest.fn(),
      updateCard: jest.fn(),
      readCard: jest.fn(),
      readCardsPaginated: jest.fn().mockResolvedValue([]),
      getNumberOfCards: jest.fn().mockResolvedValue(0),
      deleteCard: jest.fn(),
      deleteMarker: jest.fn(),
    };
    await TestBed.configureTestingModule({
      imports: [
        FormsModule,
        ReactiveFormsModule,
        CommonModule,
        MatInputModule,
        MatLabel,
        MatIconModule,
        MatButtonModule,
        MatTableModule,
        MatFormField,
        NoopAnimationsModule,
      ],
      providers: [
        {
          provide: CardService,
          useValue: cardServiceMock,
        },
      ],
    }).compileComponents();
  });

  beforeEach(async () => {
    fixture = TestBed.createComponent(CardListComponent);
    component = fixture.componentInstance;
    loader = TestbedHarnessEnvironment.loader(fixture);
    component.debounceTime = 0;
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it("should create component", () => {
    expect(component).toBeTruthy();
  });

  it("should display cards matching search word", async () => {
    cardServiceMock.readCardByTitle.mockResolvedValue(testCards);
    await whenISearchForTitle("in");
    expect(cardServiceMock.readCardByTitle).toHaveBeenLastCalledWith("in");
    thenISeeCardsWithTitle(testCards.map((card) => card.title));
  });

  it("should pan to the card on the map when showOnMap button is clicked", async () => {
    const cardWithPosition: LocationCard = {
      id: 420,
      description: "The best boulders in town",
      iconName: "iconMiscRed",
      latitude: 48.404675,
      longitude: 2.70162,
      radius: 0,
      title: "Fontaine Bleau",
    };
    cardServiceMock.readCardByTitle.mockResolvedValue([cardWithPosition]);
    await whenISearchForTitle("Fontaine");
    thenISeeCardsWithTitle([cardWithPosition.title]);
    whenIClickTheButton(`nav-to-card-${cardWithPosition.id}`);
    expect(emit).toHaveBeenCalledWith("panTo", {
      id: cardWithPosition.id,
      lat: cardWithPosition.latitude,
      lng: cardWithPosition.longitude,
    });
  });
  it("should open a card's detail page when pressing the open details page button", async () => {
    cardServiceMock.readCardByTitle.mockResolvedValue([testCards[0]]);
    await whenISearchForTitle("Monument");
    thenISeeCardsWithTitle([testCards[0].title]);
    whenIClickTheButton(`open-details-for-card-${testCards[0].id}`);
    expect(WebviewWindow).toBeCalledWith(`${testCards[0].id}`, {
      url: `/cards/details/${testCards[0].id}`,
      height: 800,
    });
  });

  it("should work with loader", async () => {
    const input = await loader.getHarness(MatInputHarness);
    await input.setValue("Monument");
    await new Promise((resolve) => setTimeout(resolve, 10));
    fixture.detectChanges();
    thenISeeCardsWithTitle([
      "Monument in Deutschland",
      "Monument in Frankreich",
    ]);
  });

  it("should clear the input when clicking on the x-button", async () => {
    cardServiceMock.readCardByTitle.mockResolvedValue(testCards);
    await whenISearchForTitle("in");
    whenIClickTheButton("clear-input");
    const searchInput = getElementByTestId("title-search-input").nativeElement;
    await fixture.whenStable();
    expect(searchInput.value).toBe("");
  });

  const whenIClickTheButton = (buttonTestId: string) => {
    const button = getElementByTestId(buttonTestId).nativeElement;
    button.click();
    fixture.detectChanges();
  };

  const getElementByTestId = (testId: string) => {
    const element = fixture.debugElement.query(
      By.css(`[data-testid="${testId}"]`),
    );
    expect(element).toBeTruthy();
    return element;
  };
  const thenISeeCardsWithTitle = (title: string[]) => {
    const rows = fixture.debugElement.queryAll(
      By.css('[data-testid="card-row"]'),
    );
    expect(rows).toHaveLength(title.length);
    title.map((name, idx) =>
      expect(rows[idx].nativeElement.innerHTML).toContain(name),
    );
  };

  const whenISearchForTitle = async (titleFilter: string) => {
    const input = await loader.getHarness(MatInputHarness);
    await input.setValue(titleFilter);
    await new Promise((resolve) => setTimeout(resolve, 10));
    fixture.detectChanges();
  };
});

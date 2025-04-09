import { CardListComponent } from "./card-list.component";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { CardService } from "@service/card.service";
import { Card } from "@app/model/card";
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

jest.mock("@tauri-apps/api/event", () => ({
  emit: jest.fn(),
}));

jest.mock("@tauri-apps/api/webviewWindow", () => ({
  WebviewWindow: jest.fn().mockImplementation(() => ({ once: jest.fn() })),
}));

describe("CardListComponent", () => {
  let component: CardListComponent;
  let fixture: ComponentFixture<CardListComponent>;
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

  const testCards: Card[] = [
    {
      id: 0,
      title: "Monument in Deutschland",
      description: "schöne Lage",
      latitude: 0,
      longitude: 0,
      icon_name: "iconCaveBlack",
      radius: 0,
    },
    {
      id: 1,
      title: "Monument in Frankreich",
      description: "schöne Lage",
      latitude: 0,
      longitude: 0,
      icon_name: "iconCaveBlack",
      radius: 0,
    },
    {
      id: 2,
      title: "Kirche in Frankreich",
      description: "schöne Lage",
      latitude: 0,
      longitude: 0,
      icon_name: "iconCaveBlack",
      radius: 0,
    },
  ];

  beforeEach(async () => {
    cardServiceMock = {
      readCardByTitle: jest.fn().mockResolvedValue([]),
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
    const cardWithPosition: Card = {
      id: 420,
      description: "The best boulders in town",
      icon_name: "iconMiscRed",
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
    await whenISearchForTitle("Fontaine");
    thenISeeCardsWithTitle([testCards[0].title]);
    whenIClickTheButton(`open-details-for-card-${testCards[0].id}`);
    expect(WebviewWindow).toBeCalledWith(`${testCards[0].id}`, {
      url: `cards/details/${testCards[0].id}`,
    });
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
    const searchBar: HTMLInputElement =
      getElementByTestId("title-search-input").nativeElement;
    searchBar.value = titleFilter;
    searchBar.dispatchEvent(new Event("input"));
    await fixture.whenStable();
    await new Promise((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();
  };
});

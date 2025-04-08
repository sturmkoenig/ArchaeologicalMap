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
    thenISeeCardsWithName(testCards.map((card) => card.title));
  });

  const thenISeeCardsWithName = (names: string[]) => {
    const rows = fixture.debugElement.queryAll(
      By.css('[data-test-id="table-row"]'),
    );
    expect(rows).toHaveLength(names.length);
  };
  const whenISearchForTitle = async (titleFilter: string) => {
    const searchBar: HTMLInputElement = fixture.debugElement.query(
      By.css('[data-test-id="title-search-input"]'),
    ).nativeElement;
    component.filter = titleFilter;
    searchBar.dispatchEvent(new Event("keydown"));
    await fixture.whenStable();
    await new Promise((resolve) => setTimeout(resolve, 600));
    fixture.detectChanges();
  };
});

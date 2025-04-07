import { CardListComponent } from "./card-list.component";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { CardService } from "@service/card.service";

describe("CardListComponent", () => {
  let component: CardListComponent;
  let fixture: ComponentFixture<CardListComponent>;
  let cardServiceMock: {
    createCard: jest.Mock;
    readCard: jest.Mock;
    readCardsPaginated: jest.Mock;
    getNumberOfCards: jest.Mock;
    updateCard: jest.Mock;
    deleteCard: jest.Mock;
    deleteMarker: jest.Mock;
  };

  beforeEach(async () => {
    cardServiceMock = {
      createCard: jest.fn(),
      updateCard: jest.fn(),
      readCard: jest.fn(),
      readCardsPaginated: jest.fn().mockResolvedValue([]),
      getNumberOfCards: jest.fn().mockResolvedValue(0),
      deleteCard: jest.fn(),
      deleteMarker: jest.fn(),
    };
    await TestBed.configureTestingModule({
      providers: [{ provide: CardService, useValue: cardServiceMock }],
    }).compileComponents();
  });
  beforeEach(() => {
    fixture = TestBed.createComponent(CardListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create component", () => {
    expect(component).toBeTruthy();
  });
});

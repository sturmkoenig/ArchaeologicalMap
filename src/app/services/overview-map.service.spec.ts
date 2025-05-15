import { TestBed } from "@angular/core/testing";
import { OverviewMapService } from "./overview-map.service";
import { MarkerService } from "./marker.service";
import { LatLng, LatLngBounds } from "leaflet";
import { NgZone } from "@angular/core";
import { isMarkerAM } from "../model/marker";
import { CardService } from "./card.service";
import { Card } from "../model/card";
import { OverviewMapComponent } from "@app/components/overview-map/overview-map.component";
import { MarkerAM } from "@app/model/markerAM";

class MockNgZone extends NgZone {
  constructor() {
    super({ enableLongStackTrace: false });
  }

  override run<T>(fn: () => T): T {
    return fn();
  }

  override runOutsideAngular<T>(fn: () => T): T {
    return fn();
  }
}

describe("OverviewMapService", () => {
  const givenCardsInMapView = (cards: Partial<Card>[]): MarkerAM[] => {
    const mockMarkers: MarkerAM[] = cards.map((card) => givenMarker(card));
    markerServiceMock.getMarkerAMInArea.mockResolvedValue(mockMarkers);
    return mockMarkers;
  };

  const givenMarker = (card: Partial<Card>): MarkerAM =>
    new MarkerAM(
      [0, 0],
      {},
      {
        id: card.id ?? 0,
        iconName: card.iconName ?? "iconMiscRed",
        radius: card.radius,
      },
    );

  const whenIReloadTheMap = async () => {
    await service.updateMapBounds(testLatLngBounds);
  };

  const whenIDeleteTheSelectedCard = async () => {
    await service.deleteEditCard();
    TestBed.flushEffects();
  };
  const whenIClickAMarkerOnTheMap = (marker: MarkerAM) => {
    service.changeSelectedMarker(marker);
    TestBed.flushEffects();
  };

  let service!: OverviewMapService;
  let markerServiceMock!: {
    getMarkerAMInArea: jest.Mock;
    createNewMarker: jest.Mock;
  };
  let cardServiceMock!: {
    readCard: jest.Mock;
    createCard: jest.Mock;
    deleteMarker: jest.Mock;
    deleteCard: jest.Mock;
  };
  const testLatLngBounds = new LatLngBounds([
    [0, 0],
    [1, 1],
  ]);

  beforeEach(() => {
    markerServiceMock = {
      getMarkerAMInArea: jest.fn(),
      createNewMarker: jest.fn(),
    };
    cardServiceMock = {
      readCard: jest.fn(),
      createCard: jest.fn(),
      deleteMarker: jest.fn(),
      deleteCard: jest.fn(),
    };
    TestBed.configureTestingModule({
      imports: [OverviewMapComponent],
      providers: [
        { provide: NgZone, useClass: MockNgZone },
        { provide: MarkerService, useValue: markerServiceMock },
        { provide: CardService, useValue: cardServiceMock },
        { provide: OverviewMapService },
      ],
    }).compileComponents();

    service = TestBed.inject(OverviewMapService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should add layer with same id only once", async () => {
    markerServiceMock.getMarkerAMInArea.mockResolvedValue([
      givenMarker({ id: 0 }),
    ]);
    await whenIReloadTheMap();
    expect(service.mainLayerGroup.getLayers().length).toBe(1);
    markerServiceMock.getMarkerAMInArea.mockResolvedValue([
      givenMarker({ id: 0 }),
    ]);
    await service.updateMapBounds(testLatLngBounds);
    expect(service.mainLayerGroup.getLayers().length).toBe(1);
  });

  it("should remove layer when not in bounds", async () => {
    givenCardsInMapView([{ id: 0 }]);
    await whenIReloadTheMap();
    expect(service.mainLayerGroup.getLayers().length).toBe(1);
    givenCardsInMapView([{ id: 1 }]);
    await whenIReloadTheMap();
    expect(service.mainLayerGroup.getLayers().length).toBe(1);
    const marker = service.mainLayerGroup.getLayers()[0];
    if (isMarkerAM(marker)) {
      expect(marker.cardId === 1).toBe(true);
    } else {
      fail("marker in mainLayerGroup is not of correct type");
    }
  });

  it("should do nothing if the same marker is selected twice", async () => {
    const [testMarker] = givenCardsInMapView([{ id: 0 }]);
    await whenIReloadTheMap();
    expect(service.mainLayerGroup.getLayers().length).toBe(1);
    whenIClickAMarkerOnTheMap(testMarker);
    expect(service.selectedLayerGroup.getLayers().length).toBe(1);
    expect(service.mainLayerGroup.getLayers().length).toBe(0);
    whenIClickAMarkerOnTheMap(testMarker);
    expect(service.selectedLayerGroup.getLayers().length).toBe(1);
    expect(service.mainLayerGroup.getLayers().length).toBe(0);
  });

  it("should not read selectedLayer to mainLayerGroup when main layer is reset ", async () => {
    const [testMarker] = givenCardsInMapView([{ id: 0 }]);
    await whenIReloadTheMap();
    expect(service.mainLayerGroup.getLayers().length).toBe(1);

    whenIClickAMarkerOnTheMap(testMarker);
    expect(service.selectedLayerGroup.getLayers().length).toBe(1);
    expect(service.mainLayerGroup.getLayers().length).toBe(0);

    markerServiceMock.getMarkerAMInArea.mockResolvedValue([testMarker]);
    service.resetMainLayerGroup();
    await whenIReloadTheMap();
    expect(service.mainLayerGroup.getLayers().length).toBe(0);
    expect(service.selectedLayerGroup.getLayers().length).toBe(1);
  });

  it("should add new layers", async () => {
    markerServiceMock.getMarkerAMInArea.mockResolvedValue([
      givenMarker({ id: 0 }),
    ]);
    await service.updateMapBounds(testLatLngBounds);
    expect(service.mainLayerGroup.getLayers().length).toBe(1);
    markerServiceMock.getMarkerAMInArea.mockResolvedValue([
      givenMarker({ id: 0 }),
      givenMarker({ id: 1 }),
    ]);
    await whenIReloadTheMap();
    expect(service.mainLayerGroup.getLayers().length).toBe(2);
    expect(
      (service.mainLayerGroup.getLayers()[0] as MarkerAM).cardId === 0,
    ).toBe(true);
    expect(
      (service.mainLayerGroup.getLayers()[1] as MarkerAM).cardId === 1,
    ).toBe(true);
  });

  it("should load card after marker was selected", async () => {
    cardServiceMock.readCard.mockResolvedValue({
      title: "test",
      description: "test",
      latitude: 0,
      longitude: 0,
      radius: 0,
      icon_name: "iconMiscRed",
    });
    const [testMarker] = givenCardsInMapView([{ id: 0, radius: 1 }]);
    await whenIReloadTheMap();
    whenIClickAMarkerOnTheMap(testMarker);
    expect(service.selectedLayerGroup.getLayers().length).toBe(1);
    expect(service.mainLayerGroup.getLayers().length).toBe(0);
  });

  it("should create new marker+card and select it", async () => {
    const cardMock: Card = {
      id: 0,
      title: "",
      description: "",
      latitude: 0,
      longitude: 0,
      radius: 0,
      iconName: "iconMiscRed",
    };
    cardServiceMock.createCard.mockResolvedValue(cardMock);
    await service.addNewCard(new LatLng(0, 0));
    TestBed.flushEffects();
    expect(service.selectedLayerGroup.getLayers().length).toBe(1);
    expect(cardServiceMock.createCard).toHaveBeenCalled();
    expect(service.editCard()).toEqual(cardMock);
  });

  it("should delete edit card correctly", async () => {
    const markers = givenCardsInMapView([
      { id: 0 },
      { id: 1, radius: 1 },
      { id: 2 },
    ]);

    await whenIReloadTheMap();
    expect(service.mainLayerGroup.getLayers().length).toBe(3);
    expect(service.radiusLayerGroup.getLayers().length).toBe(1);

    whenIClickAMarkerOnTheMap(markers[0]);
    expect(service.selectedLayerGroup.getLayers().length).toBe(1);

    await whenIDeleteTheSelectedCard();
    expect(cardServiceMock.deleteCard).toHaveBeenCalled();

    expect(service.selectedLayerGroup.getLayers().length).toBe(0);
    expect(service.mainLayerGroup.getLayers().length).toBe(2);
  });
});

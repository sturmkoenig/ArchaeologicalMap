import { TestBed } from "@angular/core/testing";
import { OverviewMapService } from "./overview-map.service";
import { CardMarkerLayer, MarkerService } from "./marker.service";
import { Circle, LatLngBounds, Marker, MarkerClusterGroup } from "leaflet";
import { NgZone } from "@angular/core";
import { isMarkerAM } from "../model/marker";
import { CardService } from "./card.service";
import { CardDB, MarkerDB } from "../model/card";
import { OverviewMapComponent } from "@app/components/overview-map/overview-map.component";
import { MarkerAM } from "@app/model/markerAM";

const testCard: CardDB = {
  id: 0,
  title: "test updated",
  description: "test",
  markers: [
    {
      latitude: 0,
      longitude: 0,
      radius: 0,
      icon_name: "iconMiscRed",
    },
  ],
};

const updatedCardMarkerLayer: CardMarkerLayer = {
  card: {
    id: 0,
    title: "test updated",
    description: "test",
    markers: [
      {
        latitude: 0,
        longitude: 0,
        radius: 0,
        icon_name: "iconMiscRed",
      },
    ],
  },
  marker: new Marker([99, 99]),
  markerId: 0,
  markerDB: {
    id: 11,
    card_id: 10,
    latitude: 0,
    longitude: 0,
    radius: 0,
    icon_name: "iconMiscRed",
  },
  radius: new Circle([0, 0], { radius: 0 }),
};

class MockNgZone extends NgZone {
  constructor() {
    super({ enableLongStackTrace: false });
  }

  override run(fn: () => any): any {
    return fn();
  }

  override runOutsideAngular(fn: () => any): any {
    return fn();
  }
}

describe("OverviewMapService", () => {
  function createTestMarkerAM(marker: Partial<MarkerDB>): MarkerAM {
    return new MarkerAM(
      //() =>
      //  Promise.resolve({
      //    id: 1,
      //    markers: [],
      //    region_image_id: 1,
      //    stack_id: 1,
      //  }),
      [0, 0],
      {},
      {
        //markerId: marker.id ?? 0,
        cardId: marker.id ?? 0,
        iconType: marker.icon_name ?? "iconMiscRed",
        radius: marker.radius,
      },
    );
  }
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
    service.setMarkerClusterLayerGroup(new MarkerClusterGroup());
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should add layer with same id only once", async () => {
    markerServiceMock.getMarkerAMInArea.mockResolvedValue([
      createTestMarkerAM({ id: 0, card_id: 0 }),
    ]);
    await service.updateMapBounds(testLatLngBounds);
    expect(service.mainLayerGroup.getLayers().length).toBe(1);
    markerServiceMock.getMarkerAMInArea.mockResolvedValue([
      createTestMarkerAM({ id: 0, card_id: 0 }),
    ]);
    await service.updateMapBounds(testLatLngBounds);
    expect(service.mainLayerGroup.getLayers().length).toBe(1);
  });

  it("should remove layer when not in bounds", async () => {
    markerServiceMock.getMarkerAMInArea.mockResolvedValue([
      createTestMarkerAM({ id: 0, card_id: 0 }),
    ]);
    await service.updateMapBounds(testLatLngBounds);
    expect(service.mainLayerGroup.getLayers().length).toBe(1);
    markerServiceMock.getMarkerAMInArea.mockResolvedValue([
      createTestMarkerAM({ id: 1, card_id: 0 }),
    ]);
    await service.updateMapBounds(testLatLngBounds);
    expect(service.mainLayerGroup.getLayers().length).toBe(1);
    const marker = service.mainLayerGroup.getLayers()[0];
    if (isMarkerAM(marker)) {
      expect(marker.cardId === 1).toBe(true);
    } else {
      fail("marker in mainLayerGroup is not of correct type");
    }
  });

  it("should do nothing if the same marker is selected twice", async () => {
    const testMarker = createTestMarkerAM({ id: 0, card_id: 0 });
    markerServiceMock.getMarkerAMInArea.mockResolvedValue([testMarker]);
    await service.updateMapBounds(testLatLngBounds);
    expect(service.mainLayerGroup.getLayers().length).toBe(1);
    service.changeSelectedMarkerAM(testMarker);
    TestBed.flushEffects();
    expect(service.selectedLayerGroup.getLayers().length).toBe(1);
    expect(service.mainLayerGroup.getLayers().length).toBe(0);
    service.changeSelectedMarkerAM(testMarker);
    TestBed.flushEffects();
    expect(service.selectedLayerGroup.getLayers().length).toBe(1);
    expect(service.mainLayerGroup.getLayers().length).toBe(0);
  });

  it("should not readd selectedLayer to mainLayerGroup when main layer is reset ", async () => {
    const testMarker = createTestMarkerAM({ id: 0, card_id: 0 });
    markerServiceMock.getMarkerAMInArea.mockResolvedValue([testMarker]);
    await service.updateMapBounds(testLatLngBounds);
    expect(service.mainLayerGroup.getLayers().length).toBe(1);

    service.changeSelectedMarkerAM(testMarker);
    TestBed.flushEffects();
    expect(service.selectedLayerGroup.getLayers().length).toBe(1);
    expect(service.mainLayerGroup.getLayers().length).toBe(0);

    markerServiceMock.getMarkerAMInArea.mockResolvedValue([testMarker]);
    service.resetMainLayerGroup();
    await service.updateMapBounds(testLatLngBounds);
    expect(service.mainLayerGroup.getLayers().length).toBe(0);
    expect(service.selectedLayerGroup.getLayers().length).toBe(1);
  });

  it("should add new layers", async () => {
    markerServiceMock.getMarkerAMInArea.mockResolvedValue([
      createTestMarkerAM({ id: 0, card_id: 0 }),
    ]);
    await service.updateMapBounds(testLatLngBounds);
    expect(service.mainLayerGroup.getLayers().length).toBe(1);
    markerServiceMock.getMarkerAMInArea.mockResolvedValue([
      createTestMarkerAM({ id: 0, card_id: 0 }),
      createTestMarkerAM({ id: 1, card_id: 0 }),
    ]);
    await service.updateMapBounds(testLatLngBounds);
    expect(service.mainLayerGroup.getLayers().length).toBe(2);
    expect(
      (service.mainLayerGroup.getLayers()[0] as MarkerAM).cardId === 0,
    ).toBe(true);
    expect(
      (service.mainLayerGroup.getLayers()[1] as MarkerAM).cardId === 1,
    ).toBe(true);
  });

  it("should load card after marker was selected", async () => {
    cardServiceMock.readCard.mockReturnValue({
      title: "test",
      description: "test",
      markers: [
        {
          latitude: 0,
          longitude: 0,
          radius: 0,
          icon_name: "iconMiscRed",
        },
      ],
    });
    const testMarker = createTestMarkerAM({ id: 0, card_id: 0, radius: 1 });
    markerServiceMock.getMarkerAMInArea.mockResolvedValue([testMarker]);
    await service.updateMapBounds(testLatLngBounds);
    service.changeSelectedMarkerAM(testMarker);
    TestBed.flushEffects();
    expect(service.selectedLayerGroup.getLayers().length).toBe(1);
    expect(service.mainLayerGroup.getLayers().length).toBe(0);
  });

  it("should create new marker+card and select it", async () => {
    const cardMock = {
      id: 0,
      title: "",
      description: "",
      markers: [{ id: 1 }],
    };
    cardServiceMock.createCard.mockResolvedValue(cardMock);
    await service.addNewCard([0, 0]);
    TestBed.flushEffects();
    expect(service.selectedLayerGroup.getLayers().length).toBe(1);
    expect(cardServiceMock.createCard).toHaveBeenCalled();
    expect(service.editCard()).toEqual(cardMock);
  });

  it("should delete selectedLayer correctly", async () => {
    const testMarker = createTestMarkerAM({ id: 0, card_id: 0, radius: 1 });
    markerServiceMock.getMarkerAMInArea.mockResolvedValue([testMarker]);
    await service.updateMapBounds(testLatLngBounds);
    service.changeSelectedMarkerAM(testMarker);
    TestBed.flushEffects();
    expect(service.selectedLayerGroup.getLayers().length).toBe(1);
    expect(service.radiusLayerGroup.getLayers().length).toBe(1);
    await service.deleteSelectedMarker();
    TestBed.flushEffects();
    expect(service.selectedLayerGroup.getLayers().length).toBe(0);
    expect(cardServiceMock.deleteMarker).toHaveBeenCalled();
  });

  // TODO: add marker to card is obsolete
  it("should add marker to selected card", async () => {
    markerServiceMock.createNewMarker.mockResolvedValue(
      updatedCardMarkerLayer.markerDB,
    );
    cardServiceMock.readCard.mockResolvedValue(updatedCardMarkerLayer.card);
    const testMarker = createTestMarkerAM({ id: 0, card_id: 0 });
    markerServiceMock.getMarkerAMInArea.mockResolvedValue([testMarker]);
    await service.updateMapBounds(testLatLngBounds);
    expect(service.mainLayerGroup.getLayers().length).toBe(1);
    service.changeSelectedMarkerAM(testMarker);
    TestBed.flushEffects();
    expect(service.mainLayerGroup.getLayers().length).toBe(0);
    expect(service.selectedLayerGroup.getLayers().length).toBe(1);
    await service.addMarkerToSelectedCard([0, 0]);
    TestBed.flushEffects();
    expect(service.selectedLayerGroup.getLayers().length).toBe(1);
    expect(service.mainLayerGroup.getLayers().length).toBe(1);
    expect(service.selectedMarker()?.cardId).toBe(10);
    expect(service.selectedMarker()?.cardId).toBe(11);
  });

  // TODO: behavior changed!
  it("should delete edit card correctly", async () => {
    //initialize state
    const testMarker1 = createTestMarkerAM({ id: 0, card_id: testCard.id });
    const testMarker2 = createTestMarkerAM({
      id: 1,
      card_id: testCard.id,
      radius: 1,
    });
    const testMarker3 = createTestMarkerAM({
      id: 2,
      card_id: 1,
    });
    markerServiceMock.getMarkerAMInArea.mockResolvedValue([
      testMarker1,
      testMarker2,
      testMarker3,
    ]);
    await service.updateMapBounds(testLatLngBounds);
    expect(service.mainLayerGroup.getLayers().length).toBe(3);
    expect(service.radiusLayerGroup.getLayers().length).toBe(1);

    // select marker which has a card that is linked to other displayed markers
    cardServiceMock.readCard.mockReturnValue(testCard);
    service.changeSelectedMarkerAM(testMarker1);
    TestBed.flushEffects();
    expect(service.selectedLayerGroup.getLayers().length).toBe(1);

    // delete card
    await service.deleteEditCard();
    TestBed.flushEffects();
    expect(cardServiceMock.deleteCard).toHaveBeenCalled();

    //selected should be empty
    expect(service.selectedLayerGroup.getLayers().length).toBe(0);
    // all markers with card_id should have been removed
    expect(service.mainLayerGroup.getLayers().length).toBe(1);
    const marker = service.mainLayerGroup.getLayers()[0];
    if (isMarkerAM(marker)) {
      expect(marker.cardId).toBe(2);
      expect(marker.cardId).toBe(testCard.id! + 1);
    } else {
      fail("marker in mainLayerGroup is not of correct type!");
    }
  });
});

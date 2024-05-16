// @ts-nocheck
import { TestBed } from "@angular/core/testing";
import { OverviewMapService } from "./overview-map.service";
import { CardMarkerLayer, MarkerService } from "./marker.service";
import { Circle, LatLngBounds, Marker } from "leaflet";
import { NgZone } from "@angular/core";
import { MarkerAM } from "../model/marker";
import { CardService } from "./card.service";
import { CardDB, MarkerDB } from "../model/card";

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

describe("OverviewMapStore", () => {
  function createTestMarkerAM(marker: Partial<MarkerDB>): MarkerAM {
    return new MarkerAM(
      [0, 0],
      {},
      {
        markerId: marker.id ?? 0,
        cardId: marker.card_id ?? 0,
        iconType: marker.icon_name ?? "iconMiscRed",
        radius: marker.radius,
      },
    );
  }
  let service!: OverviewMapService;
  let markerService: jasmine.SpyObj<MarkerService>;
  let cardService: jasmine.SpyObj<CardService>;
  const testLatLngBounds = new LatLngBounds([
    [0, 0],
    [1, 1],
  ]);

  beforeEach(() => {
    const markerServiceSpy = jasmine.createSpyObj("MarkerService", [
      "getMarker",
      "markerToMapLayer",
      "getMarkerAMInArea",
      "createNewMarker",
    ]);

    const cardServiceSpy = jasmine.createSpyObj("CardService", [
      "readCard",
      "createCard",
      "deleteMarker",
      "deleteCard",
    ]);

    TestBed.configureTestingModule({
      providers: [
        OverviewMapService,
        { provide: NgZone, useClass: MockNgZone },
        { provide: MarkerService, useValue: markerServiceSpy },
        { provide: CardService, useValue: cardServiceSpy },
      ],
    });

    service = TestBed.inject(OverviewMapService);
    markerService = TestBed.inject(
      MarkerService,
    ) as jasmine.SpyObj<MarkerService>;

    cardService = TestBed.inject(CardService) as jasmine.SpyObj<CardService>;
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should add layer with same id only once", async () => {
    markerService.getMarkerAMInArea.and.resolveTo([
      createTestMarkerAM({ id: 0, card_id: 0 }),
    ]);
    await service.updateMapBounds(testLatLngBounds);
    expect(service._mainLayerGroup.getLayers().length).toBe(1);
    markerService.getMarkerAMInArea.and.resolveTo([
      createTestMarkerAM({ id: 0, card_id: 0 }),
    ]);
    await service.updateMapBounds(testLatLngBounds);
    expect(service._mainLayerGroup.getLayers().length).toBe(1);
  });

  it("should remove layer when not in bounds", async () => {
    markerService.getMarkerAMInArea.and.resolveTo([
      createTestMarkerAM({ id: 0, card_id: 0 }),
    ]);
    await service.updateMapBounds(testLatLngBounds);
    expect(service._mainLayerGroup.getLayers().length).toBe(1);
    markerService.getMarkerAMInArea.and.resolveTo([
      createTestMarkerAM({ id: 1, card_id: 0 }),
    ]);
    await service.updateMapBounds(testLatLngBounds);
    expect(service._mainLayerGroup.getLayers().length).toBe(1);
    // @ts-ignore
    expect(service._mainLayerGroup.getLayers()[0].markerId === 1).toBeTrue();
  });

  it("should do nothing if the same marker is selected twice", async () => {
    const testMarker = createTestMarkerAM({ id: 0, card_id: 0 });
    markerService.getMarkerAMInArea.and.resolveTo([testMarker]);
    await service.updateMapBounds(testLatLngBounds);
    expect(service._mainLayerGroup.getLayers().length).toBe(1);
    service.changeSelectedMarkerAM(testMarker);
    TestBed.flushEffects();
    expect(service._selectedLayerGroup.getLayers().length)
      .withContext("after selection 1 layer is in selected group")
      .toBe(1);
    expect(service._mainLayerGroup.getLayers().length)
      .withContext("after selection main group is empty")
      .toBe(0);
    service.changeSelectedMarkerAM(testMarker);
    TestBed.flushEffects();
    expect(service._selectedLayerGroup.getLayers().length)
      .withContext("marker was previously selected, still 1 layer in selected")
      .toBe(1);
    expect(service._mainLayerGroup.getLayers().length)
      .withContext("marker was previously selected, still 0 layer in main")
      .toBe(0);
  });

  it("should not readd selectedLayer to mainLayerGroup when main layer is reset ", async () => {
    const testMarker = createTestMarkerAM({ id: 0, card_id: 0 });
    markerService.getMarkerAMInArea.and.resolveTo([testMarker]);
    await service.updateMapBounds(testLatLngBounds);
    expect(service._mainLayerGroup.getLayers().length).toBe(1);

    service.changeSelectedMarkerAM(testMarker);
    TestBed.flushEffects();
    expect(service._selectedLayerGroup.getLayers().length).toBe(1);
    expect(service._mainLayerGroup.getLayers().length).toBe(0);

    markerService.getMarkerAMInArea.and.resolveTo([testMarker]);
    service.resetMainLayerGroup();
    await service.updateMapBounds(testLatLngBounds);
    expect(service._mainLayerGroup.getLayers().length)
      .withContext(
        "expect the main layer to be empty since layer is already in selecte layer",
      )
      .toBe(0);
    expect(service._selectedLayerGroup.getLayers().length).toBe(1);
  });

  it("should add new layers", async () => {
    markerService.getMarkerAMInArea.and.resolveTo([
      createTestMarkerAM({ id: 0, card_id: 0 }),
    ]);
    await service.updateMapBounds(testLatLngBounds);
    expect(service._mainLayerGroup.getLayers().length).toBe(1);
    markerService.getMarkerAMInArea.and.resolveTo([
      createTestMarkerAM({ id: 0, card_id: 0 }),
      createTestMarkerAM({ id: 1, card_id: 0 }),
    ]);
    await service.updateMapBounds(testLatLngBounds);

    expect(service._mainLayerGroup.getLayers().length).toBe(2);
    // @ts-ignore
    expect(service._mainLayerGroup.getLayers()[0].markerId === 0).toBeTrue();
    // @ts-ignore
    expect(service._mainLayerGroup.getLayers()[1].markerId === 1).toBeTrue();
  });
  it("should load card after marker was selected", async () => {
    cardService.readCard.and.resolveTo({
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
    markerService.getMarkerAMInArea.and.resolveTo([testMarker]);
    await service.updateMapBounds(testLatLngBounds);
    service.changeSelectedMarkerAM(testMarker);
    TestBed.flushEffects();
    expect(service._selectedLayerGroup.getLayers().length).toBe(2);
    expect(service._mainLayerGroup.getLayers().length).toBe(0);
  });

  it("should create new marker+card and select it", async () => {
    const cardMock = {
      id: 0,
      title: "",
      description: "",
      markers: [{ id: 1 }],
    };
    cardService.createCard.and.resolveTo(cardMock);
    await service.addNewCard([0, 0]);
    expect(service._selectedLayerGroup.getLayers().length).toBe(1);
    expect(cardService.createCard).toHaveBeenCalled();
    TestBed.flushEffects();
    expect(service.editCard()).toEqual(cardMock);
  });

  it("should delete selectedLayer correctly", async () => {
    cardService.deleteMarker.and.resolveTo();
    const testMarker = createTestMarkerAM({ id: 0, card_id: 0, radius: 1 });
    markerService.getMarkerAMInArea.and.resolveTo([testMarker]);
    await service.updateMapBounds(testLatLngBounds);
    service.changeSelectedMarkerAM(testMarker);
    TestBed.flushEffects();
    expect(service._selectedLayerGroup.getLayers().length).toBe(2);
    service.deleteSelectedMarker();
    TestBed.flushEffects();
    expect(service._selectedLayerGroup.getLayers().length).toBe(0);
    expect(cardService.deleteMarker).toHaveBeenCalled();
  });

  it("should add marker to selected card", async () => {
    markerService.createNewMarker.and.resolveTo(
      updatedCardMarkerLayer.markerDB,
    );
    cardService.readCard.and.resolveTo(updatedCardMarkerLayer.card);
    const testMarker = createTestMarkerAM({ id: 0, card_id: 0 });
    markerService.getMarkerAMInArea.and.resolveTo([testMarker]);
    await service.updateMapBounds(testLatLngBounds);
    expect(service._mainLayerGroup.getLayers().length).toBe(1);
    service.changeSelectedMarkerAM(testMarker);
    TestBed.flushEffects();
    expect(service._mainLayerGroup.getLayers().length).toBe(0);
    expect(service._selectedLayerGroup.getLayers().length).toBe(1);
    await service.addMarkerToSelectedCard([0, 0]);
    TestBed.flushEffects();
    expect(service._selectedLayerGroup.getLayers().length).toBe(1);
    expect(service._mainLayerGroup.getLayers().length).toBe(1);
    expect(service.selectedMarker()?.cardId).toBe(10);
    expect(service.selectedMarker()?.markerId).toBe(11);
  });

  it("should delete edit card correctly", async () => {
    //initialize state
    cardService.deleteMarker.and.resolveTo();
    const testMarker1 = createTestMarkerAM({ id: 0, card_id: testCard.id });
    const testMarker2 = createTestMarkerAM({
      id: 1,
      card_id: testCard.id,
      radius: 1,
    });
    const testMarker3 = createTestMarkerAM({
      id: 2,
      card_id: testCard.id! + 1,
    });
    markerService.getMarkerAMInArea.and.resolveTo([
      testMarker1,
      testMarker2,
      testMarker3,
    ]);
    await service.updateMapBounds(testLatLngBounds);
    expect(service._mainLayerGroup.getLayers().length)
      .withContext("expected 4 layers to be in mainLayerGroup")
      .toBe(4);

    // select marker which has a card that is linked to other displayed markers
    cardService.readCard.and.resolveTo(testCard);
    service.changeSelectedMarkerAM(testMarker1);
    TestBed.flushEffects();
    expect(service._selectedLayerGroup.getLayers().length)
      .withContext("expected 1 layers to be in selectedLayerGroup")
      .toBe(1);

    // delete card
    await service.deleteEditCard();
    TestBed.flushEffects();
    expect(cardService.deleteCard).toHaveBeenCalled();

    //selectd should be empty
    expect(service._selectedLayerGroup.getLayers().length)
      .withContext("expect the selectedLayerGroup to be empty after deletion")
      .toBe(0);
    // all markers with card_id should have been removed
    expect(service._mainLayerGroup.getLayers().length)
      .withContext(
        "expect after deletion to have removed all markers with cardId",
      )
      .toBe(1);
    expect(service._mainLayerGroup.getLayers()[0].markerId)
      .withContext("expect to only have a marker with markerId 2")
      .toBe(2);
    expect(service._mainLayerGroup.getLayers()[0].cardId)
      .withContext("should also only have the non deleted card id 1")
      .toBe(testCard.id! + 1);
  });
});

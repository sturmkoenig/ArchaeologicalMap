import { TestBed } from "@angular/core/testing";
import { MarkerService } from "./marker.service";
import { CardService } from "./card.service";
import { MarkerDB } from "../model/card";
import { MarkerAM } from "../model/marker";
import { LatLngBounds } from "leaflet";

const MockCardService = {
  readCardTitleMapping: () => Promise.resolve([]),
  readCard: () => {},
  readMarkersInArea: () => {
    return Promise.resolve([]);
  },
};

describe("MarkerService", () => {
  let service: MarkerService;

  let testMarkerDB: MarkerDB = {
    id: 1,
    card_id: 1,
    latitude: 1,
    longitude: 1,
    icon_name: "iconCaveRed",
    radius: 1,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        MarkerService,
        { provide: CardService, useValue: MockCardService },
      ],
    });

    service = TestBed.inject(MarkerService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should load MarkerAM correctly", async () => {
    const dependencySpy = spyOn(
      TestBed.inject(CardService),
      "readMarkersInArea",
    ).and.returnValue(Promise.resolve([testMarkerDB]));
    await service
      .getMarkerAMInArea(
        new LatLngBounds([
          [1, 1],
          [1, 1],
        ]),
      )
      .then((markers: MarkerAM[]) => {
        expect(markers).toBeTruthy();
        expect(markers).toHaveSize(1);
        expect(markers[0].markerId).toEqual(testMarkerDB.id!);
        expect(markers[0].cardId).toEqual(testMarkerDB.card_id!);
        expect(markers[0].iconType).toEqual(testMarkerDB.icon_name);
        expect(markers[0].radiusLayer).toBeTruthy();
      });
  });
});

import { TestBed } from "@angular/core/testing";
import { MarkerService } from "@service/marker.service";
import { CardService } from "@service/card.service";
import { Card, MarkerDB } from "@app/model/card";
import { LatLngBounds } from "leaflet";
import { MarkerAM } from "@app/model/markerAM";

const MockCardService = {
  readCard: () => {},
  readMarkersInArea: () => {
    return Promise.resolve([]);
  },
};

describe("MarkerService", () => {
  let service: MarkerService;

  const testCard: Card = {
    id: 1,
    latitude: 1,
    longitude: 1,
    description: "my super helpful description",
    title: "title of a super cool place in europe",
    icon_name: "iconCaveRed",
    radius: 1,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        MarkerService,
        { provide: CardService, useValue: MockCardService },
        { provide: MarkerService },
      ],
    });

    service = TestBed.inject(MarkerService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should load MarkerAM correctly", async () => {
    jest
      .spyOn(TestBed.inject(CardService), "readCardsInArea")
      .mockResolvedValue([testCard]);
    await service
      .getMarkerAMInArea(
        new LatLngBounds([
          [1, 1],
          [1, 1],
        ]),
      )
      .then((markers: MarkerAM[]) => {
        expect(markers).toBeTruthy();
        expect(markers).toHaveLength(1);
        expect(markers[0].cardId).toEqual(testCard.id!);
        expect(markers[0].iconType).toEqual(testCard.icon_name);
        expect(markers[0].radiusLayer).toBeTruthy();
      });
  });
});

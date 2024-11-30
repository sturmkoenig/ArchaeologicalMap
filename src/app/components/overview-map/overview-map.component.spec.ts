import { ComponentFixture, TestBed } from "@angular/core/testing";
import { OverviewMapComponent } from "./overview-map.component";
import { OverviewMapService } from "../../services/overview-map.service";
import { ActivatedRoute } from "@angular/router";
import { LeafletModule } from "@bluehalo/ngx-leaflet";
import { LayerGroup } from "leaflet";
import { MarkerService } from "../../services/marker.service";
import { CardService } from "../../services/card.service";
import { IconService } from "../../services/icon.service";
import { RightSidebarComponent } from "../../layout/right-sidebar/right-sidebar.component";
import { IconSizeSettingsComponent } from "./map-settings/icon-size-settings/icon-size-settings.component";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { By } from "@angular/platform-browser";
import { CardDB } from "src/app/model/card";
import * as TauriEvent from "@tauri-apps/api/event";
import { MarkerAM } from "src/app/model/marker";
import { SettingService } from "../../services/setting.service";

jest.mock("@tauri-apps/api/event", () => {
  return {
    __esModule: true,
    ...jest.requireActual("@tauri-apps/api/event"),
  };
});
describe("OverviewMapComponent", () => {
  let component: OverviewMapComponent;
  let fixture: ComponentFixture<OverviewMapComponent>;
  let markerServiceMock: {
    getMarkerAMInArea: jest.Mock;
    updateMarker: jest.Mock;
  };
  let cardServiceMock: {
    createCard: jest.Mock;
    readCard: jest.Mock;
    deleteCard: jest.Mock;
    deleteMarker: jest.Mock;
  };
  let iconServiceMock: { getIconSizeSettings: jest.Mock };
  let settingsServiceMock: {
    saveMapBoundingBox: jest.Mock;
    loadMapBoundingBox: jest.Mock;
  };

  beforeEach(async () => {
    jest
      .spyOn(TauriEvent, "listen")
      .mockImplementation((_eventName, _handler) => Promise.resolve(jest.fn()));
    markerServiceMock = {
      getMarkerAMInArea: jest.fn(),
      updateMarker: jest.fn(),
    };
    markerServiceMock.getMarkerAMInArea.mockResolvedValue([]);
    cardServiceMock = {
      createCard: jest.fn(),
      readCard: jest.fn(),
      deleteCard: jest.fn(),
      deleteMarker: jest.fn(),
    };
    iconServiceMock = { getIconSizeSettings: jest.fn() };
    iconServiceMock.getIconSizeSettings.mockResolvedValue(new Map());
    settingsServiceMock = {
      saveMapBoundingBox: jest.fn(),
      loadMapBoundingBox: jest.fn(),
    };
    const activatedRouteStub = {
      snapshot: { queryParams: { longitude: 12, latitude: 12 } },
    };
    await TestBed.configureTestingModule({
      declarations: [OverviewMapComponent],
      imports: [
        LeafletModule,
        RightSidebarComponent,
        IconSizeSettingsComponent,
        NoopAnimationsModule,
      ],
      providers: [
        { provide: MarkerService, useValue: markerServiceMock },
        { provide: CardService, useValue: cardServiceMock },
        { provide: IconService, useValue: iconServiceMock },
        { provide: SettingService, useValue: settingsServiceMock },
        OverviewMapService,
        { provide: ActivatedRoute, useValue: activatedRouteStub },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(OverviewMapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should have mainLayerGroup property with mocked value", async () => {
    givenTheCard(testCard);
    whenIClickAButton("add-new-card");
    whenIClickTheMap();
    await fixture.whenStable();
    TestBed.flushEffects();

    expect(cardServiceMock.createCard).toHaveBeenCalledWith({
      title: "",
      description: "",
      markers: [
        {
          id: undefined,
          card_id: undefined,
          longitude: expect.any(Number),
          latitude: expect.any(Number),
          radius: 0,
          icon_name: "iconMiscRed",
        },
      ],
    });
    expect(component.selectedLayerGroup.getLayers().length).toBe(1);
  });

  // it("should delete selected card", async () => {
  //   givenTheCard(testCard);
  //   whenIClickAButton("add-new-card");
  //   whenIClickTheMap();
  //   await fixture.whenStable();
  //   TestBed.flushEffects();

  //   component.onDeleteSelectedCard();
  //   await fixture.whenStable();
  //   TestBed.flushEffects();

  //   expect(cardServiceMock.deleteCard).toHaveBeenCalledWith(testCard.id!);
  //   expect(component.selectedLayerGroup.getLayers()).toHaveLength(0);
  //   expect(component.mainLayerGroup.getLayers()).toHaveLength(0);
  // });

  // it("should delete marker", async () => {
  //   givenTheCard(testCard);
  //   whenIClickAButton("add-new-card");
  //   whenIClickTheMap();
  //   await fixture.whenStable();
  //   TestBed.flushEffects();

  //   component.onDeleteSelectedMarker();
  //   await fixture.whenStable();
  //   TestBed.flushEffects();

  //   expect(cardServiceMock.deleteMarker).toHaveBeenCalledWith(testCard.id!);
  //   expect(component.selectedLayerGroup.getLayers()).toHaveLength(0);
  //   expect(component.mainLayerGroup.getLayers()).toHaveLength(0);
  // });

  // it("should move existing marker", async () => {
  //   givenTheCard(testCard);
  //   whenIClickAButton("add-new-card");
  //   whenIClickTheMap();
  //   await fixture.whenStable();
  //   TestBed.flushEffects();

  //   component.onMoveExistingMarker();
  //   whenIClickTheMap();
  //   await fixture.whenStable();
  //   TestBed.flushEffects();

  //   expect(markerServiceMock.updateMarker).toHaveBeenCalled();
  // });

  // it("should update icon size of selected layer correctly", async () => {
  //   givenTheCard(testCard);
  //   whenIClickAButton("add-new-card");
  //   whenIClickTheMap();
  //   await fixture.whenStable();
  //   TestBed.flushEffects();

  //   component.onUpdateIconSize({ iconType: "iconMiscRed", iconSize: 40 });
  //   const layer: MarkerAM =
  //     component.selectedLayerGroup.getLayers()[0] as MarkerAM;
  //   expect(layer.getIcon().options.iconSize).toEqual([40, 40]);
  // });

  // it("should update icon size of main layer correctly", async () => {
  //   givenTheCard(testCard);
  //   whenIClickAButton("add-new-card");
  //   whenIClickTheMap();
  //   await fixture.whenStable();
  //   TestBed.flushEffects();

  //   givenTheCard({ id: 2, ...testCard });
  //   whenIClickAButton("add-new-card");
  //   whenIClickTheMap();
  //   await fixture.whenStable();
  //   TestBed.flushEffects();

  //   expect(component.selectedLayerGroup.getLayers()).toHaveLength(1);
  //   expect(component.mainLayerGroup.getLayers()).toHaveLength(1);

  //   component.onUpdateIconSize({ iconType: "iconMiscRed", iconSize: 40 });
  //   const layer: MarkerAM =
  //     component.selectedLayerGroup.getLayers()[0] as MarkerAM;
  //   expect(layer.getIcon().options.iconSize).toEqual([40, 40]);
  // });

  const testCard: CardDB = {
    id: 1,
    title: "a",
    description: "a",
    markers: [
      {
        latitude: 1,
        longitude: 1,
        id: 1,
        radius: 0,
        icon_name: "iconMiscRed",
      },
    ],
  };

  const givenTheCard = (card: CardDB) => {
    cardServiceMock.createCard.mockResolvedValue(card);
    cardServiceMock.readCard.mockResolvedValue(card);
  };

  const whenIClickAButton = (testId: string) => {
    const button = fixture.debugElement.query(
      By.css(`[data-testid="${testId}"]`),
    ).nativeElement;
    button.click();
  };

  const whenIClickTheMap = async () => {
    const map = fixture.debugElement.query(
      By.css(".map-container"),
    ).nativeElement;
    map.click();
  };
});

import { ComponentFixture, TestBed } from "@angular/core/testing";
import { OverviewMapComponent } from "@app/components/overview-map/overview-map.component";
import { OverviewMapService } from "@service/overview-map.service";
import { ActivatedRoute } from "@angular/router";
import { LeafletModule } from "@bluehalo/ngx-leaflet";
import { MarkerService } from "@service/marker.service";
import { CardService } from "@service/card.service";
import { IconService } from "@service/icon.service";
import { RightSidebarComponent } from "@app/layout/right-sidebar/right-sidebar.component";
import { IconSizeSettingsComponent } from "@app/components/overview-map/map-settings/icon-size-settings/icon-size-settings.component";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { By } from "@angular/platform-browser";
import { CardDB } from "src/app/model/card";
import * as TauriEvent from "@tauri-apps/api/event";
import { SettingService } from "@service/setting.service";
import { LeafletMarkerClusterModule } from "@bluehalo/ngx-leaflet-markercluster";
import { NgIf } from "@angular/common";
import { MapSettingsComponent } from "@app/components/overview-map/map-settings/map-settings.component";
import { MarkerAM } from "@app/model/marker";
import { CardInputComponent } from "@app/components/cards/card-input/card-input.component";
import { from } from "rxjs";
import { StackStore } from "@app/state/stack.store";

jest.mock("@tauri-apps/api/event", () => {
  return {
    __esModule: true,
    ...jest.requireActual("@tauri-apps/api/event"),
  };
});

jest.mock("@tauri-apps/api/window", () => ({
  getCurrentWindow: () => ({
    setTitle: jest.fn(),
    onCloseRequested: jest.fn(),
  }),
}));

jest.mock("@tauri-apps/api/webviewWindow", () => ({
  WebviewWindow: (_x: string, _y: unknown) => {
    jest.fn();
  },
}));

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
    getMapSettings: jest.Mock;
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
      getMapSettings: jest.fn(),
    };
    const StackStoreMock = {
      stacks$: from([]),
    };
    const activatedRouteStub = {
      snapshot: { queryParams: { longitude: 12, latitude: 12 } },
    };
    await TestBed.configureTestingModule({
      imports: [
        LeafletMarkerClusterModule,
        LeafletModule,
        RightSidebarComponent,
        IconSizeSettingsComponent,
        NoopAnimationsModule,
        OverviewMapComponent,
        MapSettingsComponent,
        CardInputComponent,
        NgIf,
      ],
      providers: [
        { provide: MarkerService, useValue: markerServiceMock },
        { provide: CardService, useValue: cardServiceMock },
        { provide: IconService, useValue: iconServiceMock },
        { provide: SettingService, useValue: settingsServiceMock },
        OverviewMapService,
        { provide: ActivatedRoute, useValue: activatedRouteStub },
        { provide: StackStore, useValue: StackStoreMock },
      ],
    }).compileComponents();
    settingsServiceMock.getMapSettings.mockResolvedValue({
      maxClusterRadius: 1,
    });
    fixture = TestBed.createComponent(OverviewMapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    component.markerClusterOptions = { maxClusterRadius: 1 };
  });

  it("should have mainLayerGroup property with mocked value", async () => {
    givenTheCard(testCard);
    whenIClickAButton("add-new-card");
    await whenIClickTheMap();

    expect(cardServiceMock.createCard).toHaveBeenCalledWith({
      title: "",
      description: "",
      markers: [
        {
          id: 0,
          card_id: 0,
          longitude: expect.any(Number),
          latitude: expect.any(Number),
          radius: 0,
          icon_name: "iconMiscRed",
        },
      ],
    });
    expect(component.selectedLayerGroup.getLayers().length).toBe(1);
  });

  it("should delete selected card", async () => {
    givenTheCard(testCard);
    whenIClickAButton("add-new-card");
    await whenIClickTheMap();

    await component.onDeleteSelectedCard();

    expect(cardServiceMock.deleteCard).toHaveBeenCalledWith(testCard.id!);
    expect(component.selectedLayerGroup.getLayers()).toHaveLength(0);
    expect(component.mainLayerGroup.getLayers()).toHaveLength(0);
  });

  it("should delete marker", async () => {
    givenTheCard(testCard);
    whenIClickAButton("add-new-card");
    await whenIClickTheMap();

    await component.onDeleteSelectedMarker();

    expect(cardServiceMock.deleteMarker).toHaveBeenCalledWith(testCard.id!);
    expect(component.selectedLayerGroup.getLayers()).toHaveLength(0);
    expect(component.mainLayerGroup.getLayers()).toHaveLength(0);
  });

  it("should move existing marker", async () => {
    givenTheCard(testCard);
    whenIClickAButton("add-new-card");
    await whenIClickTheMap();

    component.onMoveExistingMarker();
    await whenIClickTheMap();

    expect(markerServiceMock.updateMarker).toHaveBeenCalled();
  });

  it("should update icon size of selected layer correctly", async () => {
    givenTheCard(testCard);
    whenIClickAButton("add-new-card");
    await whenIClickTheMap();
    component.onUpdateIconSize({ iconType: "iconMiscRed", iconSize: 40 });
    const layer: MarkerAM =
      component.selectedLayerGroup.getLayers()[0] as MarkerAM;
    expect((layer.getIcon().options as any).html).toMatch(
      "width: 40px; height: 40px",
    );
  });

  it("should update icon size of main layer correctly", async () => {
    givenTheCard(testCard);
    whenIClickAButton("add-new-card");
    await whenIClickTheMap();

    whenIClickAButton("update-card-button");
    whenIClickAButton("close-update-sidebar");

    expect(component.selectedLayerGroup.getLayers()).toHaveLength(0);
    expect(component.overviewMapService.clusterGroup.getLayers()).toHaveLength(
      1,
    );

    component.onUpdateIconSize({ iconType: "iconMiscRed", iconSize: 40 });
    const layer: MarkerAM = component.mainLayerGroup.getLayers()[0] as MarkerAM;
    expect((layer.getIcon().options as any).html).toMatch(
      "width: 40px; height: 40px",
    );
  });

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
    fixture.detectChanges();
  };

  const whenIClickTheMap = async () => {
    const map = fixture.debugElement.query(By.css("#map")).nativeElement;
    map.click();
    fixture.detectChanges();
  };
});

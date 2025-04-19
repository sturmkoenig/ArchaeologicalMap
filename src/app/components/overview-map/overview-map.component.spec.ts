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
import { Card } from "src/app/model/card";
import * as TauriEvent from "@tauri-apps/api/event";
import { listen } from "@tauri-apps/api/event";
import { MapSettings, SettingService } from "@service/setting.service";
import { NgIf } from "@angular/common";
import { MapSettingsComponent } from "@app/components/overview-map/map-settings/map-settings.component";
import { CardInputComponent } from "@app/components/cards/card-input/card-input.component";
import { from } from "rxjs";
import { readFile, writeTextFile } from "@tauri-apps/plugin-fs";
import { StackStore } from "@app/state/stack.store";
import { MarkerAM } from "@app/model/markerAM";
import { DivIconOptions } from "leaflet";
import { setWindowFocus } from "@app/util/window-util";

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
    setFocus: jest.fn(),
  }),
}));
jest.mock("@app/util/window-util", () => ({
  setWindowFocus: jest.fn(),
}));

jest.mock("@tauri-apps/api/webviewWindow", () => ({
  WebviewWindow: (_x: string, _y: unknown) => {
    jest.fn();
  },
}));

jest.mock("@tauri-apps/plugin-fs", () => ({
  writeTextFile: jest.fn(),
  readFile: jest.fn(),
}));
const location: Location = window.location;
// @ts-ignore
delete window.location;
window.location = {
  ...location,
  reload: jest.fn(),
};

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
    readCardsPaginated: jest.Mock;
    updateCard: jest.Mock;
    deleteCard: jest.Mock;
    deleteMarker: jest.Mock;
  };
  let listenSpy: jest.SpyInstance;
  let readFileMock: jest.Mock;
  let writeTextFileMock: jest.Mock;
  let mapSettings: MapSettings;
  let iconServiceMock: { getIconSizeSettings: jest.Mock };

  beforeEach(async () => {
    window.location = {
      ...window.location,
      reload: jest.fn(),
    };
    listenSpy = jest
      .spyOn(TauriEvent, "listen")
      .mockImplementation((_eventName, _handler) => Promise.resolve(jest.fn()));
    markerServiceMock = {
      getMarkerAMInArea: jest.fn(),
      updateMarker: jest.fn(),
    };
    mapSettings = {
      maxZoomLevel: 11,
    };

    readFileMock = (readFile as jest.Mock).mockImplementation(async (..._) => {
      const textEncoder = new TextEncoder();
      return Promise.resolve(textEncoder.encode(JSON.stringify(mapSettings)));
    });

    writeTextFileMock = (writeTextFile as jest.Mock).mockImplementation(
      async (fileName: string, settings: string, _: unknown) =>
        Promise.resolve((mapSettings = JSON.parse(settings))),
    );
    markerServiceMock.getMarkerAMInArea.mockResolvedValue([]);
    cardServiceMock = {
      createCard: jest.fn(),
      updateCard: jest.fn(),
      readCard: jest.fn(),
      readCardsPaginated: jest.fn(),
      deleteCard: jest.fn(),
      deleteMarker: jest.fn(),
    };
    iconServiceMock = { getIconSizeSettings: jest.fn() };
    iconServiceMock.getIconSizeSettings.mockResolvedValue(new Map());
    const StackStoreMock = {
      stacks$: from([]),
    };
    const activatedRouteStub = {
      snapshot: { queryParams: { longitude: 12, latitude: 12 } },
    };
    await TestBed.configureTestingModule({
      imports: [
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
        SettingService,
        OverviewMapService,
        { provide: ActivatedRoute, useValue: activatedRouteStub },
        { provide: StackStore, useValue: StackStoreMock },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(OverviewMapComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
    fixture.detectChanges();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should have mainLayerGroup property with mocked value", async () => {
    givenTheCard(testCardA);
    whenIClickAButton("add-new-card");
    await whenIClickTheMap();

    expect(cardServiceMock.createCard).toHaveBeenCalledWith({
      title: "",
      description: "",
      longitude: expect.any(Number),
      latitude: expect.any(Number),
      radius: 0,
      icon_name: "iconMiscRed",
    });
    expect(component.selectedLayerGroup.getLayers().length).toBe(1);
  });

  it("should delete selected card", async () => {
    givenTheCard(testCardA);
    whenIClickAButton("add-new-card");
    fixture.detectChanges();
    await whenIClickTheMap();

    await component.onDeleteSelectedCard();

    expect(cardServiceMock.deleteCard).toHaveBeenCalledWith(testCardA.id!);
    expect(component.selectedLayerGroup.getLayers()).toHaveLength(0);
    expect(component.mainLayerGroup.getLayers()).toHaveLength(0);
  });

  it("should persist changes to the max zoom level", async () => {
    whenIClickAButton("open-settings-menu-button");
    const newZoomLevel = "13";
    fixture.detectChanges();
    await whenIUseASlider("max-zoom-level-slider", newZoomLevel);
    await fixture.whenStable();
    expect(mapSettings).toEqual({
      maxZoomLevel: 13,
    });
  });

  it("should move existing marker", async () => {
    givenTheCard(testCardA);
    whenIClickAButton("add-new-card");
    await whenIClickTheMap();

    component.onMoveExistingMarker();
    await whenIClickTheMap();

    expect(cardServiceMock.updateCard).toHaveBeenCalled();
  });

  it("should not update icon size different icon types", async () => {
    givenTheCard(testCardA);
    whenIClickAButton("add-new-card");
    await whenIClickTheMap();
    component.onUpdateIconSize({
      iconType: "iconMiscBlack",
      iconSize: 40,
    });
    const layer: MarkerAM =
      component.selectedLayerGroup.getLayers()[0] as MarkerAM;
    expect((layer.getIcon().options as DivIconOptions).html).toMatch(
      "width: 20px; height: 20px",
    );
  });

  it("should update icon size of selected layer correctly", async () => {
    givenTheCard(testCardA);
    whenIClickAButton("add-new-card");
    await whenIClickTheMap();
    component.onUpdateIconSize({
      iconType: "iconMiscRed",
      iconSize: 40,
    });
    const layer: MarkerAM =
      component.selectedLayerGroup.getLayers()[0] as MarkerAM;
    expect((layer.getIcon().options as DivIconOptions).html).toMatch(
      "width: 40px; height: 40px",
    );
  });

  it("should update icon size of main layer correctly", async () => {
    givenTheCard(testCardA);
    whenIClickAButton("add-new-card");
    await whenIClickTheMap();

    whenIClickAButton("update-card-button");
    whenIClickAButton("close-update-sidebar");

    expect(component.selectedLayerGroup.getLayers()).toHaveLength(0);
    expect(
      component.overviewMapService.mainLayerGroup.getLayers(),
    ).toHaveLength(1);

    await component.onUpdateIconSize({
      iconType: "iconMiscRed",
      iconSize: 40,
    });
    const layer: MarkerAM = component.mainLayerGroup.getLayers()[0] as MarkerAM;
    expect((layer.getIcon().options as DivIconOptions).html).toContain(
      "width: 40px; height: 40px",
    );
  });

  it("should pan to marker and focus the map when listener receives signal", async () => {
    givenTheCard(testCardA);
    whenIClickAButton("add-new-card");
    await whenIClickTheMap();

    whenPanToSignalIsReceived(testCardA);
    expect(setWindowFocus).toHaveBeenCalled();
  });

  const testCardA: Card = {
    id: 1,
    title: "a",
    description: "a's description",
    latitude: 1,
    longitude: 1,
    radius: 0,
    icon_name: "iconMiscRed",
  };

  const givenTheCard = (card: Card) => {
    cardServiceMock.createCard.mockResolvedValue(card);
    cardServiceMock.readCard.mockResolvedValue(card);
  };

  const whenIClickAButton = (testId: string) => {
    fixture.detectChanges();
    const button = fixture.debugElement.query(
      By.css(`[data-testid="${testId}"]`),
    ).nativeElement;
    button.click();
  };

  const whenIClickTheMap = async () => {
    const map = fixture.debugElement.query(By.css("#map")).nativeElement;
    map.click();
    fixture.detectChanges();
  };

  const whenIUseASlider = async (testId: string, newSliderValue: string) => {
    const slider = fixture.debugElement.query(
      By.css(`[data-testid="${testId}"]`),
    ).nativeElement as HTMLInputElement;
    slider.value = newSliderValue;
    slider.dispatchEvent(new Event("input"));
    slider.dispatchEvent(new Event("dragEnd"));
    await fixture.whenStable();
    fixture.detectChanges();
  };
  const whenPanToSignalIsReceived = async (panToCard: Card) => {
    listenSpy.mock.calls[0][1]({
      payload: {
        lat: panToCard.latitude,
        lng: panToCard.longitude,
        id: panToCard.id,
      },
    });
  };
});

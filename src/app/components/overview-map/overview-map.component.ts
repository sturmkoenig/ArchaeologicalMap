import {
  AfterViewInit,
  Component,
  computed,
  NgZone,
  OnDestroy,
  OnInit,
  Signal,
  WritableSignal,
} from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { listen, UnlistenFn } from "@tauri-apps/api/event";
import { createCardDetailsWindow, setWindowFocus } from "@app/util/window-util";
import {
  LatLng,
  latLng,
  LayerGroup,
  Map as LeafletMap,
  MapOptions as LeafletMapOptions,
  tileLayer,
} from "leaflet";
import "leaflet.markercluster";
import { LocationCard, InfoCard, LocationData, Card } from "@app/model/card";
import { MapSettings, SettingService } from "@service/setting.service";
import { IconSizeSetting } from "@service/icon.service";
import { OverviewMapService } from "@service/overview-map.service";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { RightSidebarComponent } from "@app/layout/right-sidebar/right-sidebar.component";
import { CardInputComponent } from "@app/components/cards/card-input/card-input.component";
import { MapSettingsComponent } from "@app/components/overview-map/map-settings/map-settings.component";
import { MarkerInputComponent } from "@app/components/markers/marker-input/marker-input.component";
import { LeafletModule } from "@bluehalo/ngx-leaflet";
import { MatButtonModule } from "@angular/material/button";
import { MarkerAM } from "@app/model/markerAM";
import { MatIconModule } from "@angular/material/icon";
import { MatTooltipModule } from "@angular/material/tooltip";
import { MatDialog } from "@angular/material/dialog";
import { DeleteCardDialogComponent } from "./delete-card-dialog/delete-card-dialog.component";

@Component({
  imports: [
    RightSidebarComponent,
    CardInputComponent,
    MapSettingsComponent,
    MarkerInputComponent,
    LeafletModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
  ],
  selector: "app-overview-map",
  templateUrl: "overview-map.component.html",
  styleUrl: "overview-map.component.scss",
})
export class OverviewMapComponent implements OnInit, AfterViewInit, OnDestroy {
  position?: LatLng;
  mainLayerGroup: LayerGroup;
  selectedLayerGroup: LayerGroup;
  cursorStyle?: string;
  options: LeafletMapOptions = {
    layers: [
      tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        opacity: 0.7,
        maxZoom: 19,
        detectRetina: false,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }),
    ],
    zoom: 16,
    center: latLng(53.009325188114076, 13.160270365480752),
  };
  public map!: LeafletMap;
  public zoom!: number;
  updateCardVisible: boolean = false;
  settingsVisible: boolean = false;
  mapSettings?: MapSettings;
  unlistenPanTo: Promise<UnlistenFn>;
  selectedMarker: WritableSignal<MarkerAM | undefined>;
  cardMetadata: Signal<InfoCard | undefined>;
  editCard: Signal<LocationCard | undefined>;
  private panToMarkerId?: number;
  constructor(
    private route: ActivatedRoute,
    private ngZone: NgZone,
    private settingsService: SettingService,
    public overviewMapService: OverviewMapService,
    public dialog: MatDialog,
  ) {
    this.unlistenPanTo = listen(
      "panTo",
      async (panToEvent: {
        payload: { lat: number; lng: number; id: number };
      }) => {
        const point: LatLng = new LatLng(
          panToEvent.payload.lat,
          panToEvent.payload.lng,
        );
        this.panToMarkerId = panToEvent.payload.id;
        await setWindowFocus();
        this.map.flyTo(point, 14);
      },
    );

    listen(
      "addLocationToCard",
      async (event: {
        payload: {
          id: number;
          title: string;
          description: string;
          stackId?: number;
        };
      }) => {
        await setWindowFocus();
        this.updateCardVisible = true;
        console.log(this.map.getCenter());
        const cardToAdd: Card = {
          id: event.payload.id,
          title: event.payload.title,
          description: event.payload.description,
          stackId: event.payload.stackId,
          latitude: this.map.getCenter().lat,
          longitude: this.map.getCenter().lng,
          iconName: "iconMiscRed",
          radius: 0.0,
        };

        this.overviewMapService.changeSelectedMarker(
          new MarkerAM(this.map.getCenter(), {}, cardToAdd),
        );
        this.overviewMapService.updateEditCard(cardToAdd);
      },
    );
    this.cardMetadata = computed(() => ({
      title: this.editCard()?.title ?? "",
      description: this.editCard()?.description ?? "",
      stackId: this.editCard()?.stackId,
      regionImageId: this.editCard()?.regionImageId,
    }));
    this.mainLayerGroup = this.overviewMapService.mainLayerGroup;
    this.selectedLayerGroup = this.overviewMapService.selectedLayerGroup;
    this.selectedMarker = this.overviewMapService.selectedMarker;
    this.editCard = this.overviewMapService.editCard;
  }

  onGoToInfoPage() {
    const cardId = this.overviewMapService.editCard()?.id;
    if (!cardId) {
      return;
    }
    createCardDetailsWindow(cardId);
  }

  onAddNewCard() {
    this.cursorStyle = "crosshair";
    this.map.on("click", async (e) => {
      await this.overviewMapService.addNewCard(e.latlng);
      this.map.off("click");
      this.cursorStyle = undefined;
    });
  }

  async onDeleteSelectedCard() {
    const dialogRef = this.dialog.open(DeleteCardDialogComponent);

    dialogRef.afterClosed().subscribe(async (result) => {
      if (result === "deleteCard") {
        await this.overviewMapService.deleteEditCard();
      } else if (result === "deleteMarker") {
        const cardUpdated = {
          latitude: undefined,
          longitude: undefined,
          iconName: undefined,
          radius: undefined,
        };
        this.overviewMapService.updateEditCard(cardUpdated);
      }
    });
  }

  async onUpdateIconSize(iconSetting: IconSizeSetting) {
    await this.overviewMapService.updateIconSize(
      iconSetting.iconType,
      iconSetting.iconSize,
    );
  }

  async updateSelectedMarker(newMarker: LocationData) {
    this.overviewMapService.updateEditCard(newMarker);
  }

  onMoveExistingMarker() {
    this.ngZone.run(() => {
      this.cursorStyle = "crosshair";
    });
    this.map.on("click", (e) => {
      this.ngZone.run(() => {
        this.overviewMapService.moveSelectedMarker(e.latlng);
        this.map.off("click");
        this.cursorStyle = undefined;
      });
    });
  }

  updateSelectedCard(newCard: InfoCard) {
    this.overviewMapService.updateEditCard(newCard);
  }

  onMapReady(map: LeafletMap) {
    this.map = map;
    this.zoom = map.getZoom();
    this.map.addLayer(this.overviewMapService.radiusLayerGroup);
    this.map.addLayer(this.overviewMapService.selectedLayerGroup);
    this.map.addLayer(this.overviewMapService.mainLayerGroup);
    if (this.mapSettings?.initialMapBounds) {
      this.map.fitBounds(this.mapSettings.initialMapBounds);
    }
  }

  async mapMoveEnded() {
    if (!this.map) {
      return;
    }
    const bounds = this.map.getBounds();

    if (this.map.getZoom() < (this.mapSettings?.maxZoomLevel ?? 7)) {
      this.overviewMapService.resetMainLayerGroup();
      this.map.off("click");
      this.cursorStyle = "default";
      return;
    }
    await this.settingsService.updateMapSettings({
      initialMapBounds: this.map.getBounds(),
    });
    await this.overviewMapService.updateMapBounds(bounds, this.panToMarkerId);
    this.panToMarkerId = undefined;
  }

  ngAfterViewInit(): void {
    if (
      this.route.snapshot.queryParams["longitude"] &&
      this.route.snapshot.queryParams["latitude"]
    ) {
      this.position = new LatLng(
        this.route.snapshot.queryParams["latitude"],
        this.route.snapshot.queryParams["longitude"],
      );
      if (this.map) {
        this.map.panTo(this.position);
      }
    }
  }

  async ngOnDestroy(): Promise<void> {
    try {
      await this.unlistenPanTo;
    } catch (error) {
      console.error("Unable to unlisten to panToBounds listener", error);
    }
  }

  async ngOnInit() {
    await this.settingsService
      .getMapSettings()
      .then((settings: MapSettings) => {
        this.mapSettings = settings;
        this.overviewMapService.showLabels = !!settings.showLabels;
      });
    const appWindow = getCurrentWindow();
    await appWindow.setTitle("map");
    await appWindow.onCloseRequested(async () => {
      await this.settingsService.updateMapSettings({
        initialMapBounds: this.map.getBounds(),
      });
    });
  }

  async onMapSettingsChanged() {
    await this.settingsService.updateMapSettings({
      initialMapBounds: this.map.getBounds(),
    });
    window.location.reload();
  }
}

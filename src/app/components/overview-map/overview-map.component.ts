import {
  AfterViewInit,
  Component,
  computed,
  effect,
  NgZone,
  OnDestroy,
  OnInit,
  Signal,
  WritableSignal,
} from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { listen, UnlistenFn } from "@tauri-apps/api/event";
import { createCardDetailsWindow } from "@app/util/window-util";
import {
  LatLng,
  latLng,
  LatLngBounds,
  LayerGroup,
  Map as LeafletMap,
  MapOptions as LeafletMapOptions,
  MarkerClusterGroup,
  tileLayer,
} from "leaflet";
import "leaflet.markercluster";
import { Card, CardMetaData, LocationData } from "@app/model/card";
import { MapSettings, SettingService } from "@service/setting.service";
import { IconSizeSetting } from "@service/icon.service";
import { OverviewMapService } from "@service/overview-map.service";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { RightSidebarComponent } from "@app/layout/right-sidebar/right-sidebar.component";
import { CardInputComponent } from "@app/components/cards/card-input/card-input.component";
import { MapSettingsComponent } from "@app/components/overview-map/map-settings/map-settings.component";
import { MarkerInputComponent } from "@app/components/markers/marker-input/marker-input.component";
import { LeafletModule } from "@bluehalo/ngx-leaflet";
import { LeafletMarkerClusterModule } from "@bluehalo/ngx-leaflet-markercluster";
import { MatButton, MatFabButton } from "@angular/material/button";
import { MarkerAM } from "@app/model/markerAM";

@Component({
  standalone: true,
  imports: [
    RightSidebarComponent,
    CardInputComponent,
    MapSettingsComponent,
    MarkerInputComponent,
    LeafletModule,
    LeafletMarkerClusterModule,
    MatFabButton,
    MatButton,
  ],
  selector: "app-overview-map",
  templateUrl: "overview-map.component.html",
  styleUrl: "overview-map.component.scss",
})
export class OverviewMapComponent implements OnInit, AfterViewInit, OnDestroy {
  position?: LatLng;
  highlightedMarkerIds?: number[];
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
  unlistenPanToBounds: Promise<UnlistenFn>;
  selectedMarker: WritableSignal<MarkerAM | undefined>;
  cardMetadata: Signal<CardMetaData | undefined>;
  editCard: Signal<Card | undefined>;

  constructor(
    private route: ActivatedRoute,
    private ngZone: NgZone,
    private settingsService: SettingService,
    public overviewMapService: OverviewMapService,
  ) {
    this.unlistenPanTo = listen(
      "panTo",
      (panToEvent: { payload: { lat: number; lng: number; id: number } }) => {
        const point: LatLng = new LatLng(
          panToEvent.payload.lat,
          panToEvent.payload.lng,
        );
        this.highlightedMarkerIds = [panToEvent.payload.id];
        this.overviewMapService.highlightMarker([panToEvent.payload.id]);
        this.map.flyTo(point);
      },
    );
    this.cardMetadata = computed(() => ({
      title: this.editCard()?.title ?? "",
      description: this.editCard()?.description ?? "",
      stack_id: this.editCard()?.stack_id,
      region_image_id: this.editCard()?.region_image_id,
    }));

    effect(() => {
      console.log(this.cardMetadata());
    });

    this.unlistenPanToBounds = listen(
      "panToBounds",
      (panToBoundsEvent: {
        payload: {
          minLat: number;
          minLng: number;
          maxLat: number;
          maxLng: number;
          markerIds: number[];
        };
      }) => {
        const southWest: LatLng = new LatLng(
          panToBoundsEvent.payload.minLat,
          panToBoundsEvent.payload.minLng,
        );
        const northEast: LatLng = new LatLng(
          panToBoundsEvent.payload.maxLat,
          panToBoundsEvent.payload.maxLng,
        );
        const bounds: LatLngBounds = new LatLngBounds(southWest, northEast);
        this.map.flyToBounds(bounds);
        this.highlightedMarkerIds = panToBoundsEvent.payload.markerIds;
        this.overviewMapService.highlightMarker(this.highlightedMarkerIds);
      },
    );
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
    await this.overviewMapService.deleteEditCard();
  }

  async onUpdateIconSize(iconSetting: IconSizeSetting) {
    await this.overviewMapService.updateIconSize(
      iconSetting.iconType,
      iconSetting.iconSize,
    );
  }

  async updateSelectedMarker(newMarker: LocationData) {
    await this.overviewMapService.updateEditCard(newMarker);
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

  updateSelectedCard(newCard: CardMetaData) {
    this.overviewMapService.updateEditCard(newCard);
  }

  onMapReady(map: LeafletMap) {
    this.map = map;
    this.zoom = map.getZoom();
    this.map.addLayer(this.overviewMapService.radiusLayerGroup);
    this.map.addLayer(this.overviewMapService.selectedLayerGroup);
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
    await this.overviewMapService.updateMapBounds(bounds);
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
      await this.unlistenPanToBounds;
      await this.unlistenPanTo;
    } catch (error) {
      console.log("Unable to unlisten to panToBounds listener", error);
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

  markerClusterReady($event: MarkerClusterGroup) {
    this.overviewMapService.setMarkerClusterLayerGroup($event);
  }

  async onMapSettingsChanged() {
    await this.settingsService.updateMapSettings({
      initialMapBounds: this.map.getBounds(),
    });
    window.location.reload();
  }
}

import {
  AfterViewInit,
  Component,
  NgZone,
  OnInit,
  WritableSignal,
} from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { listen } from "@tauri-apps/api/event";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { createCardDetailsWindow } from "src/app/util/window-util";
import "leaflet.markercluster";
import {
  LatLng,
  LatLngBounds,
  LayerGroup,
  Map as LeafletMap,
  MapOptions as LeafletMapOptions,
  MarkerClusterGroupOptions,
  MarkerClusterGroup,
  latLng,
  tileLayer,
} from "leaflet";
import { CardDB, MarkerDB } from "src/app/model/card";
import { MapSettings, SettingService } from "src/app/services/setting.service";
import { MarkerService } from "../../services/marker.service";
import { MarkerAM } from "src/app/model/marker";
import { IconSizeSetting } from "src/app/services/icon.service";
import { OverviewMapService } from "src/app/services/overview-map.service";
const appWindow = getCurrentWebviewWindow();

@Component({
  selector: "app-overview-map",
  templateUrl: "overview-map.component.html",
  styleUrl: "overview-map.component.scss",
})
export class OverviewMapComponent implements OnInit, AfterViewInit {
  position?: LatLng;
  highligtedMarkerIds?: number[];
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
  markerClusterOptions?: MarkerClusterGroupOptions;
  selectedMarker: WritableSignal<MarkerAM | undefined>;
  editCard: WritableSignal<CardDB | undefined>;

  constructor(
    private markerService: MarkerService,
    private route: ActivatedRoute,
    private ngZone: NgZone,
    private settingsService: SettingService,
    public overviewMapService: OverviewMapService,
  ) {
    listen(
      "panTo",
      (panToEvent: { payload: { lat: number; lng: number; id: number } }) => {
        const point: LatLng = new LatLng(
          panToEvent.payload.lat,
          panToEvent.payload.lng,
        );
        this.highligtedMarkerIds = [panToEvent.payload.id];
        this.map.flyTo(point);
      },
    );
    listen(
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
        this.highligtedMarkerIds = panToBoundsEvent.payload.markerIds;
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
    this.overviewMapService.deleteEditCard();
  }

  onUpdateIconSize(iconSetting: IconSizeSetting) {
    this.overviewMapService.updateIconSize(
      iconSetting.iconType,
      iconSetting.iconSize,
    );
  }

  async onDeleteSelectedMarker() {
    if (!this.overviewMapService.selectedMarker()?.markerId) {
      throw new Error("marker does not exist");
    }

    this.overviewMapService.deleteSelectedMarker();
  }

  async updateSelectedMarker(newMarker: MarkerDB) {
    await this.markerService.updateMarker(newMarker).then(() => {
      this.overviewMapService.reloadSelectedMarker();
    });
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

  onAddNewMarkerToCard() {
    this.cursorStyle = "crosshair";
    this.map.on("click", async (e) => {
      if (!this.overviewMapService.selectedMarker()) {
        return;
      }
      await this.overviewMapService.addMarkerToSelectedCard(e.latlng);
      this.map.off("click");
      this.cursorStyle = undefined;
    });
  }

  updateSelectedCard(newCard: CardDB) {
    this.overviewMapService.updateEditCard(newCard);
    // TODO refresh state
  }

  onMapReady(map: LeafletMap) {
    this.map = map;
    this.zoom = map.getZoom();
    this.map.addLayer(this.overviewMapService.radiusLayerGroup);
    this.map.addLayer(this.overviewMapService.selectedLayerGroup);
    if (this.mapSettings?.initialMapBounds) {
      this.map.fitBounds(this.mapSettings?.initialMapBounds);
    }
  }

  async mapMoveEnded() {
    if (this.map == null) return;
    const bounds = this.map.getBounds();

    this.overviewMapService.updateMapBounds(bounds);
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
      this.map.panTo(this.position);
    }
  }

  async ngOnInit() {
    this.settingsService.getMapSettings().then((settings: MapSettings) => {
      this.mapSettings = settings;
      if (settings.maxClusterSize) {
        this.markerClusterOptions = {
          maxClusterRadius: settings.maxClusterSize,
        };
      } else {
        this.markerClusterOptions = {};
      }
    });
    await appWindow.setTitle("map");
    await appWindow.onCloseRequested(async () => {
      // persist card postion here
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

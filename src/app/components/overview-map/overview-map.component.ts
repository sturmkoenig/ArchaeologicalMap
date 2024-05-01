import {
  AfterViewInit,
  Component,
  NgZone,
  OnInit,
  WritableSignal,
} from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { listen } from "@tauri-apps/api/event";
import { WebviewWindow, appWindow } from "@tauri-apps/api/window";
import {
  LatLng,
  LatLngBounds,
  LatLngBoundsExpression,
  Layer,
  LayerGroup,
  Map as LeafletMap,
  MapOptions as LeafletMapOptions,
  latLng,
  tileLayer,
} from "leaflet";
import { CardDB, MarkerDB } from "src/app/model/card";
import { CardService } from "src/app/services/card.service";
import { SettingService } from "src/app/services/setting.service";
import { MarkerService } from "../../services/marker.service";
import { MarkerAM } from "src/app/model/marker";
import { IconSizeSetting } from "src/app/services/icon.service";
import { OverviewMapService } from "src/app/services/overview-map.service";

export interface mapCardMarker {
  card: CardDB;
  marker: MarkerDB;
  Layer: Layer;
}

@Component({
  selector: "app-overview-map",
  templateUrl: "overview-map.component.html",
  styleUrl: "overview-map.component.scss",
})
export class OverviewMapComponent implements OnInit, AfterViewInit {
  layers: Layer[] = [];
  position?: LatLng;
  highligtedMarkerIds?: number[];
  mainLayerGroup: LayerGroup;
  radiusLayerGroup: LayerGroup = new LayerGroup();
  selectedLayerGroup: LayerGroup;
  newCard?: CardDB;
  cursorStyle?: String;
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
  selectedMarker: WritableSignal<MarkerAM | undefined>;
  editCard: WritableSignal<CardDB | undefined>;

  constructor(
    private markerService: MarkerService,
    private route: ActivatedRoute,
    private ngZone: NgZone,
    private settingsService: SettingService,
    private cardService: CardService,
    public overviewMapService: OverviewMapService,
  ) {
    listen("panTo", (panToEvent: any) => {
      let point: LatLng = new LatLng(
        panToEvent.payload.lat,
        panToEvent.payload.lng,
      );
      this.highligtedMarkerIds = [panToEvent.payload.id];
      this.map.flyTo(point);
    });
    listen("panToBounds", (panToBoundsEvent: any) => {
      let southWest: LatLng = new LatLng(
        panToBoundsEvent.payload.minLat,
        panToBoundsEvent.payload.minLng,
      );
      let northEast: LatLng = new LatLng(
        panToBoundsEvent.payload.maxLat,
        panToBoundsEvent.payload.maxLng,
      );
      let bounds: LatLngBounds = new LatLngBounds(southWest, northEast);
      this.map.flyToBounds(bounds);
      this.highligtedMarkerIds = panToBoundsEvent.payload.markerIds;
    });
    this.mainLayerGroup = this.overviewMapService.mainLayerGroup;
    this.selectedLayerGroup = this.overviewMapService.selectedLayerGroup;
    this.selectedMarker = this.overviewMapService.selectedMarker;
    this.editCard = this.overviewMapService.editCard;
  }

  onGoToInfoPage() {
    if (!this.overviewMapService.editCard()?.id) {
      return;
    }

    const webview = new WebviewWindow(
      this.overviewMapService.editCard()!.id!.toString(),
      {
        url: "cards/details?id=" + this.overviewMapService.editCard()?.id!,
      },
    );
    webview.once("tauri://error", function (e) {
      console.error("window creation error: " + JSON.stringify(e));
      webview.emit("set-focus-to");
    });
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

  reloadMainLayerGroup() {
    this.overviewMapService.resetMainLayerGroup();
    this.mapMoveEnded();
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

  updateRadiusLayerGroup(newRadius: Layer | null) {
    this.radiusLayerGroup.clearLayers();
    if (newRadius !== null) {
      this.radiusLayerGroup.addLayer(newRadius);
    }
  }

  updateSelectedCard(newCard: CardDB) {
    this.overviewMapService.updateEditCard(newCard);
    // TODO refresh state
  }

  onMapReady(map: LeafletMap) {
    this.map = map;
    this.zoom = map.getZoom();
    this.map.addLayer(this.mainLayerGroup);
    this.map.addLayer(this.selectedLayerGroup);
  }

  mapChanged(emittedMap: LeafletMap) {
    this.map = emittedMap;
  }

  mapMoveEnded() {
    let bounds = this.map.getBounds();

    if (this.map.getZoom() < 7) {
      this.overviewMapService.resetMainLayerGroup();
      this.map.off("click");
      this.cursorStyle = "default";
      return;
    }
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
    this.settingsService
      .loadMapBoundingBox()
      .then((boundingBox: LatLngBoundsExpression | undefined) => {
        if (boundingBox) {
          this.map.fitBounds(boundingBox);
        }
      });
    appWindow.setTitle("map");
    appWindow.onCloseRequested(async () => {
      // persist card postion here
      await this.settingsService.saveMapBoundingBox(this.map.getBounds());
    });
  }
}

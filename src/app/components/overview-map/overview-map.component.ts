import { AfterViewInit, Component, NgZone, OnInit } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { emit, listen } from "@tauri-apps/api/event";
import { WebviewWindow, appWindow } from "@tauri-apps/api/window";
import {
  LatLng,
  LatLngBounds,
  LatLngBoundsExpression,
  Layer,
  LayerGroup,
  Map as LeafletMap,
  MapOptions as LeafletMapOptions,
  Marker,
  latLng,
  tileLayer,
} from "leaflet";
import { CardDB, MarkerDB } from "src/app/model/card";
import { MarkerDiff } from "src/app/components/overview-map/overview-map.logic";
import { CardService } from "src/app/services/card.service";
import { SettingService } from "src/app/services/setting.service";
import { CardMarkerLayer, MarkerService } from "../../services/marker.service";
import { ICONS } from "src/app/services/icon.service";
import { RightSidebarComponent } from "src/app/layout/right-sidebar/right-sidebar.component";

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
  previousMarkersInAreaIds?: number[];
  mainLayerGroup: LayerGroup = new LayerGroup();
  radiusLayerGroup: LayerGroup = new LayerGroup();
  selectedLayerGroup: LayerGroup = new LayerGroup();
  mapMarkerIdToLayer: { id: number; layer: Layer }[] = [];
  newCard?: CardDB;
  selectedMarkerMap?: CardMarkerLayer;
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

  constructor(
    private markerService: MarkerService,
    private route: ActivatedRoute,
    private ngZone: NgZone,
    private settingsService: SettingService,
    private cardService: CardService
  ) {
    listen("panTo", (panToEvent: any) => {
      let point: LatLng = new LatLng(
        panToEvent.payload.lat,
        panToEvent.payload.lng
      );
      this.highligtedMarkerIds = [panToEvent.payload.id];
      this.map.flyTo(point);
    });
    listen("panToBounds", (panToBoundsEvent: any) => {
      let southWest: LatLng = new LatLng(
        panToBoundsEvent.payload.minLat,
        panToBoundsEvent.payload.minLng
      );
      let northEast: LatLng = new LatLng(
        panToBoundsEvent.payload.maxLat,
        panToBoundsEvent.payload.maxLng
      );
      let bounds: LatLngBounds = new LatLngBounds(southWest, northEast);
      this.map.flyToBounds(bounds);
      this.highligtedMarkerIds = panToBoundsEvent.payload.markerIds;
    });
  }

  onGoToInfoPage() {
    if (
      !this.selectedMarkerMap ||
      !this.selectedMarkerMap.card ||
      !this.selectedMarkerMap.card.id
    ) {
      return;
    }
    console.log(
      "creating window with id: " + this.selectedMarkerMap.card!.id!.toString()
    );
    const webview = new WebviewWindow(
      this.selectedMarkerMap.card!.id!.toString(),
      {
        url: "cards/details?id=" + this.selectedMarkerMap.card!.id!,
      }
    );
    webview.once("tauri://error", function (e) {
      console.error("window creation error: " + JSON.stringify(e));
      webview.emit("set-focus-to");
    });
  }

  onAddNewCard() {
    this.cursorStyle = "crosshair";
    this.map.on("click", (e) => {
      let newMarker: MarkerDB = {
        icon_name: "iconMiscBlack",
        latitude: e.latlng.lat,
        longitude: e.latlng.lng,
        radius: 0.0,
      };
      let newCard: CardDB = {
        title: "",
        description: "",
        markers: [newMarker],
      };
      this.cardService.createCard(newCard).then((newCard: CardDB) => {
        this.ngZone.run(() => {
          if (!newCard || !newCard.markers || !newCard.markers[0]) {
            console.error("error creating card");
            this.map.off("click");
            this.cursorStyle = undefined;
            return;
          }
          let newMarker = newCard.markers[0];
          this.selectedMarkerMap = this.markerService.markerToMapLayer(
            newCard.markers[0],
            newCard
          );
          this.mapMarkerIdToLayer.push({
            id: newMarker.id!,
            layer: new Layer(),
          });
          this.updateSelectedMarker();
          this.map.off("click");
          this.cursorStyle = undefined;
        });
        this.reloadMainLayerGroup();
      });
    });
    // this.selectedMarkerMap = {card: newCard, marker: }
  }

  async onDeleteSelectedCard() {
    if (!this.selectedMarkerMap?.card || !this.selectedMarkerMap.card.id) {
      throw new Error("no card exists");
    }
    await this.cardService
      .deleteCard(this.selectedMarkerMap.card.id)
      .then(() => {
        this.reloadMainLayerGroup();
      });
  }

  reloadMainLayerGroup() {
    this.previousMarkersInAreaIds = [];
    this.map.removeLayer(this.mainLayerGroup);
    this.mainLayerGroup = new LayerGroup();
    this.map.addLayer(this.mainLayerGroup);
    this.mapMoveEnded();
  }

  async onDeleteSelectedMarker() {
    if (!this.selectedMarkerMap || !this.selectedMarkerMap.markerDB.id) {
      throw new Error("marker does not exist");
    }

    await this.cardService
      .deleteMarker(this.selectedMarkerMap!.markerDB.id)
      .then(() => {
        this.reloadMainLayerGroup();
      });
    this.selectedMarkerMap = undefined;
  }

  async updateSelectedMarker() {
    await this.cardService
      .updateCard(this.selectedMarkerMap!.card!, [
        this.selectedMarkerMap!.markerDB,
      ])
      .then(() => this.reloadMainLayerGroup());
  }

  onMoveExistingMarker() {
    this.ngZone.run(() => {
      this.cursorStyle = "crosshair";
    });
    this.map.on("click", (e) => {
      if (!this.selectedMarkerMap) {
        return;
      }
      this.selectedMarkerMap.markerDB.latitude = e.latlng.lat;
      this.selectedMarkerMap.markerDB.longitude = e.latlng.lng;
      this.updateSelectedMarker();
      this.map.off("click");
      this.ngZone.run(() => {
        this.cursorStyle = undefined;
      });
    });
  }

  onAddNewMarkerToCard() {
    this.cursorStyle = "crosshair";
    this.map.on("click", (e) => {
      if (!this.selectedMarkerMap) {
        return;
      }
      let newMarker: MarkerDB = {
        icon_name: "iconMiscBlack",
        latitude: e.latlng.lat,
        longitude: e.latlng.lng,
        radius: 0.0,
      };
      this.markerService
        .createNewMarker(this.selectedMarkerMap!.card!.id!, newMarker)
        .then((newMarker) => {
          if (
            !newMarker.id ||
            !this.selectedMarkerMap ||
            !this.selectedMarkerMap.card ||
            this.selectedMarkerMap.card.id !== newMarker.card_id
          ) {
            console.error(
              "new marker was not correctly created or selection changed"
            );
            return;
          }
          this.selectedMarkerMap!.markerDB = newMarker;
          this.mapMarkerIdToLayer.push({
            id: newMarker.id!,
            layer: new Layer(),
          });
          this.updateSelectedMarker();
          this.map.off("click");
          this.cursorStyle = undefined;
        });
    });
  }

  updateRadiusLayerGroup(newRadius: Layer | null) {
    this.map.removeLayer(this.radiusLayerGroup);
    this.radiusLayerGroup = new LayerGroup();
    if (newRadius !== null) {
      this.radiusLayerGroup.addLayer(newRadius);
    }
    this.map.addLayer(this.radiusLayerGroup);
  }

  updateSelectedCard(newCard: CardDB) {
    this.cardService.updateCard(newCard, []);
    this.previousMarkersInAreaIds = [];
    this.mapMarkerIdToLayer = [];
    this.mapMoveEnded();
  }

  onMapReady(map: LeafletMap) {
    this.map = map;
    this.zoom = map.getZoom();
    this.map.addLayer(this.mainLayerGroup);
  }

  mapChanged(emittedMap: LeafletMap) {
    this.map = emittedMap;
  }

  addRadiusLayer(radius: Layer | null) {
    if (radius !== null) {
      this.mainLayerGroup.addLayer(radius);
    }
  }

  makeNewMapElement(cardMarkerLayer: CardMarkerLayer) {
    this.mainLayerGroup.addLayer(cardMarkerLayer.marker);
    cardMarkerLayer.marker.addEventListener("click", () => {
      this.ngZone.run(() => this.changeSelectedMarkerMap(cardMarkerLayer));
    });

    this.mapMarkerIdToLayer.push({
      id: cardMarkerLayer.markerId,
      layer: cardMarkerLayer.marker,
    });

    this.createHoverCoordinateRadius(
      cardMarkerLayer.marker,
      cardMarkerLayer.radius
    );
  }

  removeRadiuslayer(radius: Layer | null) {
    if (radius !== null) {
      this.mainLayerGroup.removeLayer(radius);
    }
  }

  createHoverCoordinateRadius(marker: Marker, radius: Layer | null) {
    marker.on("mouseover", (e) => this.addRadiusLayer(radius));
    marker.on("mouseout", (e) => this.removeRadiuslayer(radius));
  }

  changeSelectedMarkerMap(selectedMarker: CardMarkerLayer) {
    this.reloadMainLayerGroup();
    // add special
    this.map.removeLayer(this.selectedLayerGroup);
    this.selectedLayerGroup = new LayerGroup();
    this.map.addLayer(this.selectedLayerGroup);
    selectedMarker.marker
      .addTo(this.selectedLayerGroup)
      .setOpacity(0)
      .openPopup();

    this.selectedMarkerMap = selectedMarker;
    if (this.selectedMarkerMap?.radius) {
      this.mainLayerGroup.removeLayer(this.selectedMarkerMap.radius);
      this.selectedMarkerMap.marker.off("mouseover");
      this.selectedMarkerMap.marker.off("mouseout");
      this.updateRadiusLayerGroup(this.selectedMarkerMap?.radius);
    }
  }

  mapMoveEnded() {
    let bounds = this.map.getBounds();

    if (this.map.getZoom() < 7) {
      this.map.removeLayer(this.mainLayerGroup);
      this.mainLayerGroup = new LayerGroup();
      this.map.addLayer(this.mainLayerGroup);
      this.previousMarkersInAreaIds = [];
      this.mapMarkerIdToLayer = [];
      return;
    }

    this.markerService
      .getMarkersInArea({
        north: bounds.getNorth(),
        east: bounds.getEast(),
        south: bounds.getSouth(),
        west: bounds.getWest(),
      })
      .subscribe((currentMarkersInArea) => {
        let currentMarkersInAreaIds = currentMarkersInArea.map(
          (marker: CardMarkerLayer) => marker.markerId
        );
        let markerDiff = MarkerDiff(
          currentMarkersInAreaIds,
          this.previousMarkersInAreaIds
        );
        let markerIdsToAdd = markerDiff.markerIdsToAdd;
        let markerIdsToRemove = markerDiff.markerIdsToRemove;

        this.mapMarkerIdToLayer
          .filter((markerMap) => markerIdsToRemove.indexOf(markerMap.id) > -1)
          .forEach((markerMap) => {
            this.mainLayerGroup.removeLayer(markerMap.layer);
          });

        this.mapMarkerIdToLayer = this.mapMarkerIdToLayer.filter(
          (markerMap) => markerIdsToRemove.indexOf(markerMap.id) < 0
        );

        currentMarkersInArea
          .filter((marker) => markerIdsToAdd.indexOf(marker.markerId) > -1)
          .forEach((marker) => this.makeNewMapElement(marker));

        this.previousMarkersInAreaIds = currentMarkersInAreaIds;
        // reset marker highlights
        this.mapMarkerIdToLayer.forEach(({ id, layer }) => {
          if (layer instanceof Marker) {
            let icon = layer.getIcon();
            icon.options.className = "";
            layer.setIcon(icon);
          }
        });

        this.mapMarkerIdToLayer
          .filter(({ id, layer }) => this.highligtedMarkerIds?.includes(id))
          .forEach(({ id, layer }) => {
            if (layer instanceof Marker) {
              let icon = layer.getIcon();
              icon.options.className = "highlighted";
              layer.setIcon(icon);
            }
          });
      });
  }

  ngAfterViewInit(): void {
    if (
      this.route.snapshot.queryParams["longitude"] &&
      this.route.snapshot.queryParams["latitude"]
    ) {
      this.position = new LatLng(
        this.route.snapshot.queryParams["latitude"],
        this.route.snapshot.queryParams["longitude"]
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

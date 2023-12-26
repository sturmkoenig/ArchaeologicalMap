import { AfterViewInit, Component, NgZone, OnInit } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { listen } from "@tauri-apps/api/event";
import { v4 as uuidv4 } from "uuid";
import { WebviewWindow, appWindow } from "@tauri-apps/api/window";
import {
  LatLng,
  LatLngBounds,
  LatLngBoundsExpression,
  Layer,
  LayerGroup,
  Map,
  MapOptions,
  Marker,
  latLng,
  tileLayer,
} from "leaflet";
import { CardDB, MarkerDB } from "src/app/model/card";
import { CardMarkerLayer, MarkerService } from "../../services/marker.service";
import { SettingService } from "src/app/services/setting.service";
import { IconService } from "src/app/services/icon.service";
import { CardService } from "src/app/services/card.service";

export interface mapCardMarker {
  card: CardDB;
  marker: MarkerDB;
  Layer: Layer;
}

@Component({
  selector: "app-overview-map",
  template: `
    <div class="overview-map--container">
      <div class="overview-map">
        <div
          class="map-container"
          [style]="{ cursor: cursorStyle }"
          leaflet
          [leafletOptions]="options"
          [leafletLayers]="layers"
          (leafletMapReady)="onMapReady($event)"
          (leafletMapMoveEnd)="mapMoveEnded()"
        ></div>
      </div>
      @if(selectedMarkerMap) { @if(!updateCardVisible){
      <div
        class="round-button__add button"
        (click)="updateCardVisible = !updateCardVisible"
      >
        <span color="accent" class="icon-add material-symbols-outlined">
          update
        </span>
      </div>
      } @else {
      <div class="crud-card--container">
        <div class="crud-card--container__toggle">
          <button
            mat-fab
            color="primary"
            aria-label="Example icon button with a delete icon"
            (click)="selectedMarkerMap = undefined; updateCardVisible = false"
          >
            <mat-icon>arrow_forward_ios </mat-icon>
          </button>
        </div>
        <div class="crud-card--container__update-card">
          <app-card-input
            [card]="selectedMarkerMap.card"
            (cardChange)="updateSelectedCard($event)"
          ></app-card-input>
          <app-marker-input
            [marker]="selectedMarkerMap.markerDB"
            (markerChange)="updateSelectedMarker()"
          ></app-marker-input>
          <span class="marker-input__buttons">
            <span class="marker-input__buttons--marker-options">
              <button
                mat-raised-button
                color="accent"
                (click)="onAddNewMarkerToCard()"
              >
                Neuer Marker
              </button>

              <button
                mat-raised-button
                color="accent"
                (click)="onMoveExistingMarker()"
              >
                Marker bewegen
              </button>
              <button
                mat-raised-button
                color="warn"
                (click)="onDeleteSelectedMarker()"
              >
                Marker Loeschen
              </button>
            </span>
            <button
              mat-raised-button
              color="primary"
              (click)="onGoToInfoPage()"
            >
              Info Seite
            </button>
            <button
              mat-raised-button
              color="warn"
              (click)="onDeleteSelectedCard()"
            >
              Karte Löschen
            </button>
          </span>
        </div>
      </div>
      } } @else {
      <div class="round-button__add button" (click)="onAddNewCard()">
        <span class="icon-add material-symbols-outlined"> add </span>
      </div>
      }
    </div>
  `,
  styles: [
    `
      .button {
        z-index: 1000;
      }
      .overview-map--container {
        display: flex;
        height: 100%;
        width: 100%;
        flex-direction: row;
      }
      .crud-card--container {
        position: relative;
        width: 400px;
        border-left: 10px solid #f3f4f4;
        &__update-card {
          height: 100%;
          width: 100%;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }
        &__toggle {
          position: absolute;
          width: 20px;
          top: 50%;
          z-index: 1000;
          transform: translateX(-30px);
        }
      }
      .overview-map {
        flex-grow: 1;
        overflow: hidden;
      }
      .fade-in {
        animation: ease-in 1s;
      }
      .map-container {
        width: 100%;
        height: 100%;
        // cursor: url("/assets/icons/misc_black_cursor.png"), pointer;
      }
      .marker-input {
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 2rem;
        &__buttons {
          width: 70%;
          &--marker-options {
            display: flex;
            // flex-wrap: wrap;
            gap: 10px;
          }
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
      }
      .bounce2 {
      }
      @keyframes fade {
        from {
          opacity: 1;
        }
        to {
          opacity: 0.5;
        }
      }

      :host ::ng-deep .highlighted {
        animation: fade 0.5s ease infinite alternate;
      }
    `,
  ],
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
  options: MapOptions = {
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
  public map!: Map;
  public zoom!: number;
  updateCardVisible: boolean = false;

  constructor(
    private markerService: MarkerService,
    private route: ActivatedRoute,
    private ngZone: NgZone,
    private settingsService: SettingService,
    private cardService: CardService
  ) {
    listen("panTo", (event: any) => {
      let point: LatLng = new LatLng(event.payload.lat, event.payload.lng);
      this.highligtedMarkerIds = [event.payload.id];
      this.map.flyTo(point);
    });
    listen("panToBounds", (event: any) => {
      let southWest: LatLng = new LatLng(
        event.payload.minLat,
        event.payload.minLng
      );
      let northEast: LatLng = new LatLng(
        event.payload.maxLat,
        event.payload.maxLng
      );
      let bounds: LatLngBounds = new LatLngBounds(southWest, northEast);
      this.map.flyToBounds(bounds);
      this.highligtedMarkerIds = event.payload.markerIds;
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
    const webview = new WebviewWindow(uuidv4(), {
      url: "cards/details?id=" + this.selectedMarkerMap.card!.id!,
    });
    webview.once("tauri://error", function (e) {
      console.error("window creation error: " + JSON.stringify(e));
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

  onMapReady(map: Map) {
    this.map = map;
    this.zoom = map.getZoom();
    this.map.addLayer(this.mainLayerGroup);
  }

  mapChanged(emittedMap: Map) {
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
        let markerDiff = this.markerDiff(
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

  markerDiff(
    currentMarkerIds: number[],
    previousMarkerIds?: number[]
  ): { markerIdsToAdd: number[]; markerIdsToRemove: number[] } {
    if (!previousMarkerIds) {
      return {
        markerIdsToAdd: currentMarkerIds,
        markerIdsToRemove: [],
      };
    }

    let markerIdsToRemove: number[] = previousMarkerIds.filter(
      (lastMarker) => currentMarkerIds.indexOf(lastMarker) < 0
    );
    let markerIdsToAdd: number[] = currentMarkerIds.filter(
      (newMarker) => previousMarkerIds.indexOf(newMarker) < 0
    );

    return {
      markerIdsToAdd: markerIdsToAdd,
      markerIdsToRemove: markerIdsToRemove,
    };
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

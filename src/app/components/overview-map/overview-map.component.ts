import { listen } from "@tauri-apps/api/event";
import { AfterViewInit, Component, OnInit } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import {
  Icon,
  LatLng,
  latLng,
  LatLngBounds,
  Layer,
  LayerGroup,
  Map,
  MapOptions,
  Marker,
  tileLayer,
} from "leaflet";
import { MarkerService } from "../../services/marker.service";
import { appWindow } from "@tauri-apps/api/window";
import { W } from "@tauri-apps/api/event-30ea0228";

export interface Compas {
  north: number;
  south: number;
  west: number;
  east: number;
}
@Component({
  selector: "app-overview-map",
  template: `
    <div class="overview-map">
      <div
        class="map-container"
        leaflet
        [leafletOptions]="options"
        [leafletLayers]="layers"
        (leafletMapReady)="onMapReady($event)"
        (leafletMapMoveEnd)="mapMoveEnded($event)"
      ></div>
    </div>
  `,
  styles: [
    `
      .overview-map {
        height: 100%;
        width: 100%;
        overflow: hidden;
      }
      .fade-in {
        animation: ease-in 1s;
      }
      .map-container {
        width: 100%;
        height: 100%;
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
  lastFetchedMarkerIds?: number[];
  layerGroup: LayerGroup = new LayerGroup();
  markerIdLayerMap: { id: number; layer: Layer }[] = [];
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

  constructor(
    private markerService: MarkerService,
    private route: ActivatedRoute
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

  onMapReady(map: Map) {
    this.map = map;
    this.zoom = map.getZoom();
    this.map.addLayer(this.layerGroup);
  }

  mapChanged(emittedMap: Map) {
    this.map = emittedMap;
  }

  createHoverCoordinateRadius(marker: Marker, radius: Layer | null) {
    marker.on("mouseover", (e) => {
      if (radius != null) {
        this.layerGroup.addLayer(radius);
      }
    });
    marker.on("mouseout", (e) => {
      if (radius !== null) {
        this.layerGroup.removeLayer(radius);
      }
    });
  }

  mapMoveEnded($event: any) {
    let bounds = this.map.getBounds();

    if (this.map.getZoom() < 7) {
      this.map.removeLayer(this.layerGroup);
      this.layerGroup = new LayerGroup();
      this.map.addLayer(this.layerGroup);
      this.lastFetchedMarkerIds = [];
      this.markerIdLayerMap = [];
      return;
    }
    this.markerService
      .getMarkersInArea({
        north: bounds.getNorth(),
        east: bounds.getEast(),
        south: bounds.getSouth(),
        west: bounds.getWest(),
      })
      .then((cardMarkers) => {
        let newFetchedMarkerIds = cardMarkers.map((marker) => marker.markerId);
        let markersToAdd: number[];
        let markersToRemove: number[];
        if (this.lastFetchedMarkerIds) {
          [markersToRemove, markersToAdd] = this.markerDiff(
            this.lastFetchedMarkerIds,
            newFetchedMarkerIds
          );
        } else {
          markersToAdd = newFetchedMarkerIds;
          markersToRemove = [];
        }
        this.markerIdLayerMap
          .filter((markerMap) => markersToRemove.indexOf(markerMap.id) > -1)
          .forEach((markerMap) => {
            this.layerGroup.removeLayer(markerMap.layer);
          });

        this.markerIdLayerMap = this.markerIdLayerMap.filter(
          (markerMap) => markersToRemove.indexOf(markerMap.id) < 0
        );

        cardMarkers
          .filter((marker) => markersToAdd.indexOf(marker.markerId) > -1)
          .forEach((marker) => {
            this.layerGroup.addLayer(marker.marker);
            this.markerIdLayerMap.push({
              id: marker.markerId,
              layer: marker.marker,
            });
            this.createHoverCoordinateRadius(marker.marker, marker.radius);
          });
        this.lastFetchedMarkerIds = newFetchedMarkerIds;
        // reset marker highlights
        this.markerIdLayerMap.forEach(({ id, layer }) => {
          if (layer instanceof Marker) {
            let icon = layer.getIcon();
            icon.options.className = "";
            layer.setIcon(icon);
          }
        });
        this.markerIdLayerMap
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
    lastFetchedMarkerIds: number[],
    newFetchedMarkerIds: number[]
  ): [number[], number[]] {
    let markersToRemove = lastFetchedMarkerIds.filter(
      (lastMarker) => newFetchedMarkerIds.indexOf(lastMarker) < 0
    );
    let markersToAdd = newFetchedMarkerIds.filter(
      (newMarker) => lastFetchedMarkerIds.indexOf(newMarker) < 0
    );
    return [markersToRemove, markersToAdd];
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

  ngOnInit(): void {
    appWindow.setTitle("map");
  }
}

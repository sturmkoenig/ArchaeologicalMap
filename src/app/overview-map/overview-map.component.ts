import { listen } from "@tauri-apps/api/event";
import { AfterViewInit, Component, OnInit } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import {
  LatLng,
  latLng,
  Layer,
  LayerGroup,
  Map,
  MapOptions,
  Marker,
  tileLayer,
} from "leaflet";
import { MarkerService } from "../services/marker.service";
import { appWindow } from "@tauri-apps/api/window";

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
        [leafletMarkerCluster]="layers"
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
    `,
  ],
})
export class OverviewMapComponent implements OnInit, AfterViewInit {
  layers: Layer[] = [];
  position?: LatLng;
  lastFetchedMarkerIds?: number[];
  layerGroup: LayerGroup = new LayerGroup();
  markerIdLayerMap: [number, Layer][] = [];
  options: MapOptions = {
    layers: [
      tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        opacity: 0.7,
        maxZoom: 19,
        detectRetina: true,
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
      this.panToLatLng(event.payload.lat, event.payload.lng);
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
          .filter((markerMap) => markersToRemove.indexOf(markerMap[0]) > -1)
          .forEach((markerMap) => {
            this.layerGroup.removeLayer(markerMap[1]);
          });

        this.markerIdLayerMap = this.markerIdLayerMap.filter(
          (markerMap) => markersToRemove.indexOf(markerMap[0]) < 0
        );

        cardMarkers
          .filter((marker) => markersToAdd.indexOf(marker.markerId) > -1)
          .forEach((marker) => {
            this.layerGroup.addLayer(marker.marker);
            this.markerIdLayerMap.push([marker.markerId, marker.marker]);
            this.createHoverCoordinateRadius(marker.marker, marker.radius);
          });
        this.lastFetchedMarkerIds = newFetchedMarkerIds;
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

  panToLatLng(lat: number, lng: number) {
    this.map.flyTo({ lat: lat, lng: lng });
  }
}

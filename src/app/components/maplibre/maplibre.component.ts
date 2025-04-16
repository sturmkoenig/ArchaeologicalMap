import { AfterViewInit, Component, ElementRef, ViewChild } from "@angular/core";
import { Map, Marker } from "maplibre-gl";
import { invoke } from "@tauri-apps/api/core";
import { Card } from "@app/model/card";
import { getIconPath, ICONS } from "@service/icon.service";

type Feature = {
  type: "Feature";
  properties: {
    message: string;
    iconSize: [number, number];
  };
  geometry: {
    type: "Point";
    coordinates: [number, number];
    iconSource: string;
  };
};

@Component({
  selector: "app-maplibre",
  imports: [],
  template: ` <div class="map-wrap">
    <div class="map" #map></div>
  </div>`,
  styles: [
    `
      .map-wrap {
        position: relative;
        width: 100%;
        height: calc(
          100vh - 77px
        ); /* calculate height of the screen minus the heading */
      }

      .map {
        position: absolute;
        width: 100%;
        height: 100%;
      }
    `,
  ],
})
export class MaplibreComponent implements AfterViewInit {
  map!: Map;
  constructor() {}
  @ViewChild("map")
  mapContainer!: ElementRef;

  ngAfterViewInit(): void {
    this.map = new Map({
      container: this.mapContainer.nativeElement,
      style: `https://demotiles.maplibre.org/style.json`,
    });
    this.map?.on("load", async () => {
      this.map?.addSource("osm", {
        type: "raster",
        tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
        tileSize: 256,
      });
      this.map?.addLayer({
        id: "osm-layer",
        type: "raster",
        source: "osm",
      });
      const cards = await invoke<Card[]>("read_cards", {});
      const features: Feature[] = cards.reduce<Feature[]>(
        (acc: Feature[], curr: Card) => [
          ...acc,
          {
            geometry: {
              coordinates: [curr.longitude, curr.latitude],
              type: "Point",
              iconSource: ICONS[curr.icon_name],
            },
            properties: { iconSize: [20, 20], message: "" },
            type: "Feature",
          },
        ],
        [],
      );
      const geoJson = {
        type: "FeatureCollection",
        features: features,
      };
      geoJson.features.forEach((marker) => {
        const el = document.createElement("div");
        el.className = "marker";
        el.style.backgroundImage = `url(${marker.geometry.iconSource})`;
        el.style.backgroundSize = "contain";
        el.style.width = `${marker.properties.iconSize[0]}px`;
        el.style.height = `${marker.properties.iconSize[1]}px`;

        el.addEventListener("click", () => {
          window.alert(marker.properties.message);
        });

        new Marker({ element: el })
          .setLngLat(marker.geometry.coordinates)
          .addTo(this.map);
      });
    });
  }
}

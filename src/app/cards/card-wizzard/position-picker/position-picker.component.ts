import { Component, Output, EventEmitter, Input } from "@angular/core";
import { MatCheckboxChange } from "@angular/material/checkbox";
import { Circle, Icon, LatLng, LeafletMouseEvent, Map, Marker } from "leaflet";
import { ICONS, IconService } from "src/app/services/icon.service";

@Component({
  selector: "app-position-picker",
  template: `
    <div class="flex flex-col  items-center">
      <div class="flex flex-row items-center justify-center">
        <div
          class="overview-map rounded-xl shadow-xl hover:shadow-2xl ease-in duration-300"
        >
          <app-map
            (map$)="onMapChanged($event)"
            [layers]="[]"
            (click$)="onClick($event)"
          ></app-map>
        </div>
        <div class="m-10">
          <mat-form-field appearance="fill" class="input">
            <mat-label>Lattitude</mat-label>
            <input
              matInput
              placeholder="Lattitude"
              [(ngModel)]="coordinate.lat"
            />
          </mat-form-field>
          <mat-form-field appearance="fill" class="input">
            <mat-label>Longitude</mat-label>
            <input
              matInput
              placeholder="Longitude"
              [(ngModel)]="coordinate.lng"
            />
          </mat-form-field>
          <mat-checkbox (change)="onExact($event)">Exakt</mat-checkbox>
          <mat-slider
            [disabled]="coordinateRadius === 0.0"
            [max]="1000"
            [min]="100"
          >
            <input
              matSliderThumb
              [ngModel]="coordinateRadius"
              (ngModelChange)="changeCircleRadius($event)"
            />
          </mat-slider>
        </div>
      </div>
    </div>
    <p>position-picker works!</p>
  `,
  styles: [
    `
      .overview-map {
        height: 300px;
        width: 300px;
        flex-shrink: 0;
        overflow: hidden;
      }
    `,
  ],
})
export class PositionPickerComponent {
  coordinate: LatLng = new LatLng(0, 0);
  @Output()
  coordinateChange: EventEmitter<LatLng> = new EventEmitter();
  coordinateRadius: number = 100;
  @Output()
  radiusChange: EventEmitter<number> = new EventEmitter();
  circle: Circle = new Circle(new LatLng(0, 0), {
    radius: this.coordinateRadius,
  });
  @Input()
  icon: keyof typeof ICONS;
  marker: Marker = new Marker(new LatLng(0, 0), {});
  map: Map;

  constructor(private iconService: IconService) {}

  onExact(checked: MatCheckboxChange): void {
    console.log("exact triggered");
    if (checked.checked) {
      this.changeCircleRadius(0);
      this.map.removeLayer(this.circle);
    } else {
      this.changeCircleRadius(100);
      this.map.addLayer(this.circle);
    }
  }
  setCoordinate(latlng: LatLng) {
    this.coordinate = latlng;
    this.marker.setLatLng(this.coordinate);
    this.circle.setLatLng(this.coordinate);
    this.coordinateChange.emit(this.coordinate);
  }

  onClick(event: LeafletMouseEvent) {
    this.map.removeLayer(this.marker);
    this.map.removeLayer(this.circle);
    this.setCoordinate(event.latlng);
    this.circle = new Circle(event.latlng, {
      radius: this.coordinateRadius,
    });
    console.log(this.icon);
    let icon = new Icon({
      iconUrl: this.iconService.getIconPath(this.icon).toString(),
      iconSize: [20, 20],
    });
    this.marker = new Marker(event.latlng, { icon });
    this.map.addLayer(this.marker);
    this.map.addLayer(this.circle);
  }

  changeCircleRadius(newRadius: number) {
    this.coordinateRadius = newRadius;
    this.circle.setRadius(newRadius);
    this.radiusChange.emit(newRadius);
  }

  onMapChanged(map$: Map) {
    this.map = map$;
  }
}

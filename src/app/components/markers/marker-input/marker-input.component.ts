import { Component, EventEmitter, Input, Output } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MarkerDB } from "src/app/model/card";
import { Marker } from "leaflet";
import { ICONS } from "src/app/services/icon.service";
import { MatSelectChange } from "@angular/material/select";
import { MatCheckboxChange } from "@angular/material/checkbox";

@Component({
  selector: "app-marker-input",
  standalone: false,
  template: `
    @if(this.marker){
    <div>
      <div class="marker-input">
        <mat-checkbox
          [checked]="marker.radius === 0.0"
          (change)="onExact($event)"
          >Exakt</mat-checkbox
        >
        <mat-slider [disabled]="marker.radius === 0.0" [max]="1000" [min]="100">
          <input
            matSliderThumb
            [ngModel]="marker.radius"
            (ngModelChange)="onChangeCircleRadius($event)"
          />
        </mat-slider>
        <mat-form-field>
          <mat-label>Icons</mat-label>
          <mat-select
            [(value)]="marker.icon_name"
            (selectionChange)="setIcon($event)"
          >
            <mat-option
              *ngFor="let iconOption of icons | keyvalue"
              [value]="iconOption.key"
            >
              <img class="option-icon" src="{{ iconOption.value }}" />
            </mat-option>
          </mat-select>
        </mat-form-field>
      </div>
    </div>
    }
  `,
  styles: `
        .marker-input {
          display: flex;
          flex-direction: column;
        }
        .option-icon {
          margin: auto;
          height: 2rem;
          width: 2rem;
        }
  
  `,
})
export class MarkerInputComponent {
  @Input()
  marker?: MarkerDB;
  @Output()
  markerChange: EventEmitter<MarkerDB> = new EventEmitter();
  @Output()
  markerMove: EventEmitter<boolean> = new EventEmitter();
  icons = ICONS;
  icon: keyof typeof ICONS = "iconMiscBlack";

  onAdd() {
    throw new Error("Method not implemented.");
  }

  setIcon(newIcon: MatSelectChange) {
    this.marker!.icon_name = newIcon.value;
    this.markerChange.emit(this.marker);
  }

  setRadius(radius: number) {
    this.marker!.radius = radius;
    this.markerChange.emit(this.marker);
  }

  onChangeCircleRadius(newRadius: number) {
    console.log("new radius: " + newRadius);
    this.setRadius(newRadius);
  }

  onExact(checked: MatCheckboxChange) {
    if (!this.marker) {
      return;
    }
    if (this.marker.radius === 0.0) {
      this.marker.radius = 100;
    } else {
      this.marker.radius = 0.0;
    }
    this.markerChange.emit(this.marker);
  }

  onMoveMarker() {
    this.markerMove.emit(true);
  }
}

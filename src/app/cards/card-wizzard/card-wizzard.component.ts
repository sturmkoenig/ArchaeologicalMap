import { Component } from "@angular/core";
import { circle, Circle, LatLng, LeafletMouseEvent, Marker } from "leaflet";
import { CardService } from "src/app/services/card.service";
import { Card, NewCard } from "src/app/model/card";
import { FormBuilder, Validators } from "@angular/forms";
import { ICONS } from "src/app/services/icon.service";

@Component({
  selector: "app-card-wizzard",
  template: `
    <div class="wizzard-container">
      <mat-stepper #stepper class="h-full">
        <mat-step
          [stepControl]="firstFormGroup"
          errorMessage="Name is required."
          class="h-full"
        >
          <form [formGroup]="firstFormGroup">
            <div class="flex flex-col items-center">
              <ng-template matStepLabel>Name und Beschreibung</ng-template>
              <mat-form-field class="w-[400px]" appearance="fill">
                <mat-label>Name</mat-label>
                <input
                  matInput
                  placeholder="Name"
                  formControlName="cardTitle"
                  required
                />
              </mat-form-field>
              <mat-form-field class="w-[400px]">
                <mat-label>Text</mat-label>
                <textarea
                  matInput
                  formControlName="cardText"
                  placeholder="Ex. It makes me feel..."
                ></textarea>
              </mat-form-field>
              <div>
                <button mat-button matStepperNext>Next</button>
              </div>
            </div>
          </form>
        </mat-step>
        <mat-step
          [stepControl]="secondFormGroup"
          errorMessage="Address is required."
        >
          <div class="flex flex-col items-center items-justify">
            <form [formGroup]="secondFormGroup">
              <ng-template matStepLabel>Icon Auswählen</ng-template>
              <app-icon-picker (icon)="changeIcon($event)"></app-icon-picker>
              <div class="m-t-5">
                <button mat-button matStepperPrevious>Back</button>
                <button mat-button matStepperNext>Next</button>
              </div>
            </form>
          </div>
        </mat-step>
        <mat-step>
          <ng-template matStepLabel>Position Auswählen</ng-template>
          <app-position-picker
            (radiusChange)="changeRadius($event)"
            (coordinateChange)="changeCoordinate($event)"
            [icon]="iconName"
          >
          </app-position-picker>
          <div class="m-t-5">
            <button mat-button matStepperPrevious>Back</button>
            <button mat-button (click)="stepper.reset()">Reset</button>
            <button mat-button (click)="submitCard()">Speichern</button>
          </div>
        </mat-step>
      </mat-stepper>
    </div>
  `,
  styles: [
    `
      .example-full-width {
        width: 100%;
        height: 200px;
      }
      .input {
        width: 100%;
      }
      .wizzard-container {
        padding: 20px;
      }
    `,
  ],
})
export class CardWizzardComponent {
  text: string = "example text";
  Longitude = 0;
  Lattitude = 0;
  circleRadius = 100;
  iconName: keyof typeof ICONS;

  firstFormGroup = this._formBuilder.group({
    cardTitle: ["", Validators.required],
    cardText: ["", Validators.required],
  });
  secondFormGroup = this._formBuilder.group({
    secondCtrl: ["", Validators.required],
  });

  public map!: L.Map;

  constructor(
    private _formBuilder: FormBuilder,
    private cardService: CardService
  ) {}

  submitCard() {
    console.log(this.iconName);
    let newCard: NewCard = {
      coordinate: {
        latitude: this.Lattitude,
        longitude: this.Longitude,
      },
      title: this.firstFormGroup.controls["cardTitle"].value!,
      description: this.firstFormGroup.controls["cardText"].value!,
      category: "",
      coordinateRadius: this.circleRadius,
      iconName: this.iconName,
    };
    this.cardService.cardCreate(newCard);
  }

  changeIcon(newIcon: keyof typeof ICONS) {
    this.iconName = newIcon;
  }
  changeRadius(newRadius: number) {
    this.circleRadius = newRadius;
  }
  changeCoordinate(newCoordinate: LatLng) {
    this.Lattitude = newCoordinate.lat;
    this.Longitude = newCoordinate.lng;
  }
}

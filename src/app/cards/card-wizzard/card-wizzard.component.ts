import { Component } from "@angular/core";
import { circle, Circle, LatLng, LeafletMouseEvent } from "leaflet";
import { CardService } from "src/app/services/card.service";
import { Card, NewCard } from "src/app/model/card";
import { FormBuilder, Validators } from "@angular/forms";

@Component({
  selector: "app-card-wizzard",
  template: `
    <div class="h-full m-10 !rounded-xl">
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
              <ng-template matStepLabel>Waehle die Kategoriern</ng-template>
              <div class="w-60">
                <mat-selection-list #shoes>
                  <mat-list-option> Kirche </mat-list-option>
                  <mat-list-option> Denkmahl </mat-list-option>
                  <mat-list-option> Grabung </mat-list-option>
                </mat-selection-list>
              </div>
              <div class="m-t-5">
                <button mat-button matStepperPrevious>Back</button>
                <button mat-button matStepperNext>Next</button>
              </div>
            </form>
          </div>
        </mat-step>
        <mat-step>
          <div class="flex flex-col  items-center">
            <div class="flex flex-row items-center justify-center">
              <ng-template matStepLabel>Position Auswaehlen</ng-template>
              <div
                class="overview-map rounded-xl shadow-xl hover:shadow-2xl ease-in duration-300"
              >
                <app-map
                  [layers]="[clicked]"
                  (click$)="onClick($event)"
                ></app-map>
              </div>
              <div class="m-10">
                <mat-form-field appearance="fill" class="input">
                  <mat-label>Lattitude</mat-label>
                  <input
                    matInput
                    placeholder="Lattitude"
                    [(ngModel)]="Lattitude"
                  />
                </mat-form-field>
                <mat-form-field appearance="fill" class="input">
                  <mat-label>Longitude</mat-label>
                  <input
                    matInput
                    placeholder="Longitude"
                    [(ngModel)]="Longitude"
                  />
                </mat-form-field>
                <mat-checkbox>Exakt</mat-checkbox>
                <mat-slider [max]="100" [min]="0">
                  <input
                    matSliderThumb
                    [ngModel]="circleRadius"
                    (ngModelChange)="changeCircleRadius($event)"
                  />
                </mat-slider>
              </div>
            </div>
            <div class="m-t-5">
              <button mat-button matStepperPrevious>Back</button>
              <button mat-button (click)="stepper.reset()">Reset</button>
              <button mat-button (click)="submitCard()">Speichern</button>
            </div>
          </div>
        </mat-step>
      </mat-stepper>
    </div>
  `,
  styles: [
    `
      .overview-map {
        height: 300px;
        width: 300px;
        flex-shrink: 0;
        overflow: hidden;
      }
      .example-full-width {
        width: 100%;
        height: 200px;
      }
      .input {
        width: 100%;
      }
    `,
  ],
})
export class CardWizzardComponent {
  text: string = "example text";
  Longitude = 0;
  Lattitude = 0;
  circleRadius = 10;
  clicked: Circle = new Circle(new LatLng(0, 0), { radius: this.circleRadius });

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

  onClick(event: LeafletMouseEvent) {
    this.Lattitude = event.latlng.lat;
    this.Longitude = event.latlng.lng;
    this.clicked = new Circle(event.latlng, { radius: this.circleRadius });
  }

  submitCard() {
    let newCard: NewCard = {
      coordinate: {
        latitude: this.Lattitude,
        longitude: this.Longitude,
      },
      title: this.firstFormGroup.controls["cardTitle"].value!,
      description: this.firstFormGroup.controls["cardText"].value!,
      category: "",
    };
    this.cardService.cardCreate(newCard);
  }
  changeCircleRadius(newRadius: number) {
    this.clicked.setRadius(newRadius);
  }
}

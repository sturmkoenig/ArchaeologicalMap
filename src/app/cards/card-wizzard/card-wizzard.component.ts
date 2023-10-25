import { Component } from "@angular/core";
import { circle, Circle, LatLng, LeafletMouseEvent, Marker } from "leaflet";
import { CardService } from "src/app/services/card.service";
import { MarkerDB, MarkerLatLng, NewCard } from "src/app/model/card";
import { FormBuilder, Validators } from "@angular/forms";
import { ICONS } from "src/app/services/icon.service";
import { MatSnackBar } from "@angular/material/snack-bar";

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
        <mat-step>
          <ng-template matStepLabel>Position Auswählen</ng-template>
          <app-position-picker [(markers)]="newMarkers" [editable]="true">
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
  iconName: keyof typeof ICONS = "iconMiscBlack";
  newMarkers: MarkerDB[] = [];

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
    private cardService: CardService,
    private _snackBar: MatSnackBar
  ) {}

  submitCard() {
    let newCard: NewCard = {
      markers: this.newMarkers,
      title: this.firstFormGroup.controls["cardTitle"].value!,
      description: this.firstFormGroup.controls["cardText"].value!,
    };
    this.cardService.createCard(newCard);
    this._snackBar.open("Karte Gespeichert", "💾");
  }
}

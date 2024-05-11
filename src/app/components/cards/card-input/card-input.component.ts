import {
  Component,
  Input,
  Output,
  EventEmitter,
  ViewChild,
  OnChanges,
  SimpleChanges,
} from "@angular/core";
import { CardDB } from "src/app/model/card";
import { StackStore } from "src/app/state/stack.store";
import { Observable } from "rxjs";
import { Stack } from "src/app/model/stack";
import { NgForm } from "@angular/forms";
import { MatDialog } from "@angular/material/dialog";
import { ImageCreateComponent } from "../../images/image-create/image-create.component";
import { ImageListComponent } from "../../images/image-list/image-list.component";
import { ImageEntity } from "src/app/model/image";
import { ImageService } from "src/app/services/image.service";

@Component({
  selector: "app-card-input",
  template: `
    @if (this.card) {
      <form class="card-input">
        <div class="card-image-editor">
          @if (image) {
            <img class="card-image-editor__image" [src]="image.imageSource" />
          } @else {
            <div class="card-image-editor__placeholder"></div>
          }
          <div class="card-image-editor__actions">
            <button mat-button color="primary" (click)="openNewImageDialog()">
              Neues Bild
            </button>
            <button
              mat-button
              color="primary"
              (click)="openExistingImageDialog()"
            >
              Existierendes Bild
            </button>
          </div>
        </div>

        <mat-form-field>
          <mat-label>Title:</mat-label>
          <input
            matInput
            [ngModel]="card.title"
            (ngModelChange)="onTitleChange($event)"
            [ngModelOptions]="{ standalone: true }"
          />
        </mat-form-field>
        <mat-form-field>
          <mat-label>Beschreibung:</mat-label>
          <input
            matInput
            [ngModel]="card.description"
            (ngModelChange)="onDescriptionChange($event)"
            [ngModelOptions]="{ standalone: true }"
          />
        </mat-form-field>
        <mat-form-field>
          <mat-label>Stapel:</mat-label>
          <mat-select
            [value]="card.stack_id"
            (valueChange)="onStackIdChange($event)"
            name="stack"
          >
            <mat-option
              *ngFor="let stack of stacks$ | async"
              [value]="stack.id"
            >
              {{ stack.name }}
            </mat-option>
          </mat-select>
        </mat-form-field>
      </form>
    }
  `,
  styles: `
    form {
      margin: 20px;
    }
    .card-image-editor {
      display: flex;
      flex-direction: row;
      margin: 20px;
      &__placeholder {
        width: 100px;
        height: 67px;
        background-color: #f3f3f3;
        border: 1px solid #e0e0e0;
      }

      &__image {
        width: 100px;
        height: 67px;
        object-fit: contain;
      }
      &__actions {
        display: flex;
        flex-direction: column;
      }
    }
    .card-header-image {
    }
    .card-input {
      display: flex;
      flex-direction: column;
    }
  `,
})
export class CardInputComponent implements OnChanges {
  @Input()
  card?: CardDB;

  @ViewChild("cardInput")
  cardForm?: NgForm;

  @Output()
  cardChange: EventEmitter<CardDB> = new EventEmitter();
  stacks$: Observable<Stack[]>;

  image?: ImageEntity;

  constructor(
    private stackStore: StackStore,
    public dialog: MatDialog,
    private imageService: ImageService,
  ) {
    this.stacks$ = stackStore.stacks$;
  }

  openNewImageDialog() {
    const dialogRef = this.dialog.open(ImageCreateComponent, {
      width: "520px",
    });
    dialogRef.afterClosed().subscribe((result: ImageEntity) => {
      this.image = result;
      this.card!.region_image_id = result.id;
      this.cardChange.emit(this.card);
    });
  }

  openExistingImageDialog() {
    const dialogRef = this.dialog.open(ImageListComponent, {
      width: "80%",
    });
    dialogRef.afterClosed().subscribe((result: ImageEntity) => {
      this.image = result;
      this.card!.region_image_id = result.id;
      this.cardChange.emit(this.card);
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    const newCard = changes["card"].currentValue;
    if (newCard.region_image_id) {
      this.imageService
        .readImage(newCard.region_image_id)
        .then((image: ImageEntity) => {
          this.image = image;
        });
    } else {
      this.image = undefined;
    }
    if (this.card && this.cardForm) {
      this.cardForm.valueChanges?.subscribe((_) => {
        this.cardChange.emit(this.card);
        if (this.card!.region_image_id) {
        }
      });
    }
  }
  onStackIdChange(newStackId: any) {
    this.card!.stack_id = newStackId;
    this.cardChange.emit(this.card);
  }

  onTitleChange(newTitle: string) {
    this.card!.title = newTitle;
    this.cardChange.emit(this.card);
  }

  onDescriptionChange(newDescription: string) {
    this.card!.description = newDescription;
    this.cardChange.emit(this.card);
  }
}

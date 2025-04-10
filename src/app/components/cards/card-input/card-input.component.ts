import {
  Component,
  effect,
  EventEmitter,
  input,
  Input,
  model,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild,
} from "@angular/core";
import { CardMetaData } from "@app/model/card";
import { StackStore } from "@app/state/stack.store";
import { Observable } from "rxjs";
import { Stack } from "@app/model/stack";
import { FormsModule, NgForm } from "@angular/forms";
import { MatDialog } from "@angular/material/dialog";
import { ImageCreateComponent } from "../../images/image-create/image-create.component";
import { ImageListComponent } from "../../images/image-list/image-list.component";
import { ImageEntity } from "@app/model/image";
import { ImageService } from "@service/image.service";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatButton } from "@angular/material/button";
import { MatSelectModule } from "@angular/material/select";
import { MatInputModule } from "@angular/material/input";
import { MatOptionModule } from "@angular/material/core";
import { AsyncPipe, NgForOf } from "@angular/common";

@Component({
  standalone: true,
  imports: [
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatOptionModule,
    FormsModule,
    AsyncPipe,
    MatButton,
    NgForOf,
  ],
  selector: "app-card-input",
  template: `
    @if (this.card()) {
      <form class="card-input">
        <div class="card-image-editor">
          @if (image) {
            <img
              class="card-image-editor__image"
              [src]="image.imageSource"
              alt="image of the card"
            />
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
            [ngModel]="card().title"
            (ngModelChange)="onTitleChange($event)"
            [ngModelOptions]="{ standalone: true }"
          />
        </mat-form-field>
        <mat-form-field>
          <mat-label>Beschreibung:</mat-label>
          <input
            matInput
            [ngModel]="card().description"
            (ngModelChange)="onDescriptionChange($event)"
            [ngModelOptions]="{ standalone: true }"
          />
        </mat-form-field>
        <mat-form-field>
          <mat-label>Stapel:</mat-label>
          <mat-select
            [value]="card().stack_id"
            (valueChange)="onStackIdChange($event)"
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
export class CardInputComponent {
  card = model.required<CardMetaData>();
  stacks$: Observable<Stack[]>;
  image?: ImageEntity;

  constructor(
    private stackStore: StackStore,
    public dialog: MatDialog,
    private imageService: ImageService,
  ) {
    this.stacks$ = stackStore.stacks$;
    effect(() => {
      this.imageService
        .readImage(this.card().region_image_id)
        .then((image: ImageEntity) => {
          this.image = image;
        });
    });
    effect(() => {
      console.log("Hi from insert", this.card());
    });
  }

  cloneCard(card: CardMetaData, override: Partial<CardMetaData>): CardMetaData {
    return { ...card, ...override };
  }

  openNewImageDialog() {
    const dialogRef = this.dialog.open(ImageCreateComponent, {
      width: "520px",
    });
    dialogRef.afterClosed().subscribe((result: ImageEntity) => {
      this.image = result;
      this.card().region_image_id = result.id;
    });
  }

  openExistingImageDialog() {
    const dialogRef = this.dialog.open(ImageListComponent, {
      width: "80%",
    });
    dialogRef.afterClosed().subscribe((image: ImageEntity) => {
      this.image = image;
      this.card.update((card) =>
        this.cloneCard(card, { region_image_id: image.id }),
      );
    });
  }

  onStackIdChange(newStackId: number) {
    this.card.update((card) => this.cloneCard(card, { stack_id: newStackId }));
  }

  onTitleChange(newTitle: string) {
    this.card.update((card) => this.cloneCard(card, { title: newTitle }));
  }

  onDescriptionChange(newDescription: string) {
    this.card.update((card) =>
      this.cloneCard(card, { description: newDescription }),
    );
  }
}

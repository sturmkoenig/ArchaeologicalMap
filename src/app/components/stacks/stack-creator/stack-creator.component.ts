import { Component, inject, model, NgZone, OnInit } from "@angular/core";
import { Event } from "@tauri-apps/api/event";
import { BehaviorSubject } from "rxjs";
import { StackStore } from "@app/state/stack.store";
import { DragDropEvent } from "@tauri-apps/api/webview";
import { MAT_DIALOG_DATA, MatDialogModule } from "@angular/material/dialog";
import { CommonModule } from "@angular/common";
import { MatFormFieldModule } from "@angular/material/form-field";
import { FormsModule } from "@angular/forms";
import { MatCardModule } from "@angular/material/card";
import { MatInputModule } from "@angular/material/input";
import { MatButtonModule } from "@angular/material/button";
import { ImageService } from "@service/image.service";
import { WindowService } from "@service/window.service";

@Component({
  imports: [
    MatCardModule,
    MatDialogModule,
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    FormsModule,
  ],
  selector: "app-stack-creator",
  template: `
    <div class="stack_creator">
      <div class="stack_creator__creator">
        <div>
          <h1 mat-dialog-title>Karten Stack anlegen</h1>
          <div mat-dialog-content>
            <mat-form-field class="example-full-width">
              <mat-label>Stack Name</mat-label>
              <input
                matInput
                data-testid="name-input"
                placeholder=""
                [(ngModel)]="stackName"
              />
            </mat-form-field>
          </div>
        </div>

        <div class="card-container">
          <mat-card class="card">
            <mat-card-header>
              <div mat-card-avatar class="example-header-image"></div>
              <mat-card-title>{{ stackName() }}</mat-card-title>
            </mat-card-header>
            <img
              *ngIf="fileUrl$ | async as fileUrl"
              class="card__image"
              mat-card-image
              src="{{ this.imageService.convertFileSrc(fileUrl) }}"
              alt="stack header image"
            />
            <mat-card-content></mat-card-content>
          </mat-card>
        </div>
      </div>
      <div mat-dialog-actions>
        <button mat-button mat-dialog-close>Abbrechen</button>
        <button
          mat-button
          mat-dialog-close
          data-testid="save-button"
          (click)="onSaveStack()"
        >
          Speichern
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      .stack_creator {
        display: flex;
        flex-direction: column;
        margin: 20px;
        &__creator {
          display: flex;
        }
      }
      .stack_creator__preview {
        margin: 20px;
      }

      .card-container {
        width: 200px;
        height: 300px;
      }
      .card {
        height: 300px;
        display: flex;

        &__image {
          max-height: 100px;
          object-fit: cover;
        }
      }
    `,
  ],
})
export class StackCreatorComponent implements OnInit {
  stackId?: number;
  stackName = model<string>("");
  fileName = model<string>("");
  fileUrl$: BehaviorSubject<string> = new BehaviorSubject("");
  data = inject(MAT_DIALOG_DATA);

  constructor(
    private stackStore: StackStore,
    private ngZone: NgZone,
    public imageService: ImageService,
    private windowService: WindowService,
  ) {}

  async ngOnInit() {
    await this.windowService.handleDragDropEvent(async (event) => {
      await this.ngZone.run(async () => {
        if (event.payload.type === "drop") {
          await this.fileBrowseHandler(event);
        }
      });
    });
    if (this.data?.stack) {
      this.stackId = this.data.stack.id;
      this.stackName.set(this.data.stack.name);
      this.fileName.set(this.data.stack.image_name);
    }
  }

  async fileBrowseHandler(event: Event<DragDropEvent>) {
    if (event.payload !== null && event.payload.type === "drop") {
      const imageMetaData = await this.imageService.moveImageToAppDir(
        event.payload.paths[0],
      );

      this.fileUrl$.next(imageMetaData.imagePath);
      this.fileName.set(imageMetaData.imageName);
    }
  }

  onSaveStack() {
    if (this.stackId) {
      this.stackStore.updateStack({
        id: this.stackId,
        name: this.stackName(),
        image_name: this.fileName(),
      });
    } else {
      this.stackStore.createStack({
        name: this.stackName(),
        image_name: this.fileName(),
      });
    }
  }
}

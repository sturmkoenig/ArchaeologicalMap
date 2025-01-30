import { Component, NgZone } from "@angular/core";
import { path } from "@tauri-apps/api";
import { convertFileSrc } from "@tauri-apps/api/core";
import { Event } from "@tauri-apps/api/event";
import { v4 as uuid } from "uuid";
import { BehaviorSubject } from "rxjs";
import { StackStore } from "@app/state/stack.store";
import * as fs from "@tauri-apps/plugin-fs";
import { DragDropEvent, getCurrentWebview } from "@tauri-apps/api/webview";

@Component({
  selector: "app-stack-creator",
  template: `
    <div class="stack_creator">
      <div class="stack_creator__creator">
        <h1 mat-dialog-title>Karten Stack anlegen</h1>
        <div mat-dialog-content>
          <mat-form-field class="example-full-width">
            <mat-label>Stack Name</mat-label>
            <input matInput placeholder="" [(ngModel)]="stackName" />
          </mat-form-field>
          <div mat-dialog-actions>
            <button mat-button mat-dialog-close>Abbrechen</button>
            <button mat-button mat-dialog-close (click)="onSaveStack()">
              Speichern
            </button>
          </div>
        </div>
      </div>

      <div class="card-container">
        <mat-card class="card">
          <mat-card-header>
            <div mat-card-avatar class="example-header-image"></div>
            <mat-card-title>{{ stackName }}</mat-card-title>
          </mat-card-header>
          <img
            *ngIf="fileUrl$ | async as fileUrl"
            class="card__image"
            mat-card-image
            src="{{ convertFileSrc(fileUrl) }}"
            alt="stack header image"
          />
          <mat-card-content></mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [
    `
      .stack_creator {
        display: flex;
        flex-direction: row;
        margin: 20px;
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
export class StackCreatorComponent {
  stackName: string = "";
  fileName: string = "";
  fileUrl$: BehaviorSubject<string> = new BehaviorSubject("");

  constructor(
    private stackStore: StackStore,
    private ngZone: NgZone,
  ) {
    getCurrentWebview().onDragDropEvent((event) => {
      this.ngZone.run(async () => {
        if (event.payload.type === "drop") {
          await this.fileBrowseHandler(event);
        }
      });
    });
  }

  async fileBrowseHandler(event: Event<DragDropEvent>) {
    if (event.payload !== null && event.payload.type === "drop") {
      const dataDir = await path.appDataDir();
      const filePath: string = event.payload.paths[0];
      const fileEnding = filePath.substring(filePath.lastIndexOf(".") + 1);
      const newFileName = uuid() + "." + fileEnding;

      const copyPath = await path.join(
        dataDir,
        "content",
        "images",
        newFileName,
      );
      await fs.copyFile(event.payload.paths[0], copyPath);
      this.fileUrl$.next(copyPath);
      this.fileName = newFileName;
    }
  }

  onSaveStack() {
    if (this.stackName === "" || this.fileName === "") {
      return;
    }
    this.stackStore.createStack({
      name: this.stackName,
      image_name: this.fileName,
    });
  }

  protected readonly convertFileSrc = convertFileSrc;
}

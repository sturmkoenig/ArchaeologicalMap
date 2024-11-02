import { Component, NgZone } from "@angular/core";
import { path } from "@tauri-apps/api";
import { convertFileSrc } from "@tauri-apps/api/core";
import { listen, TauriEvent, Event } from "@tauri-apps/api/event";
import { v4 as uuid } from "uuid";
import { BehaviorSubject } from "rxjs";
import { StackStore } from "src/app/state/stack.store";
import * as fs from "@tauri-apps/plugin-fs";
import { DragDropEvent } from "@tauri-apps/api/webview";

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

      <mat-card class="stack_creator__preview">
        <mat-card-header>
          <mat-card-title>{{ stackName }}</mat-card-title>
        </mat-card-header>
        <img
          *ngIf="fileUrl | async"
          mat-card-image
          ngSrc="fileUrl | async"
          alt="stack header image"
          fill
        />
        <mat-card-content></mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [
    `
      .stack_creator {
        display: flex;
        flex-direction: row;
      }
      .stack_creator__preview {
        margin: 20px;
        width: 200px;
      }
    `,
  ],
})
export class StackCreatorComponent {
  stackName: string = "";
  fileName: string = "";
  fileUrl: BehaviorSubject<string> = new BehaviorSubject("");

  constructor(
    private stackStore: StackStore,
    private ngZone: NgZone,
  ) {
    listen<DragDropEvent>(
      TauriEvent.DRAG_DROP,
      (event: Event<DragDropEvent>) => {
        this.ngZone.run(() => this.fileBrowseHandler(event));
      },
    );
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
      const fileUrl = convertFileSrc(copyPath);
      this.fileUrl.next(fileUrl);
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
}

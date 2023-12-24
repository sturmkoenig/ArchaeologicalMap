import { ChangeDetectorRef, Component, Inject, NgZone } from "@angular/core";
import { MAT_DIALOG_DATA } from "@angular/material/dialog";
import { fs, path } from "@tauri-apps/api";
import { convertFileSrc } from "@tauri-apps/api/tauri";
import { listen } from "@tauri-apps/api/event";
import { v4 as uuid } from "uuid";
import { StackService } from "src/app/services/stack.service";
import { BehaviorSubject, Observable } from "rxjs";
import { StackStore } from "src/app/state/stack.store";

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
            <button
              mat-button
              mat-dialog-close
              cdkFocusInitial
              (click)="onSaveStack()"
            >
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
          [src]="fileUrl | async"
          alt="stack header image"
        />
        <mat-card-content> </mat-card-content>
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
    @Inject(MAT_DIALOG_DATA) public data: any,
    private stackStore: StackStore,
    private changeDetectorRef: ChangeDetectorRef,
    private ngZone: NgZone
  ) {
    listen("tauri://file-drop", (event) => {
      this.ngZone.run(() => this.fileBrowseHandler(event));
    });
  }

  async fileBrowseHandler(arg0: any) {
    if (arg0.payload !== null || arg0.payload !== undefined) {
      let dataDir = await path.appDataDir();
      let filePath: string = arg0.payload[0];
      let fileEnding = filePath.substring(filePath.lastIndexOf(".") + 1);
      let newFileName = uuid() + "." + fileEnding;

      let copyPath = await path.join(dataDir, "content", "images", newFileName);
      await fs.copyFile(arg0.payload[0], copyPath);
      let fileUrl = convertFileSrc(copyPath);
      this.fileUrl.next(fileUrl);
      this.fileName = newFileName;
    }
  }

  onAbort() {
    throw new Error("Method not implemented.");
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

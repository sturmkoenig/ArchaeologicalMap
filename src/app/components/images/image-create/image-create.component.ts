import { Component, NgZone } from "@angular/core";
import { open } from "@tauri-apps/plugin-dialog";
import { MatIconModule } from "@angular/material/icon";
import { NgClass, NgIf } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { getCurrentWebview } from "@tauri-apps/api/webview";
import { MatInputModule } from "@angular/material/input";
import { convertFileSrc } from "@tauri-apps/api/core";
import {
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from "@angular/material/dialog";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatSnackBar } from "@angular/material/snack-bar";
import { ImageService } from "@service/image.service";

@Component({
  selector: "app-image-create",
  imports: [
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    MatButtonModule,
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatDialogClose,
    MatIconModule,
    NgIf,
    NgClass,
  ],
  templateUrl: "./image-create.component.html",
  styleUrl: "./image-create.component.scss",
})
export class ImageCreateComponent {
  image?: string;
  imageDisplay?: string;
  title: string = "";
  description: string = "";
  isHovered: boolean = false;

  constructor(
    private ngZone: NgZone,
    private imageService: ImageService,
    public dialogRef: MatDialogRef<ImageCreateComponent>,
    private _snackBar: MatSnackBar,
  ) {
    getCurrentWebview().onDragDropEvent((event) => {
      this.ngZone.run(async () => {
        if (event.payload.type === "drop") {
          await this.createImage(event.payload.paths);
          this.isHovered = false;
        } else if (event.payload.type === "enter") {
          this.isHovered = true;
        } else if (event.payload.type === "leave") {
          this.isHovered = false;
        }
      });
    });
  }

  async openFileBrowser() {
    const selected = await open({
      multiple: false,
      filters: [{ name: "Images", extensions: ["jpg", "png", "gif"] }],
    });
    if (typeof selected !== "string") {
      return;
    }
    this.image = selected;
    this.imageDisplay = convertFileSrc(selected);
  }

  async onSaveImage() {
    if (this.image === null || this.image === undefined) {
      return;
    }
    await this.imageService
      .createImage({
        name: this.title,
        image: this.image,
      })
      .then((imageId) => {
        this.imageService.readImage(imageId).then((image) => {
          this.dialogRef.close(image);
        });
      })
      .catch((error: Error) => {
        this._snackBar.open(
          `Fehler beim Bild Anlegen ${JSON.stringify(error)}`,
          "Close",
          {
            duration: 4000,
          },
        );
      });
  }

  async createImage(filePath: string[]): Promise<void> {
    if (filePath.length !== 0) {
      this.image = filePath[0];
      this.imageDisplay = convertFileSrc(filePath[0]);
    }
  }
}

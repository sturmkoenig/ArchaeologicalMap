import { Component, NgZone, OnInit } from "@angular/core";
import { listen } from "@tauri-apps/api/event";
import { open } from "@tauri-apps/api/dialog";
import { MatIconModule } from "@angular/material/icon";
import { NgIf } from "@angular/common";
import { ImageService } from "src/app/services/image.service";
import { FormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatInputModule } from "@angular/material/input";
import { convertFileSrc } from "@tauri-apps/api/tauri";
import {
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogTitle,
} from "@angular/material/dialog";
import { MatFormFieldModule } from "@angular/material/form-field";

@Component({
  selector: "app-image-create",
  standalone: true,
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
  ],
  templateUrl: "./image-create.component.html",
  styleUrl: "./image-create.component.css",
})
export class ImageCreateComponent implements OnInit {
  image?: string;
  imageDisplay?: any;
  title: string = "";
  description: string = "";

  constructor(
    private ngZone: NgZone,
    private imageService: ImageService,
  ) {
    listen("tauri://file-drop", (event) => {
      this.ngZone.run(() => this.fileBrowseHandler(event));
    });
  }
  async ngOnInit(): Promise<void> {}

  async openFileBroser() {
    const selected = await open({
      multiple: false,
      filters: [{ name: "Images", extensions: ["jpg", "png", "gif"] }],
    });
    console.log(selected);
    if (typeof selected !== "string") {
      return;
    }
    if (selected !== null || selected !== undefined) {
      this.image = selected;
      this.imageDisplay = convertFileSrc(selected);
      console.log(this.imageDisplay);
    }
  }

  async onSaveImage() {
    if (this.image === null || this.image === undefined) {
      return;
    }
    await this.imageService.createImage({
      name: this.title,
      image: this.image,
    });
  }

  async fileBrowseHandler(arg0: any) {
    if (arg0.payload !== null || arg0.payload !== undefined) {
      // do something with the file
      console.log(Array.isArray(arg0.payload));
      if (typeof arg0.payload === "string") {
        this.image = arg0.payload;
        this.imageDisplay = convertFileSrc(arg0.payload);
      } else if (Array.isArray(arg0.payload)) {
        console.log(arg0.payload[0]);
        this.image = arg0.payload[0];
        this.imageDisplay = convertFileSrc(arg0.payload[0]);
      }
    }
  }
}

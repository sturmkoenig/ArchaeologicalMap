import { AsyncPipe, NgForOf } from "@angular/common";
import { Component, Inject, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { MatButton, MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatPaginatorModule } from "@angular/material/paginator";
import { MatSnackBar } from "@angular/material/snack-bar";
import { Subject, debounceTime } from "rxjs";
import { ImageEntity } from "src/app/model/image";
import { ImageService } from "src/app/services/image.service";

@Component({
  selector: "app-image-list",
  standalone: true,
  imports: [
    MatCardModule,
    AsyncPipe,
    NgForOf,
    MatButton,
    MatPaginatorModule,
    MatInputModule,
    MatFormFieldModule,
    MatIconModule,
    FormsModule,
    MatButtonModule,
  ],
  providers: [ImageService],
  templateUrl: "./image-list.component.html",
  styleUrl: "./image-list.component.scss",
})
export class ImageListComponent implements OnInit {
  images: ImageEntity[] = [];
  numberOfImages: number = 0;
  itemsPerPage: number = 100;
  pageIndex: number = 0;
  titleFilter: Subject<string> = new Subject<string>();
  filter: string = "";

  constructor(
    public dialogRef: MatDialogRef<ImageListComponent>,
    private imageService: ImageService,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private _snackBar: MatSnackBar,
  ) {}

  ngOnInit() {
    this.imageService
      .readImagesPaginated(this.pageIndex, this.itemsPerPage)
      .then((result) => {
        this.images = result[0];
        this.numberOfImages = result[1];
      });
    this.titleFilter.pipe(debounceTime(200)).subscribe((filter) => {
      this.filter = filter;
      this.pageIndex = 0;
      this.updatePage();
    });
  }
  updatePage() {
    this.imageService
      .readImagesPaginated(this.pageIndex, this.itemsPerPage, this.filter)
      .then((result) => {
        this.images = result[0];
        this.numberOfImages = result[1];
      });
  }

  onSelectImage(image: ImageEntity) {
    this.dialogRef.close(image);
  }
  changePage(event: any) {
    this.pageIndex = event.pageIndex;
    this.itemsPerPage = event.pageSize;
    this.updatePage();
  }

  onDeleteImage(image: ImageEntity) {
    this.imageService
      .deleteImage(image)
      .then(() => {
        this.imageService
          .readImagesPaginated(this.pageIndex, this.itemsPerPage)
          .then((result) => {
            this.images = result[0];
            this.numberOfImages = result[1];
          });
      })
      .catch((error) => {
        console.error(error);
        this._snackBar.open("Fehler beim Löschen des Bildes", "OK", {
          duration: 4000,
        });
      });
  }

  }
}

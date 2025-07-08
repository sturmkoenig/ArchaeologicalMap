import { Component } from "@angular/core";
import { MatDialogModule, MatDialogRef } from "@angular/material/dialog";
import { MatButtonModule } from "@angular/material/button";

@Component({
  selector: "app-delete-card-dialog",
  templateUrl: "./delete-card-dialog.component.html",
  standalone: true,
  imports: [MatButtonModule, MatDialogModule],
})
export class DeleteCardDialogComponent {
  constructor(public dialogRef: MatDialogRef<DeleteCardDialogComponent>) {}

  onCancel(): void {
    this.dialogRef.close();
  }

  deleteMarker(): void {
    this.dialogRef.close("deleteMarker");
  }

  deleteCard(): void {
    this.dialogRef.close("deleteCard");
  }
}

import { Component, EventEmitter, Output } from "@angular/core";

@Component({
  selector: "app-toolbar",
  template: `
    <mat-toolbar class="tooblbar" color="primary">
      <button
        mat-icon-button
        class="example-icon"
        (click)="onMenuClicked($event)"
      >
        <mat-icon>menu</mat-icon>
      </button>
      <span>Archäologie und Karten</span>
      <span class="example-spacer"></span>
    </mat-toolbar>
  `,
  styles: [
    `
      .example-spacer {
        flex: 1 1 auto;
      }
      .toolbar {
        position: sticky;
        top: 0;
      }
    `,
  ],
})
export class ToolbarComponent {
  @Output()
  onMenu = new EventEmitter<MouseEvent>();
  checked: boolean = false;

  onMenuClicked(event: MouseEvent) {
    console.log("clicked");
    this.onMenu.emit(event);
  }
}

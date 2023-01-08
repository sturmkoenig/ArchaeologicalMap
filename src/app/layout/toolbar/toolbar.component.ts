import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-toolbar',
  template: `
    <p>
      <mat-toolbar color="primary">
        <button
          mat-icon-button
          class="example-icon"
          aria-label="Example icon-button with menu icon"
          (click)="emitMenuClicked($event)"
        >
          <mat-icon>menu</mat-icon>
        </button>
        <span>Archaelogical Maps</span>
        <span class="example-spacer"></span>
      </mat-toolbar>
    </p>
  `,
  styles: [
    `
      .example-spacer {
        flex: 1 1 auto;
      }
    `,
  ],
})
export class ToolbarComponent {
  @Output()
  onMenu = new EventEmitter<MouseEvent>();

  emitMenuClicked(event: MouseEvent) {
    this.onMenu.emit(event);
  }
}

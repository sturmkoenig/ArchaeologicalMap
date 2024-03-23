import { Component, EventEmitter, Input, Output } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";

@Component({
  selector: "app-right-sidebar",
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  template: `
    @if (visible) {
      <div class="right-sidebar--container">
        <div class="right-sidebar--container__toggle">
          <button
            mat-fab
            color="primary"
            aria-label="Example icon button with a delete icon"
            (click)="onCollapse()"
          >
            <mat-icon>arrow_forward_ios </mat-icon>
          </button>
        </div>
        <div class="right-sidebar--container__content">
          <ng-content></ng-content>
        </div>
      </div>
    }
  `,
  styles: `
    .right-sidebar--container {
      position: relative;
      height: 100%;
      width: 400px;
      border-left: 10px solid #f3f4f4;
      &__content {
        height: 100%;
        width: 100%;
        overflow-y: scroll;
        display: flex;
        flex-direction: column;
        align-items: center;
      }
      &__toggle {
        position: absolute;
        width: 20px;
        top: 50%;
        z-index: 1000;
        transform: translateX(-30px);
      }
    }
  `,
})
export class RightSidebarComponent {
  @Input()
  visible: boolean = false;

  @Output()
  visibleChange: EventEmitter<boolean> = new EventEmitter();

  @Output()
  openSidebar() {
    this.visible = true;
  }

  onCollapse() {
    this.visible = false;
    console.log();
    this.visibleChange.emit();
  }
}

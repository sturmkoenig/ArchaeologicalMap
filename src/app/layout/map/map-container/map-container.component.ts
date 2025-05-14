import { Component, ViewChild } from "@angular/core";
import { CardListComponent } from "@app/components/cards/card-list/card-list.component";
import { MatDrawer, MatSidenavModule } from "@angular/material/sidenav";
import { MatIcon } from "@angular/material/icon";
import { OverviewMapComponent } from "@app/components/overview-map/overview-map.component";
import { MatFabButton } from "@angular/material/button";
import { CommonModule } from "@angular/common";
import { StackListComponent } from "@app/components/stacks/stack-list/stack-list.component";

type AvailableSidebarViews = "card-list" | "stack-list";
@Component({
  selector: "app-map-container",
  imports: [
    CardListComponent,
    MatSidenavModule,
    MatIcon,
    CommonModule,
    OverviewMapComponent,
    MatFabButton,
    StackListComponent,
  ],
  template: `
    <div class="flex flex-col h-full">
      <mat-drawer-container class="h-full">
        <mat-drawer #drawer mode="side">
          <ng-container [ngSwitch]="activeView">
            <app-card-list *ngSwitchCase="'card-list'" />
            <app-stack-display *ngSwitchCase="'stack-list'" />
          </ng-container>
        </mat-drawer>

        <mat-drawer-content>
          <div class="absolute fixed z-1000 translate-20">
            <button
              data-testid="card-list-button"
              mat-fab
              (click)="changeActiveView('card-list')"
            >
              <mat-icon>search</mat-icon>
            </button>
          </div>
          <div class="absolute fixed z-1000 translate-x-20 translate-y-40">
            <button
              data-testid="stack-list-button"
              mat-fab
              (click)="changeActiveView('stack-list')"
            >
              <mat-icon>book</mat-icon>
            </button>
          </div>
          <app-overview-map />
        </mat-drawer-content>
      </mat-drawer-container>
    </div>
  `,
})
export class MapContainerComponent {
  activeView: AvailableSidebarViews = "card-list";
  @ViewChild("drawer") drawer!: MatDrawer;

  changeActiveView(newView: AvailableSidebarViews) {
    if (newView === this.activeView || !this.drawer.opened) {
      this.drawer.toggle();
    }
    this.activeView = newView;
  }
}

import { Component } from "@angular/core";
import { CardListComponent } from "@app/components/cards/card-list/card-list.component";
import { MatSidenavModule } from "@angular/material/sidenav";
import { MatIcon } from "@angular/material/icon";
import { OverviewMapComponent } from "@app/components/overview-map/overview-map.component";
import { MatFabButton } from "@angular/material/button";

@Component({
  selector: "app-map-container",
  standalone: true,
  imports: [
    CardListComponent,
    MatSidenavModule,
    MatIcon,
    OverviewMapComponent,
    MatFabButton,
  ],
  template: `
    <div class="flex flex-col h-full">
      <mat-drawer-container class="h-full">
        <mat-drawer #drawer mode="side">
          <app-card-list></app-card-list>
        </mat-drawer>

        <mat-drawer-content>
          <div class="absolute fixed z-1000 translate-20">
            <button mat-fab (click)="drawer.toggle()">
              <mat-icon>search</mat-icon>
            </button>
          </div>
          <app-overview-map />
        </mat-drawer-content>
      </mat-drawer-container>
    </div>
  `,
})
export class MapContainerComponent {}

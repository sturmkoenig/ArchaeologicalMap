import { NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";

import { DragDropModule } from "@angular/cdk/drag-drop";
import { MatButtonToggleModule } from "@angular/material/button-toggle";
import {
  provideHttpClient,
  withInterceptorsFromDi,
} from "@angular/common/http";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatGridListModule } from "@angular/material/grid-list";
import { MatIconModule } from "@angular/material/icon";
import { MatListModule } from "@angular/material/list";
import { MatSidenavModule } from "@angular/material/sidenav";
import { MatSnackBarModule } from "@angular/material/snack-bar";
import { MatToolbarModule } from "@angular/material/toolbar";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { AppRoutingModule } from "./app-routing.module";
import { AppComponent } from "./app.component";
import { ToolbarComponent } from "./layout/toolbar/toolbar.component";

import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatMenuModule } from "@angular/material/menu";
import { MatPaginatorModule } from "@angular/material/paginator";
import { MatSelectModule } from "@angular/material/select";
import { MatSliderModule } from "@angular/material/slider";
import { MatTableModule } from "@angular/material/table";

import { FormsModule, ReactiveFormsModule } from "@angular/forms";

import { MatInputModule } from "@angular/material/input";
import { RouterModule } from "@angular/router";

import { MatDialogModule } from "@angular/material/dialog";
import { MatDividerModule } from "@angular/material/divider";
import { MatStepperModule } from "@angular/material/stepper";
import { LeafletModule } from "@bluehalo/ngx-leaflet";
import { CardDetailsComponent } from "./components/cards/card-details/card-details.component";
import { CardListComponent } from "./components/cards/card-list/card-list.component";
import { CardDeleteDialogComponent } from "./components/cards/card-update-modal/card-delete-dialog/card-delete-dialog.component";
import { CardUpdateModalComponent } from "./components/cards/card-update-modal/card-update-modal.component";
import { PositionPickerComponent } from "./components/cards/card-wizzard/position-picker/position-picker.component";
import { StackDisplayComponent } from "./components/stacks/stack-list/stack-list.component";
import { EditorComponent } from "./layout/editor/editor.component";
import { FilterPipe } from "./layout/editor/filter.pipe";
import { MapComponent } from "./layout/map/map.component";
import { CardDetailsStore } from "./state/card-details.store";
import { StackStore } from "./state/stack.store";
import { CardService } from "@service/card.service";
import { ComponentStore } from "@ngrx/component-store";
import { RightSidebarComponent } from "./layout/right-sidebar/right-sidebar.component";
import { IconSizeSettingsComponent } from "./components/overview-map/map-settings/icon-size-settings/icon-size-settings.component";
import { MarkerButtonToggleComponent } from "./components/markers/marker-button-toggle/marker-button-toggle.component";
import { OverviewMapService } from "@service/overview-map.service";
import { NgOptimizedImage } from "@angular/common";
import { LeafletMarkerClusterModule } from "@bluehalo/ngx-leaflet-markercluster";
import { MapSettingsComponent } from "./components/overview-map/map-settings/map-settings.component";

@NgModule({
  declarations: [
    AppComponent,
    MapComponent,
    ToolbarComponent,
    CardListComponent,
    CardDetailsComponent,
    PositionPickerComponent,
    CardUpdateModalComponent,
    EditorComponent,
    FilterPipe,
    CardDeleteDialogComponent,
    StackDisplayComponent,
  ],
  bootstrap: [AppComponent],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    LeafletMarkerClusterModule,
    MatListModule,
    MatGridListModule,
    MarkerButtonToggleComponent,
    MatToolbarModule,
    ReactiveFormsModule,
    FormsModule,
    MatIconModule,
    DragDropModule,
    IconSizeSettingsComponent,
    MatSnackBarModule,
    MatSidenavModule,
    MatDividerModule,
    RightSidebarComponent,
    MatButtonModule,
    MatButtonToggleModule,
    MatCardModule,
    MatSelectModule,
    MatInputModule,
    RouterModule,
    MatStepperModule,
    MatDialogModule,
    MatFormFieldModule,
    MatCheckboxModule,
    MatSliderModule,
    MatTableModule,
    MatPaginatorModule,
    MatMenuModule,
    LeafletModule,
    NgOptimizedImage,
    MapSettingsComponent,
  ],
  providers: [
    StackStore,
    CardDetailsStore,
    CardService,
    ComponentStore,
    OverviewMapService,
    provideHttpClient(withInterceptorsFromDi()),
  ],
})
export class AppModule {}

import { NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";

import { AppRoutingModule } from "./app-routing.module";
import { AppComponent } from "./app.component";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { OverviewMapComponent } from "./overview-map/overview-map.component";
import { MatToolbarModule } from "@angular/material/toolbar";
import { ToolbarComponent } from "./layout/toolbar/toolbar.component";
import { MatIconModule } from "@angular/material/icon";
import { MatSnackBarModule } from "@angular/material/snack-bar";
import { MatSidenavModule } from "@angular/material/sidenav";
import { SidebarComponent } from "./layout/sidebar/sidebar.component";
import { HttpClientModule } from "@angular/common/http";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatListModule } from "@angular/material/list";
import { MatSelectModule } from "@angular/material/select";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatSliderModule } from "@angular/material/slider";
import { MatPaginatorModule } from "@angular/material/paginator";

import { FormsModule, ReactiveFormsModule } from "@angular/forms";

import { MatInputModule } from "@angular/material/input";
import { RouterModule } from "@angular/router";

import { MatStepperModule } from "@angular/material/stepper";
import { MatDialogModule } from "@angular/material/dialog";
import { MatDividerModule } from "@angular/material/divider";
import { CardWizzardComponent } from "./cards/card-wizzard/card-wizzard.component";
import { CardListComponent } from "./cards/card-list/card-list.component";
import { MapComponent } from "./layout/map/map.component";
import { LeafletModule } from "@asymmetrik/ngx-leaflet";
import { CardDetailsComponent } from "./cards/card-details/card-details.component";
import { QuillModule } from "ngx-quill";
import { LeafletMarkerClusterModule } from "@asymmetrik/ngx-leaflet-markercluster";
import { CardListItemComponent } from "./layout/list/card-list-item/card-list-item.component";
import { IconPickerComponent } from "./cards/card-wizzard/icon-picker/icon-picker.component";
import { PositionPickerComponent } from "./cards/card-wizzard/position-picker/position-picker.component";
import { CardUpdateModalComponent } from './cards/card-update-modal/card-update-modal.component';

@NgModule({
  declarations: [
    AppComponent,
    OverviewMapComponent,
    MapComponent,
    ToolbarComponent,
    SidebarComponent,
    CardWizzardComponent,
    CardListComponent,
    CardDetailsComponent,
    CardListItemComponent,
    IconPickerComponent,
    PositionPickerComponent,
    CardUpdateModalComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    MatListModule,
    MatToolbarModule,
    ReactiveFormsModule,
    FormsModule,
    MatIconModule,
    MatSnackBarModule,
    MatSidenavModule,
    MatDividerModule,
    HttpClientModule,
    MatButtonModule,
    MatCardModule,
    MatSelectModule,
    MatInputModule,
    RouterModule,
    MatStepperModule,
    MatDialogModule,
    MatFormFieldModule,
    MatCheckboxModule,
    MatSliderModule,
    MatPaginatorModule,
    LeafletModule,
    LeafletMarkerClusterModule,
    QuillModule.forRoot(),
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}

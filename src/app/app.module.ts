import { NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";

import { AppRoutingModule } from "./app-routing.module";
import { AppComponent } from "./app.component";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { OverviewMapComponent } from "./overview-map/overview-map.component";
import { MatToolbarModule } from "@angular/material/toolbar";
import { ToolbarComponent } from "./layout/toolbar/toolbar.component";
import { MatIconModule } from "@angular/material/icon";
import { MatSidenavModule } from "@angular/material/sidenav";
import { SidebarComponent } from "./layout/sidebar/sidebar.component";
import { HttpClientModule } from "@angular/common/http";
import { MatButtonModule } from "@angular/material/button";
import { CardComponent } from "./layout/card/card.component";
import { MatCardModule } from "@angular/material/card";
import { MatListModule } from "@angular/material/list";
import { MatSelectModule } from "@angular/material/select";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatSliderModule } from "@angular/material/slider";

import { FormsModule, ReactiveFormsModule } from "@angular/forms";

import { MatInputModule } from "@angular/material/input";
import { RouterModule } from "@angular/router";

import { MatStepperModule } from "@angular/material/stepper";
import { MatDividerModule } from "@angular/material/divider";
import { CardWizzardComponent } from "./cards/card-wizzard/card-wizzard.component";
import { CardListComponent } from "./cards/card-list/card-list.component";
import { MapComponent } from "./ui-elements/map/map.component";
import { LeafletModule } from "@asymmetrik/ngx-leaflet";
import { CardDetailsComponent } from "./cards/card-details/card-details.component";
import { QuillModule } from "ngx-quill";
import { EditorModule, TINYMCE_SCRIPT_SRC } from "@tinymce/tinymce-angular";
import { LeafletMarkerClusterModule } from "@asymmetrik/ngx-leaflet-markercluster";

@NgModule({
  declarations: [
    AppComponent,
    OverviewMapComponent,
    MapComponent,
    ToolbarComponent,
    SidebarComponent,
    CardComponent,
    CardWizzardComponent,
    CardListComponent,
    CardDetailsComponent,
  ],
  imports: [
    BrowserModule,
    EditorModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    MatListModule,
    MatToolbarModule,
    ReactiveFormsModule,
    FormsModule,
    MatIconModule,
    MatSidenavModule,
    MatDividerModule,
    HttpClientModule,
    MatButtonModule,
    MatCardModule,
    MatSelectModule,
    MatInputModule,
    RouterModule,
    MatStepperModule,
    MatFormFieldModule,
    MatCheckboxModule,
    MatSliderModule,
    LeafletModule,
    LeafletMarkerClusterModule,
    QuillModule.forRoot(),
  ],
  providers: [
    { provide: TINYMCE_SCRIPT_SRC, useValue: "tinymce/tinymce.min.js" },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}

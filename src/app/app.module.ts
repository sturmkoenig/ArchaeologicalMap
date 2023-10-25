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
import { MatGridListModule } from "@angular/material/grid-list";
import { DragDropModule } from "@angular/cdk/drag-drop";

import { MatSelectModule } from "@angular/material/select";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatSliderModule } from "@angular/material/slider";
import { MatSlideToggleModule } from "@angular/material/slide-toggle";
import { MatPaginatorModule } from "@angular/material/paginator";
import { MatMenuModule } from "@angular/material/menu";

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
import { LeafletMarkerClusterModule } from "@asymmetrik/ngx-leaflet-markercluster";
import { CardListItemComponent } from "./layout/list/card-list-item/card-list-item.component";
import { PositionPickerComponent } from "./cards/card-wizzard/position-picker/position-picker.component";
import { CardUpdateModalComponent } from "./cards/card-update-modal/card-update-modal.component";
import { EditorComponent } from "./layout/editor/editor.component";
import { FilterPipe } from "./layout/editor/filter.pipe";
import { CardDeleteDialogComponent } from "./cards/card-update-modal/card-delete-dialog/card-delete-dialog.component";
import { StackCreatorComponent } from "./stacks/stack-creator/stack-creator.component";
import { StackDisplayComponent } from "./stacks/stack-list/stack-list.component";
import { FileDropzoneComponent } from "./util/file-dropzone/file-dropzone.component";
import { DndDirective } from "./util/file-dropzone/dnd.directive";
import { StackDetailsComponent } from './stacks/stack-details/stack-details.component';

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
    PositionPickerComponent,
    CardUpdateModalComponent,
    EditorComponent,
    FilterPipe,
    CardDeleteDialogComponent,
    StackCreatorComponent,
    StackDisplayComponent,
    FileDropzoneComponent,
    DndDirective,
    StackDetailsComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    MatListModule,
    MatGridListModule,
    MatToolbarModule,
    ReactiveFormsModule,
    FormsModule,
    MatIconModule,
    DragDropModule,
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
    MatMenuModule,
    LeafletModule,
    LeafletMarkerClusterModule,
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}

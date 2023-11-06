import { NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";

import { DragDropModule } from "@angular/cdk/drag-drop";
import { HttpClientModule } from "@angular/common/http";
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
import { OverviewMapComponent } from "./components/overview-map/overview-map.component";
import { SidebarComponent } from "./layout/sidebar/sidebar.component";
import { ToolbarComponent } from "./layout/toolbar/toolbar.component";

import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatMenuModule } from "@angular/material/menu";
import { MatPaginatorModule } from "@angular/material/paginator";
import { MatSelectModule } from "@angular/material/select";
import { MatSliderModule } from "@angular/material/slider";

import { FormsModule, ReactiveFormsModule } from "@angular/forms";

import { MatInputModule } from "@angular/material/input";
import { RouterModule } from "@angular/router";

import { MatDialogModule } from "@angular/material/dialog";
import { MatDividerModule } from "@angular/material/divider";
import { MatStepperModule } from "@angular/material/stepper";
import { LeafletModule } from "@asymmetrik/ngx-leaflet";
import { CardDetailsComponent } from "./components/cards/card-details/card-details.component";
import { CardListComponent } from "./components/cards/card-list/card-list.component";
import { CardDeleteDialogComponent } from "./components/cards/card-update-modal/card-delete-dialog/card-delete-dialog.component";
import { CardUpdateModalComponent } from "./components/cards/card-update-modal/card-update-modal.component";
import { CardWizzardComponent } from "./components/cards/card-wizzard/card-wizzard.component";
import { PositionPickerComponent } from "./components/cards/card-wizzard/position-picker/position-picker.component";
import { StackCreatorComponent } from "./components/stacks/stack-creator/stack-creator.component";
import { StackDetailsComponent } from "./components/stacks/stack-details/stack-details.component";
import { StackDisplayComponent } from "./components/stacks/stack-list/stack-list.component";
import { EditorComponent } from "./layout/editor/editor.component";
import { FilterPipe } from "./layout/editor/filter.pipe";
import { CardListItemComponent } from "./layout/list/card-list-item/card-list-item.component";
import { MapComponent } from "./layout/map/map.component";
import { CardDetailsStore } from "./state/card-details.store";
import { StackStore } from "./state/stack.store";
import { DndDirective } from "./util/file-dropzone/dnd.directive";
import { FileDropzoneComponent } from "./util/file-dropzone/file-dropzone.component";
import { CardService } from "./services/card.service";
import { ComponentStore } from "@ngrx/component-store";

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
  ],
  providers: [StackStore, CardDetailsStore, CardService, ComponentStore],
  bootstrap: [AppComponent],
})
export class AppModule {}

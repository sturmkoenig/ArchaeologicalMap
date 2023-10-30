import { NgModule, isDevMode } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";

import { AppRoutingModule } from "./app-routing.module";
import { AppComponent } from "./app.component";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { OverviewMapComponent } from "./components/overview-map/overview-map.component";
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
import { CardWizzardComponent } from "./components/cards/card-wizzard/card-wizzard.component";
import { CardListComponent } from "./components/cards/card-list/card-list.component";
import { MapComponent } from "./layout/map/map.component";
import { LeafletModule } from "@asymmetrik/ngx-leaflet";
import { CardDetailsComponent } from "./components/cards/card-details/card-details.component";
import { CardListItemComponent } from "./layout/list/card-list-item/card-list-item.component";
import { PositionPickerComponent } from "./components/cards/card-wizzard/position-picker/position-picker.component";
import { CardUpdateModalComponent } from "./components/cards/card-update-modal/card-update-modal.component";
import { EditorComponent } from "./layout/editor/editor.component";
import { FilterPipe } from "./layout/editor/filter.pipe";
import { CardDeleteDialogComponent } from "./components/cards/card-update-modal/card-delete-dialog/card-delete-dialog.component";
import { StackCreatorComponent } from "./components/stacks/stack-creator/stack-creator.component";
import { StackDisplayComponent } from "./components/stacks/stack-list/stack-list.component";
import { FileDropzoneComponent } from "./util/file-dropzone/file-dropzone.component";
import { DndDirective } from "./util/file-dropzone/dnd.directive";
import { StackDetailsComponent } from "./components/stacks/stack-details/stack-details.component";
import { EffectsModule } from "@ngrx/effects";
import { StoreModule } from "@ngrx/store";
import { StackReducer } from "./state/stack.reducer";
import { StackEffects } from "./state/stack.effects";
import { StoreDevtools, StoreDevtoolsModule } from "@ngrx/store-devtools";
import { StackStore } from "./state/stack.store";

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
    EffectsModule.forRoot([StackEffects]),
    StoreModule.forRoot({ stacks: StackReducer }),
    StoreDevtoolsModule.instrument({
      maxAge: 25, // Retains last 25 states
      logOnly: !isDevMode(), // Restrict extension to log-only mode
      autoPause: true, // Pauses recording actions and state changes when the extension window is not open
      trace: false, //  If set to true, will include stack trace for every dispatched action, so you can see it in trace tab jumping directly to that part of code
      traceLimit: 75, // maximum stack trace frames to be stored (in case trace option was provided as true)
      connectOutsideZone: true, // If set to true, the connection is established outside the Angular zone for better performance
    }),
  ],
  providers: [StackStore],
  bootstrap: [AppComponent],
})
export class AppModule {}

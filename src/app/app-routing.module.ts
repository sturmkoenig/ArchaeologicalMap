import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { CardDetailsComponent } from "./components/cards/card-details/card-details.component";
import { CardListComponent } from "./components/cards/card-list/card-list.component";
import { StackDisplayComponent } from "./components/stacks/stack-list/stack-list.component";
import { MapContainerComponent } from "@app/layout/map/map-container/map-container.component";

const routes: Routes = [
  {
    path: "",
    redirectTo: "map",
    pathMatch: "full",
  },
  {
    path: "map",
    children: [
      {
        path: "",
        component: MapContainerComponent,
      },
    ],
  },
  {
    path: "stacks",
    children: [
      {
        path: "list",
        children: [
          {
            path: "",
            component: StackDisplayComponent,
          },
        ],
      },
    ],
  },
  {
    path: "cards",
    children: [
      {
        path: "list",
        children: [
          {
            path: "",
            component: CardListComponent,
          },
        ],
      },
      {
        path: "details/:id",
        component: CardDetailsComponent,
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}

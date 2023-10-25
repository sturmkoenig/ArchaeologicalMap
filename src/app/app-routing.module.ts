import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { AppComponent } from "./app.component";
import { CardDetailsComponent } from "./components/cards/card-details/card-details.component";
import { CardListComponent } from "./components/cards/card-list/card-list.component";
import { CardWizzardComponent } from "./components/cards/card-wizzard/card-wizzard.component";
import { OverviewMapComponent } from "./components/overview-map/overview-map.component";
import { StackDisplayComponent } from "./components/stacks/stack-list/stack-list.component";

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
        component: OverviewMapComponent,
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
        path: "new",
        children: [
          {
            path: "",
            component: CardWizzardComponent,
          },
        ],
      },
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
        path: "details",
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

import { Component } from "@angular/core";
import { Router } from "@angular/router";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"],
})
export class AppComponent {
  title = "archaological-map";
  showFiller = false;

  constructor(private router: Router) {}

  goMap() {
    this.router.navigate(["map"]);
  }

  goList() {
    this.router.navigate(["cards/list"]);
  }

  goCreateNew() {
    this.router.navigate(["cards/new"]);
  }

  goStacksList() {
    this.router.navigate(["stacks/list"]);
  }
}

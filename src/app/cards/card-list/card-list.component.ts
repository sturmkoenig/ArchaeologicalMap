import { Component, OnInit } from "@angular/core";
import { invoke } from "@tauri-apps/api";
import { throwError } from "rxjs";
import { Card } from "src/app/model/card";

@Component({
  selector: "app-card-list",
  template: ` <p>card-list works!</p>
    <div>
      <a href="/cards/details?id=12">go details</a>
    </div>`,
  styles: [],
})
export class CardListComponent implements OnInit {
  public allCards: Card[] = [];

  ngOnInit(): void {
    console.log("hi from card list");
    invoke("get_all_cards", {}).then(
      (response) => console.log(response),
      (error) => throwError(() => new error())
    );
    invoke("greet", { name: "johny" }).then((res) => console.log(res));
    invoke("test_file_read", {});
  }
}

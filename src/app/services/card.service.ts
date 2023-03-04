import { Injectable } from "@angular/core";
import { Observable, tap } from "rxjs";
import { DefaultService } from "src/generated/api/default.service";
import { Card, CardDB, NewCard } from "src/app/model/card";
import { CardPostRequest } from "src/generated/model/cardPostRequest";
import { invoke } from "@tauri-apps/api";

@Injectable({
  providedIn: "root",
})
export class CardService {
  constructor(private amService: DefaultService) {}

  cardCreate(newCard: NewCard): void {
    invoke("write_card", {
      card: {
        title: newCard.title,
        description: newCard.description,
        category: newCard.category,
        longitude: newCard.coordinate.longitude,
        latitude: newCard.coordinate.latitude,
        coordinate_radius: 0.0,
      },
    });
  }

  cardRead(cardId: number): Observable<Card> {
    return this.amService
      .cardIdGet(cardId)
      .pipe(tap((x) => console.log("get by id: ", x)));
  }
  readCards(): Promise<CardDB[]> {
    return invoke("read_cards", {});
  }
}

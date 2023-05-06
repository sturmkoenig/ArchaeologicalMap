import { Injectable } from "@angular/core";
import { Observable, tap } from "rxjs";
import { Card, CardDB, NewCard } from "src/app/model/card";
import { invoke } from "@tauri-apps/api";

@Injectable({
  providedIn: "root",
})
export class CardService {
  cardCreate(newCard: NewCard): void {
    invoke("write_card", {
      card: {
        title: newCard.title,
        description: newCard.description,
        category: newCard.category,
        longitude: newCard.coordinate.longitude,
        latitude: newCard.coordinate.latitude,
        coordinate_radius: newCard.coordinateRadius,
        icon_name: newCard.iconName,
      },
    });
  }

  readCards(): Promise<CardDB[]> {
    return invoke("read_cards", {});
  }
}

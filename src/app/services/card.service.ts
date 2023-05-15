import { Injectable } from "@angular/core";
import { Observable, tap } from "rxjs";
import { Card, CardDB, NewCard } from "src/app/model/card";
import { fs, invoke } from "@tauri-apps/api";
import { appCacheDir, appConfigDir } from "@tauri-apps/api/path";

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
  readCardsPaginated(pageIndex: number, filter: string): Promise<CardDB[]> {
    return invoke("read_cards_paginated", { page: pageIndex, filter: filter });
  }

  readCard(cardId: number): Promise<CardDB> {
    return invoke("read_card", { id: cardId });
  }

  readCardTitleMapping(): Promise<[{ id: number; title: string }]> {
    let cacheDir = appCacheDir();
    invoke("cache_card_names", {});
    return appCacheDir()
      .then((cacheDir) => fs.readTextFile(cacheDir + "card_names.json"))
      .then((res) => JSON.parse(res));
  }

  updateCard(newCard: CardDB) {
    invoke("update_card", {
      card: {
        id: newCard.id,
        title: newCard.title,
        description: newCard.description,
        longitude: newCard.longitude,
        latitude: newCard.latitude,
        category: "",
        coordinate_radius: newCard.coordinate_radius,
        icon_name: newCard.icon_name,
      },
    });
  }

  async getNumberOfCards(): Promise<number> {
    return invoke("count_cards", {});
  }

  deleteCard(id: number) {
    invoke("delete_card", {
      id: id,
    }).then(() => console.log("card deleted"));
  }
}

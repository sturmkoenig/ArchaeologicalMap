import { Injectable } from "@angular/core";
import { fs, invoke } from "@tauri-apps/api";
import { appCacheDir } from "@tauri-apps/api/path";
import {
  CardDB,
  CardinalDirection,
  MarkerDB,
  MarkerLatLng,
  NewCard,
} from "src/app/model/card";

@Injectable({
  providedIn: "root",
})
export class CardService {
  getAllCardsForStack(stack_id: number): Promise<CardDB[]> {
    return invoke("get_cards_in_stack", { stackId: stack_id });
  }

  createCard(newCard: CardDB): Promise<CardDB> {
    return invoke("create_card", {
      card: {
        title: newCard.title,
        description: newCard.description,
        markers: newCard.markers,
      },
    });
  }

  readCards(): Promise<CardDB[]> {
    return invoke("read_cards", {});
  }
  readMarkersInArea(directions: CardinalDirection): Promise<MarkerDB[]> {
    return invoke("read_markers_in_area", {
      north: directions.north,
      east: directions.east,
      south: directions.south,
      west: directions.west,
    });
  }

  readCardsInArea(directions: CardinalDirection): Promise<CardDB[]> {
    return invoke("read_cards_in_area", {
      north: directions.north,
      east: directions.east,
      south: directions.south,
      west: directions.west,
    });
  }

  readCardsPaginated(pageIndex: number, filter: string): Promise<CardDB[]> {
    return invoke("read_cards_paginated", { page: pageIndex, filter: filter });
  }

  readCard(cardId: number): Promise<CardDB> {
    return invoke("read_card", { id: cardId });
  }

  async readCardTitleMapping(): Promise<[{ id: number; title: string }]> {
    let cacheDir = appCacheDir();
    invoke("cache_card_names", {});
    const cacheDir_1 = await appCacheDir();
    const res = await fs.readTextFile(cacheDir_1 + "card_names.json");
    return JSON.parse(res);
  }

  updateCard(updateCard: CardDB, markers?: MarkerDB[]): Promise<boolean> {
    // TODO update position
    return invoke("update_card", {
      card: {
        id: updateCard.id,
        title: updateCard.title,
        description: updateCard.description,
        markers: markers,
        stack_id: updateCard.stack_id,
      },
    });
  }

  async getNumberOfCards(): Promise<number> {
    return invoke("count_cards", {});
  }

  async deleteCard(id: number): Promise<any> {
    await invoke("delete_card", {
      id: id,
    });
    return;
  }
  deleteMarker(markerId: number): Promise<any> {
    return invoke("delete_marker", { markerId: markerId });
  }

  deleteMarkers(removedMarkers: MarkerDB[]) {
    removedMarkers
      .filter((marker) => marker.id !== undefined && marker.id !== null)
      .forEach((marker) => {
        invoke("delete_marker", { markerId: marker.id! });
      });
  }
}

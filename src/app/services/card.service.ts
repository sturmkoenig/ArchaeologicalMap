import { Injectable } from "@angular/core";
import { invoke } from "@tauri-apps/api/core";
import { appDataDir } from "@tauri-apps/api/path";
import { CardDB, CardinalDirection, MarkerDB } from "src/app/model/card";
import * as fs from "@tauri-apps/plugin-fs";

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
    invoke("cache_card_names", {});
    const cacheDir = await appDataDir();
    const res = await fs.readTextFile(cacheDir + "/card_names.json");
    return JSON.parse(res);
  }

  updateCard(updateCard: CardDB, markers?: MarkerDB[]): Promise<boolean> {
    return invoke("update_card", {
      card: {
        id: updateCard.id,
        title: updateCard.title,
        description: updateCard.description,
        markers: markers,
        stack_id: updateCard.stack_id,
        region_image_id: updateCard.region_image_id,
      },
    });
  }

  async getNumberOfCards(): Promise<number> {
    return invoke("count_cards", {});
  }

  async deleteCard(id: number): Promise<void> {
    await invoke("delete_card", {
      id: id,
    });
    return;
  }
  deleteMarker(markerId: number): Promise<void> {
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

import { Injectable } from "@angular/core";
import { invoke } from "@tauri-apps/api/core";
import { Card, CardDB, CardinalDirection, MarkerDB } from "src/app/model/card";
import { Stack } from "@app/model/stack";

@Injectable({
  providedIn: "root",
})
export class CardService {
  getAllCardsForStack(
    stack_id: number,
  ): Promise<{ stack: Stack; cards: CardDB[] }> {
    return invoke<[Stack, CardDB[]]>("get_cards_in_stack", {
      stackId: stack_id,
    }).then((result) => {
      return { stack: result[0], cards: result[1] };
    });
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
  readMarkersInArea(directions: CardinalDirection): Promise<Card[]> {
    return invoke("read_cards_in_area", { cardinalDirections: directions });
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

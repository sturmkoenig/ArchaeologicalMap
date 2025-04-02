import { Injectable } from "@angular/core";
import { invoke } from "@tauri-apps/api/core";
import { Card, CardDB, CardinalDirection } from "src/app/model/card";
import { Stack } from "@app/model/stack";
import { emit } from "@tauri-apps/api/event";

@Injectable({
  providedIn: "root",
})
export class CardService {
  async getAllCardsForStack(
    stack_id: number,
  ): Promise<{ stack: Stack; cards: Card[] }> {
    const result = await invoke<[Stack, Card[]]>("read_cards_in_stack", {
      stackId: stack_id,
    });
    return { stack: result[0], cards: result[1] };
  }

  createCard(card: Card): Promise<Card> {
    return invoke("create_unified_card", {
      card,
    });
  }
  readCardsInArea(directions: CardinalDirection): Promise<Card[]> {
    return invoke("read_cards_in_area", { cardinalDirections: directions });
  }

  /**
   * @deprecated
   */
  readCardsPaginated(pageIndex: number, filter: string): Promise<CardDB[]> {
    return invoke("read_cards_paginated", { page: pageIndex, filter: filter });
  }

  readCard(cardId: number): Promise<Card> {
    return invoke("read_card_by_id", { id: cardId });
  }

  updateCard(card: Card): Promise<boolean> {
    return invoke<boolean>("update_card_unified", {
      card,
    }).then(async (success: boolean) => {
      await emit("card-changed", card);
      return success;
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
}

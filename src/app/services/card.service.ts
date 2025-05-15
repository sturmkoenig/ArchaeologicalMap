import { Injectable } from "@angular/core";
import { invoke } from "@tauri-apps/api/core";
import {
  Card,
  CardDTO,
  CardinalDirection,
  fromCardDTO,
  toCardDTO,
} from "@app/model/card";
import { Stack } from "@app/model/stack";
import { emit } from "@tauri-apps/api/event";
import { NotificationService } from "@service/notification.service";

@Injectable({
  providedIn: "root",
})
export class CardService {
  constructor(private notificationService: NotificationService) {}
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
      card: toCardDTO(card),
    });
  }
  async readCardsInArea(directions: CardinalDirection): Promise<Card[]> {
    const cardDTOs = await invoke<CardDTO[]>("read_cards_in_area", {
      cardinalDirections: directions,
    });
    return cardDTOs.map(fromCardDTO);
  }

  async readCard(cardId: number): Promise<Card> {
    const cardDTO = await invoke<CardDTO>("read_card_by_id", { id: cardId });
    return fromCardDTO(cardDTO);
  }

  async readCardByTitle(titleFilter: string, limit?: number): Promise<Card[]> {
    const cardDTOs = await invoke<CardDTO[]>("read_cards_by_title", {
      title: titleFilter,
      limit: limit ?? 1000,
    });
    return cardDTOs.map(fromCardDTO);
  }

  async updateCard(card: Card): Promise<boolean> {
    const success = await invoke<boolean>("update_card_unified", {
      card: toCardDTO(card),
    });
    await emit("card-changed", card);
    return success;
  }

  async getNumberOfCards(): Promise<number> {
    return invoke("count_cards", {});
  }

  async deleteCard(id: number): Promise<void> {
    await invoke("delete_card", {
      id: id,
    }).catch((err) => {
      (err: string) =>
        this.notificationService.createNotification({ text: err });
    });
    return;
  }
}

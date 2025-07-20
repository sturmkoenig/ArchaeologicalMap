import { Injectable } from "@angular/core";
import { invoke } from "@tauri-apps/api/core";
import {
  LocationCard,
  CardDTO,
  CardinalDirection,
  fromCardDTO,
  toCardDTO,
  InfoCard,
  isLocationCard,
  Card,
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
    const [stack, cards] = await invoke<[Stack, CardDTO[]]>(
      "read_cards_in_stack",
      {
        stackId: stack_id,
      },
    );
    return {
      stack,
      cards: cards
        .map(fromCardDTO)
        .toSorted((a, b) => a.title.localeCompare(b.title)),
    };
  }

  createCard(card: LocationCard | InfoCard): Promise<LocationCard> {
    return invoke("create_card", {
      card: toCardDTO(card),
    });
  }
  async readCardsInArea(
    directions: CardinalDirection,
  ): Promise<LocationCard[]> {
    const cardDTOs = await invoke<CardDTO[]>("read_cards_in_area", {
      cardinalDirections: directions,
    });
    return cardDTOs.map(fromCardDTO).filter(isLocationCard);
  }

  async readCard(cardId: number): Promise<LocationCard | InfoCard> {
    const cardDTO = await invoke<CardDTO>("read_card_by_id", { id: cardId });
    return fromCardDTO(cardDTO);
  }

  async readCardByTitle(
    titleFilter: string,
    limit?: number,
  ): Promise<(LocationCard | InfoCard)[]> {
    const cardDTOs = await invoke<CardDTO[]>("read_cards_by_title", {
      title: titleFilter,
      limit: limit ?? 1000,
    });
    return cardDTOs.map(fromCardDTO);
  }

  async updateCard(card: Card): Promise<boolean> {
    const success = await invoke<boolean>("update_card", {
      card: toCardDTO(card),
    });
    await emit("card-changed", card);
    return success;
  }

  async deleteCard(id: number): Promise<void> {
    await invoke("delete_card", {
      id: id,
    }).catch((err: string) =>
      this.notificationService.createNotification({ text: err }),
    );
    return;
  }
}

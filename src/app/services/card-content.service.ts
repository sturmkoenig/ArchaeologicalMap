import { Injectable } from "@angular/core";
import { invoke } from "@tauri-apps/api/core";
import {
  BehaviorSubject,
  EMPTY,
  firstValueFrom,
  of,
  switchMap,
  tap,
} from "rxjs";
import { CardService } from "./card.service";

@Injectable({
  providedIn: "root",
})
export class CardContentService {
  private currentCardId: BehaviorSubject<number> = new BehaviorSubject(0);
  public cardId: BehaviorSubject<number> = new BehaviorSubject(0);
  public cardContent: BehaviorSubject<string | undefined>;

  constructor(private cardService: CardService) {
    this.cardContent = new BehaviorSubject<string | undefined>(undefined);
    this.cardId
      .pipe(
        tap(() => {
          return this.saveCardContent();
        }),
        switchMap((cardId) => {
          return this.loadCardContent(cardId);
        }),
      )
      .subscribe();
  }

  async saveCardContent() {
    if (this.cardContent.getValue() === undefined) {
      EMPTY;
      return firstValueFrom(of("hi from empty save"));
    }
    return invoke("write_card_content", {
      id: this.currentCardId.getValue().toString(),
      content: JSON.stringify(this.cardContent.getValue()),
    }).then(() => JSON.stringify(this.cardContent.getValue()));
  }

  setCardId(cardId: number) {
    this.cardId.next(cardId);
  }
  async loadCardContent(cardId: number) {
    return invoke<string>("read_card_content", { id: cardId.toString() }).then(
      (res: string) => {
        if (!res) {
          this.cardContent.next("");
        }
        try {
          this.cardContent.next(JSON.parse(res));
        } catch (error) {
          this.cardContent.next("");
        }
        this.currentCardId.next(cardId);
      },
    );
  }
}

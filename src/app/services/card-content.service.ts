import { Injectable } from "@angular/core";
import { invoke } from "@tauri-apps/api/core";
import Delta from "quill-delta";
import { BehaviorSubject, EMPTY, switchMap, tap } from "rxjs";

@Injectable({
  providedIn: "root",
})
export class CardContentService {
  private currentCardId: BehaviorSubject<number> = new BehaviorSubject(0);
  public cardId: BehaviorSubject<number> = new BehaviorSubject(0);
  public cardContent: BehaviorSubject<Delta | undefined>;

  constructor() {
    this.cardContent = new BehaviorSubject<Delta | undefined>(undefined);
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
          this.cardContent.next(new Delta([]));
        }
        try {
          this.cardContent.next(new Delta(JSON.parse(res)));
        } catch (error) {
          this.cardContent.next(new Delta([]));
        }
        this.currentCardId.next(cardId);
      },
    );
  }
}

import { Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { DefaultService } from 'src/generated/api/default.service';
import { Card } from 'src/generated/model/card';
import { CardPostRequest } from 'src/generated/model/cardPostRequest';

@Injectable({
  providedIn: 'root',
})
export class CardService {
  constructor(private amService: DefaultService) {}

  cardPost(cardPostRequest: CardPostRequest): void {
    this.amService.cardPost(cardPostRequest).subscribe();
  }

  cardGet(cardId: number): Observable<Card> {
    return this.amService
      .cardIdGet(cardId)
      .pipe(tap((x) => console.log('get by id: ', x)));
  }
}

import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import Delta from 'quill-delta';
import { Observable, throwError } from 'rxjs';
import { CardService } from 'src/app/services/card.service';
import { Card, Coordinate } from 'src/generated';

const fs = require('fs');
@Component({
  selector: 'app-card-details',
  template: `
    <ng-container *ngIf="card$ | async as card">
      <mat-card class="example-card">
        <mat-card-header>
          <div mat-card-avatar class="example-header-image"></div>
          <mat-card-title>{{ card.name }}</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <p>
            {{ card.text }}
          </p>
        </mat-card-content>
        <mat-card-actions>
          <button mat-button (click)="goToCard(card.coordinate)">
            auf karte zeigen
          </button>
        </mat-card-actions>
      </mat-card>
      <div class="grid grid-cols-2">
        <quill-editor
          (onContentChanged)="changedContent($event.content)"
        ></quill-editor>
        <div>
          <quill-view
            [content]="content"
            format="object"
            theme="snow"
          ></quill-view>
        </div>
      </div>
    </ng-container>
  `,
  styles: [],
})
export class CardDetailsComponent implements OnInit {
  cardId!: number;
  card$!: Observable<Card>;
  content: Delta = new Delta();
  existingContent!: Delta;

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router,
    private cardService: CardService
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      console.log(params);
      this.cardId = +params['id'];
      this.http
        .get('http://localhost:3000/api/content/' + this.cardId)
        .subscribe((next: Object) => {
          this.existingContent = next as Delta;
          console.log('worked!');
          console.log(this.existingContent);
        });
    });
    this.card$ = this.cardService.cardGet(this.cardId);
  }

  changedContent(newContent: Delta) {
    this.content = newContent;
    this.http
      .post('http://localhost:3000/api/upload', this.content)
      .subscribe();
    //console.log(this.content);
    // fs.readFile('./package.jsons', 'utf8', (err, data) => {
    //   if (err) throw err;
    //   console.log(data);
    // });
    // fs.writeFile('content.txt', JSON.stringify(this.content), (err) => {
    //   console.log(err);
    // });
  }

  goToCard(coordinates: Coordinate) {
    this.router.navigate(['map'], {
      queryParams: {
        longitude: coordinates.longitude,
        latitude: coordinates.latitude,
      },
    });
  }
}

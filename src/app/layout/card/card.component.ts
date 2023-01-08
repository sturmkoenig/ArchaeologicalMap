import { Component, ContentChild, Input, TemplateRef } from '@angular/core';

@Component({
  selector: 'app-card',
  template: `
    <mat-card class="example-card">
      <mat-card-header>
        <div mat-card-avatar class="example-header-image"></div>
        <mat-card-title>
          <ng-container *ngTemplateOutlet="titleTemplateRef"></ng-container>
        </mat-card-title>
        <mat-card-subtitle>
          <ng-container *ngTemplateOutlet="subTitleTemplateRef"></ng-container>
        </mat-card-subtitle>
      </mat-card-header>
      <img
        mat-card-image
        src="https://material.angular.io/assets/img/examples/shiba2.jpg"
        alt="Photo of a Shiba Inu"
      />
      <mat-card-content>
        <ng-content></ng-content>
      </mat-card-content>
      <mat-card-actions>
        <button mat-button>Show on Map</button>
      </mat-card-actions>
    </mat-card>
  `,
  styles: [],
})
export class CardComponent {
  @Input()
  text!: string;

  @Input()
  image!: URL;

  @ContentChild('titleTemplate')
  titleTemplateRef!: TemplateRef<any>;

  @ContentChild('subTitleTemplate')
  subTitleTemplateRef!: TemplateRef<any>;
}

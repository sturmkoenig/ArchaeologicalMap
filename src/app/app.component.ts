import { Component, ViewChild } from '@angular/core';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'archaological-map';
  showFiller = false;

  constructor(private router: Router) {}

  goMap() {
    this.router.navigate(['map']);
  }

  goList() {
    this.router.navigate(['cards']);
  }

  goCreateNew() {
    this.router.navigate(['cards/new']);
  }
}

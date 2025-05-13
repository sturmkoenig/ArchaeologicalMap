import { Component } from "@angular/core";
import { NotificationService } from "@service/notification.service";
import { MatSnackBar } from "@angular/material/snack-bar";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  standalone: false,
})
export class AppComponent {
  title = "archaological-map";

  constructor(
    private notificationService: NotificationService,
    private snackBar: MatSnackBar,
  ) {
    notificationService.notifications$.subscribe((notification) => {
      this.snackBar.open(notification.text);
    });
  }
}

import { Injectable } from "@angular/core";
import { Subject } from "rxjs";

type Notification = {
  text: string;
};

@Injectable({
  providedIn: "root",
})
export class NotificationService {
  notifications$ = new Subject<Notification>();

  createNotification(notification: Notification) {
    this.notifications$.next(notification);
  }
}

import { Injectable } from "@angular/core";
import { Subject } from "rxjs";

type Notifcation = {
  text: string;
};

@Injectable({
  providedIn: "root",
})
export class NotificationService {
  notifications$ = new Subject<Notifcation>();

  createNotification(notification: Notifcation) {
    this.notifications$.next(notification);
  }
}

import { Injectable } from "@angular/core";
import { invoke } from "@tauri-apps/api/core";

import { Stack, StackPost } from "../model/stack";
import { NotificationService } from "@service/notification.service";

@Injectable({
  providedIn: "root",
})
export class StackService {
  constructor(private notificationService: NotificationService) {}

  createStack(newStack: StackPost): Promise<Stack | undefined> {
    if (newStack.name === undefined || newStack.name === "") {
      this.notificationService.createNotification({
        text: "Fehler: Name muss definiert sein",
      });
      return new Promise(() => undefined);
    }
    if (newStack.image_name === undefined || newStack.image_name === "") {
      this.notificationService.createNotification({
        text: "Fehler: Bild fehlt",
      });
      return new Promise(() => undefined);
    }
    return invoke<Stack>("create_stack", {
      stack: {
        name: newStack.name,
        image_name: newStack.image_name,
      },
    })
      .then((stack) => {
        this.notificationService.createNotification({
          text: "Stack gespeichert",
        });
        return stack;
      })
      .catch((error: string) => {
        console.log(error);
        this.notificationService.createNotification({ text: error });
        return undefined;
      });
  }
  getAll(): Promise<Stack[]> {
    return invoke("read_all_stacks", {});
  }
  async getStackById(id: string): Promise<Stack> {
    return invoke("read_stack_by_id", { id });
  }
  async deleteStack(
    stackIdToDelete: number,
    stackHeaderImage: string,
  ): Promise<void> {
    return invoke("delete_stack", { stackId: stackIdToDelete });
  }
}

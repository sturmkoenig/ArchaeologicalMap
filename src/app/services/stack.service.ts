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
    if (newStack.imageName === undefined || newStack.imageName === "") {
      this.notificationService.createNotification({
        text: "Fehler: Bild fehlt",
      });
      return new Promise(() => undefined);
    }
    return invoke<Stack>("create_stack", {
      stack: newStack,
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
  updateStack(updatedStack: Stack): Promise<Stack | undefined> {
    console.log("update stack", updatedStack);
    if (!updatedStack.id) {
      this.notificationService.createNotification({
        text: "Stack kann nicht gespeichert werden",
      });
      return new Promise(() => undefined);
    }
    return invoke<Stack>("update_stack", { updatedStack }).catch(
      (error: string) => {
        this.notificationService.createNotification({ text: error });
        return undefined;
      },
    );
  }
  getAll(): Promise<Stack[]> {
    return invoke("read_all_stacks", {});
  }
  async getStackById(id: string): Promise<Stack> {
    return invoke("read_stack_by_id", { id });
  }
  async deleteStack(stackIdToDelete: number): Promise<void> {
    return invoke<void>("delete_stack", { stackId: stackIdToDelete }).catch(
      (error: string) => {
        this.notificationService.createNotification({ text: error });
      },
    );
  }
}

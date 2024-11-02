import { Injectable } from "@angular/core";
import { invoke } from "@tauri-apps/api/core";

import { Stack, StackPost } from "../model/stack";

@Injectable({
  providedIn: "root",
})
export class StackService {
  createStack(newStack: StackPost): Promise<Stack> {
    return invoke("create_stack", {
      stack: {
        name: newStack.name,
        image_name: newStack.image_name,
      },
    });
  }
  getAll(): Promise<Stack[]> {
    return invoke("read_all_stacks", {});
  }
  async deleteStack(
    stackIdToDelete: number,
    stackHeaderImage: string,
  ): Promise<void> {
    return invoke("delete_stack", { stackId: stackIdToDelete });
  }
}

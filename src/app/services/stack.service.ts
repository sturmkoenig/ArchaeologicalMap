import { Injectable } from "@angular/core";
import { invoke } from "@tauri-apps/api";
import { Stack, StackPost } from "../model/stack";

@Injectable({
  providedIn: "root",
})
export class StackService {
  createStack(newStack: StackPost): Promise<Stack> {
    let createdStack: Promise<Stack> = invoke("create_stack", {
      stack: {
        name: newStack.name,
        image_name: newStack.image_name,
      },
    });
    return createdStack;
  }
  getAll(): Promise<Stack[]> {
    return invoke("read_all_stacks", {});
  }
}

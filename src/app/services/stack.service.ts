import { Injectable } from "@angular/core";
import { invoke } from "@tauri-apps/api";
import { StackDB } from "../model/stack";

@Injectable({
  providedIn: "root",
})
export class StackService {
  createStack(newStack: StackDB): void {
    invoke("create_stack", {
      stack: {
        name: newStack.name,
        image_name: newStack.image_name,
      },
    });
  }
  readAllStacks(): Promise<StackDB[]> {
    return invoke("read_all_stacks", {});
  }
}

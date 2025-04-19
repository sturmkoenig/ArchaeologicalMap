import { Pipe, PipeTransform } from "@angular/core";

@Pipe({
  name: "filterEmptyTitle",
  standalone: false,
})
export class FilterPipe implements PipeTransform {
  transform<T extends { title: string }>(items: T[]): T[] {
    return items.filter((item) => item.title.trim() !== "");
  }
}

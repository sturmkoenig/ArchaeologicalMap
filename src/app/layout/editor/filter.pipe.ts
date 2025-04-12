import { Pipe, PipeTransform } from "@angular/core";

@Pipe({
  name: "filter",
  standalone: false,
})
export class FilterPipe implements PipeTransform {
  transform(items: any[], searchText: string): any[] {
    if (!items) return [];
    if (!searchText) return items;
    return items.filter((item) => {
      return Object.keys(item).some((key) => {
        return String(item[key])
          .toLocaleLowerCase()
          .includes(searchText.toLocaleLowerCase());
      });
    });
  }
}

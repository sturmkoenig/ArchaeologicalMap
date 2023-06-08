import { Injectable, Type } from "@angular/core";
import { NewCard } from "../model/card";
import { ICONS } from "./icon.service";

@Injectable({
  providedIn: "root",
})
export class RandomCardsService {
  constructor() {}

  getRandomCoordinate(min: number, max: number): number {
    return Math.random() * (max - min) + min;
  }

  getRandomIconName(): keyof typeof ICONS {
    const icons = ["iconChurch", "iconMonument", "iconDefault"];
    const randomIndex = Math.floor(Math.random() * icons.length);
    return icons[randomIndex] as keyof typeof ICONS;
  }

  generateRandomEntity(): NewCard {
    const titles = ["Title A", "Title B", "Title C", "Title D"]; // List of possible titles
    const titleIndex = Math.floor(Math.random() * titles.length);
    const title = titles[titleIndex];

    const description = "Sample Description"; // Replace with your logic to generate a random description
    const longitude = this.getRandomCoordinate(-180, 180);
    const latitude = this.getRandomCoordinate(-90, 90);
    const coordinateRadius = Math.floor(Math.random() * 1001); // Random radius between 0 and 1000
    const iconName = this.getRandomIconName();

    return {
      title,
      description,
      markers: [
        {
          latitude: latitude,
          longitude: longitude,
          radius: coordinateRadius,
          icon_name: iconName,
        },
      ],
    };
  }
}

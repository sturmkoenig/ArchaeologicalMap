import { Injectable } from "@angular/core";

export enum ICONS {
  iconChurch = "assets/icon-church.png",
  iconMonument = "assets/icon-monument.png",
  iconDefault = "assets/icon-am.png",
}

@Injectable({
  providedIn: "root",
})
export class IconService {
  constructor() {}

  getIconPath(iconName: keyof typeof ICONS): String {
    return ICONS[iconName];
  }
}

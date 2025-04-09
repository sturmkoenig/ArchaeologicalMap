import {
  Circle,
  DivIcon,
  LatLngExpression,
  Marker,
  MarkerOptions,
} from "leaflet";
import { Card, MarkerDB } from "@app/model/card";
import { ICONS } from "@service/icon.service";
import { RadiusVisibility } from "@app/model/marker";
import { createCardDetailsWindow } from "@app/util/window-util";

export class MarkerAM extends Marker {
  private _title: string;
  private _iconType: keyof typeof ICONS;
  private _radiusLayer?: Circle;
  private _iconSize: number = 20;
  private _description: string;
  private _cardId: number;
  private _regionImageId?: number;

  get iconType(): keyof typeof ICONS {
    return this._iconType;
  }

  get radiusLayer(): Circle | undefined {
    return this._radiusLayer;
  }
  get cardId() {
    return this._cardId;
  }

  constructor(
    latlng: LatLngExpression,
    options?: MarkerOptions,
    card?: Partial<Card>,
    amOptions?: {
      iconType?: keyof typeof ICONS;
      iconSize?: number;
    },
  ) {
    super(latlng, options);
    this._description = card?.description ?? "";
    this._title = card?.title ?? "";
    this._cardId = card?.id ?? 0;
    this._iconType = card?.icon_name ?? "iconBorderLimesBlack";
    this._regionImageId = card?.region_image_id;
    this._iconSize = amOptions?.iconSize ?? 20;
    if (card?.radius) {
      this._radiusLayer = new Circle(latlng, {
        radius: card.radius ?? 0,
        opacity: 0,
        fillOpacity: 0,
      });
      this.visibilityOfRadius(RadiusVisibility.onHover);
    }
    this.setIconType(this.iconType);
  }

  visibilityOfRadius(opt: RadiusVisibility): void {
    if (this._radiusLayer === undefined) {
      return;
    }
    if (opt === "onHover") {
      this._radiusLayer.setStyle({ opacity: 0, fillOpacity: 0 });
      this.on("mouseover", () => {
        this._radiusLayer?.setStyle({ opacity: 1, fillOpacity: 0.2 });
      });
      this.on("mouseout", () => {
        this.feature?.geometry;
        this._radiusLayer?.setStyle({ opacity: 0, fillOpacity: 0 });
      });
    } else if (opt === "always") {
      this.off("mouseover");
      this.off("mouseout");
      this._radiusLayer?.setStyle({ opacity: 1, fillOpacity: 0.2 });
    }
  }

  setIconType(iconType: keyof typeof ICONS): void {
    this._iconType = iconType;
    const htmlString = `
    <div style="display: flex; flex-direction: column; width: 100px; align-items: center; transform: translateX(-44px)">
        <img class="my-div-image" style="width: ${this._iconSize}px; height: ${this._iconSize}px" src='${ICONS[iconType]}' alt="icon of archaeological feature"/>
        <span class="my-div-span" style="background: white; width: auto; font-size: 9px; background-color: rgba(255, 0, 0, 0); ">${this._title ?? ""}</span>
    </div> 
     `;
    const icon: DivIcon = new DivIcon({
      className: "my-div-image",
      html: htmlString,
    });
    this.setIcon(icon);
    this.on("hover", () => {});
  }

  setRadius(radius: number | undefined): void {
    if (!radius || radius === 0) {
      this._radiusLayer = undefined;
    } else if (!this._radiusLayer) {
      this._radiusLayer = new Circle(this.getLatLng(), { radius: radius });
    } else {
      this._radiusLayer.setRadius(radius);
    }
  }

  override setLatLng(latlng: LatLngExpression): this {
    super.setLatLng(latlng);
    if (this._radiusLayer) {
      this._radiusLayer.setLatLng(latlng);
    }
    return this;
  }

  setIconSize(size: number): void {
    this._iconSize = size;
    this.setIconType(this.iconType);
  }

  /**
   * @deprecated
   */
  toMarkerDB(): MarkerDB {
    return {
      latitude: this.getLatLng().lat,
      longitude: this.getLatLng().lng,
      icon_name: this._iconType,
      radius: this._radiusLayer?.getRadius() ?? 0,
    };
  }

  toCard(): Card {
    return {
      latitude: this.getLatLng().lat,
      longitude: this.getLatLng().lng,
      icon_name: this._iconType,
      radius: this._radiusLayer?.getRadius() ?? 0,
      region_image_id: this._regionImageId,
      title: this._title,
      description: this._description,
      id: this._cardId,
    };
  }

  fromCard(card: Card): void {
    this._title = card.title;
    this._description = card.description;
    this._cardId = card.id ?? 0;
    this.setLatLng([card.latitude, card.longitude]);
    this.setRadius(card.radius);
    this.setIconType(card.icon_name);
  }

  createPopup() {
    const div: HTMLDivElement = document.createElement("div");
    div.innerHTML =
      `<h4>` + this._title + `</h4>` + `<p>` + this._description + `</p>`;
    const button = document.createElement("button");
    button.innerHTML = "Info-Seite Zeigen";
    button.onclick = () => {
      createCardDetailsWindow(this.cardId ?? 0);
    };
    div.appendChild(button);
    return div;
  }
  override bindPopup() {
    return super.bindPopup(this.createPopup());
  }
}

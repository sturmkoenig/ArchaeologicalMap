import {
  Circle,
  DivIcon,
  LatLngExpression,
  Layer,
  Marker,
  MarkerOptions,
} from "leaflet";
import { ICONS } from "../services/icon.service";
import { CardDB, MarkerDB } from "./card";

export const isMarkerAM = (marker: Layer): marker is MarkerAM => {
  return !!(marker as MarkerAM).markerId;
};

export enum RadiusVisibility {
  always = "always",
  onHover = "onHover",
}

export class MarkerAM extends Marker {
  private _markerId: number;
  private _cardId: number;
  private _card?: CardDB;
  private _iconType: keyof typeof ICONS;
  private _radiusLayer?: Circle;
  private _iconSize: number = 20;

  get markerId(): number {
    return this._markerId;
  }
  get cardId(): number {
    return this._cardId;
  }
  get iconType(): keyof typeof ICONS {
    return this._iconType;
  }
  get radiusLayer(): Circle | undefined {
    return this._radiusLayer;
  }

  constructor(
    fetchCard: (id: number) => Promise<CardDB>,
    latlng: LatLngExpression,
    options?: MarkerOptions,
    amOptions?: {
      radius?: number;
      markerId?: number;
      cardId?: number;
      iconType?: keyof typeof ICONS;
      iconSize?: number;
      loadCard?: boolean;
    },
  ) {
    super(latlng, options);
    this._markerId = amOptions?.markerId ?? 0;
    this._cardId = amOptions?.cardId ?? 0;
    this._iconType = amOptions?.iconType ?? "iconBorderLimesBlack";
    this._iconSize = amOptions?.iconSize ?? 20;
    if (amOptions?.radius) {
      this._radiusLayer = new Circle(latlng, {
        radius: amOptions.radius ?? 0,
        opacity: 0,
        fillOpacity: 0,
      });
      this.visibilityOfRadius(RadiusVisibility.onHover);
    }
    this.setIconType(this.iconType);

    if (amOptions?.loadCard) {
      fetchCard(amOptions?.cardId ?? 0).then((card: CardDB) => {
        this._card = card;
        this.setIconType(this._iconType);
      });
    }
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
        <img class="my-div-image" style="width: ${this._iconSize}px; height: ${this._iconSize}px" src='${ICONS[iconType]}'/>
        <span class="my-div-span" style="background: white; width: 50px">${this._card?.title ?? ""}</span>
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
  toMarkerDB(): MarkerDB {
    return {
      id: this._markerId,
      card_id: this._cardId,
      latitude: this.getLatLng().lat,
      longitude: this.getLatLng().lng,
      icon_name: this._iconType,
      radius: this._radiusLayer?.getRadius() ?? 0,
    };
  }
  fromMarkerDB(markerDB: Partial<MarkerDB>): void {
    this._cardId = markerDB.card_id ?? 0;
    this._markerId = markerDB.id ?? 0;
    this.setIconType(markerDB.icon_name as keyof typeof ICONS);
    this.setRadius(markerDB.radius);
  }
}

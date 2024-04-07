import {
  Circle,
  Icon,
  LatLngExpression,
  LayerGroup,
  Marker,
  MarkerOptions,
} from "leaflet";
import { ICONS } from "../services/icon.service";
import { Observable } from "rxjs";
import { MarkerDB } from "./card";

export enum RadiusVisibility {
  always = "always",
  onHover = "onHover",
}

export class MarkerAM extends Marker {
  private _markerId: number;
  private _cardId: number;
  private _iconType: keyof typeof ICONS;
  private _radiusLayer?: Circle;

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
    latlng: LatLngExpression,
    options?: MarkerOptions,
    amOptions?: any,
  ) {
    super(latlng, options);
    this._markerId = amOptions.markerId;
    this._cardId = amOptions.cardId;
    this._iconType = amOptions.iconType;
    if (amOptions.radius) {
      this._radiusLayer = new Circle(latlng, {
        radius: amOptions.radius,
        opacity: 0,
        fillOpacity: 0,
      });
      this.visibilityOfRadius(RadiusVisibility.onHover);
    }
    let icon: Icon = new Icon({
      iconUrl: ICONS[this._iconType] ?? ICONS.iconMiscRed,
      iconSize: [amOptions.iconSize ?? 20, amOptions.iconSize ?? 20],
      popupAnchor: [0, 0],
    });

    this.setIcon(icon);
  }
  visibilityOfRadius(opt: RadiusVisibility): void {
    if (this._radiusLayer === undefined) {
      return;
    }
    if (opt === "onHover") {
      this.on("mouseover", () => {
        this._radiusLayer?.setStyle({ opacity: 1, fillOpacity: 0.2 });
      });
      this.on("mouseout", () => {
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
    let icon: Icon = new Icon({
      iconUrl: ICONS[this._iconType] ?? ICONS.iconMiscRed,
      iconSize: [20, 20],
      popupAnchor: [0, 0],
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
    let icon: Icon = new Icon({
      iconUrl: ICONS[this._iconType],
      iconSize: [size, size],
      popupAnchor: [0, 0],
    });
    this.setIcon(icon);
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

import { Layer } from "leaflet";
import { MarkerAM } from "@app/model/markerAM";

export const isMarkerAM = (marker: Layer): marker is MarkerAM => {
  return !!(marker as MarkerAM).cardId;
};

export enum RadiusVisibility {
  always = "always",
  onHover = "onHover",
}

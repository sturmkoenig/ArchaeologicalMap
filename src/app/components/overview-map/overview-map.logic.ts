import { LayerGroup } from "leaflet";
import { CardMarkerLayer } from "src/app/services/marker.service";

export function addMarkerLayerToLayerGroup(
  cardMarkerLayer: CardMarkerLayer,
  layerGroup: LayerGroup,
) {}

export function MarkerDiff(
  currentMarkerIds: number[],
  previousMarkerIds?: number[],
): { markerIdsToAdd: number[]; markerIdsToRemove: number[] } {
  if (!previousMarkerIds) {
    return {
      markerIdsToAdd: currentMarkerIds,
      markerIdsToRemove: [],
    };
  }

  let markerIdsToRemove: number[] = previousMarkerIds.filter(
    (lastMarker) => currentMarkerIds.indexOf(lastMarker) < 0,
  );
  let markerIdsToAdd: number[] = currentMarkerIds.filter(
    (newMarker) => previousMarkerIds.indexOf(newMarker) < 0,
  );

  return {
    markerIdsToAdd: markerIdsToAdd,
    markerIdsToRemove: markerIdsToRemove,
  };
}

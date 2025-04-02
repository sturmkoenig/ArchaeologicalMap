import { effect, Injectable, signal, WritableSignal } from "@angular/core";
import {
  LatLng,
  LatLngBounds,
  Layer,
  LayerGroup,
  MarkerClusterGroup,
} from "leaflet";
import { MarkerService } from "./marker.service";
import { isMarkerAM, RadiusVisibility } from "../model/marker";
import { Card } from "../model/card";
import { CardService } from "./card.service";
import { IconKeys, IconService } from "./icon.service";
import { MarkerAM } from "@app/model/markerAM";

@Injectable()
export class OverviewMapService {
  public readonly mainLayerGroup: LayerGroup;
  public clusterGroup!: MarkerClusterGroup;
  public readonly selectedLayerGroup: LayerGroup;
  public readonly radiusLayerGroup: LayerGroup;
  public showLabels?: boolean;
  iconSizeMap: Map<IconKeys, number> = new Map();
  selectedMarker: WritableSignal<MarkerAM | undefined>;
  /**
   * @deprecated
   */
  editCard: WritableSignal<Card | undefined>;

  constructor(
    private markerService: MarkerService,
    private cardService: CardService,
    private iconService: IconService,
  ) {
    this.mainLayerGroup = new LayerGroup();
    this.selectedLayerGroup = new LayerGroup();
    this.radiusLayerGroup = new LayerGroup();
    this.selectedMarker = signal<MarkerAM | undefined>(undefined);
    this.editCard = signal<Card | undefined>(undefined);
    this.iconService
      .getIconSizeSettings()
      .then((iconSizeMap: Map<IconKeys, number>) => {
        this.iconSizeMap = iconSizeMap;
      });

    effect(() => {
      this.selectedLayerGroup.clearLayers();
      if (this.selectedMarker()) {
        this.removeLayerFromMainLayerGroup(this.selectedMarker()!);
        this.selectedMarker()!.addTo(this.selectedLayerGroup);
        if (this.selectedMarker()?.radiusLayer) {
          this.radiusLayerGroup.addLayer(this.selectedMarker()!.radiusLayer!);
        }
        this.selectedMarker()!.visibilityOfRadius(RadiusVisibility.always);
        this.cardService.readCard(this.selectedMarker()!.cardId).then((c) => {
          this.editCard.set(c);
          this.selectedMarker()?.bindPopup();
          this.selectedMarker()!.openPopup();
        });
      }
    });
  }

  setMarkerClusterLayerGroup(markerClusterLayerGroup: MarkerClusterGroup) {
    this.clusterGroup = markerClusterLayerGroup;
  }

  resetMainLayerGroup(): void {
    if (!this.clusterGroup) {
      return;
    }
    this.mainLayerGroup.clearLayers();
    this.clusterGroup.clearLayers();
  }

  changeSelectedMarker(marker?: MarkerAM): void {
    if (marker?.cardId === this.selectedMarker()?.cardId) {
      return;
    }
    this.selectedLayerGroup.clearLayers();
    this.addLayerToMainLayerGroup(this.selectedMarker());
    this.selectedMarker.set(marker);
  }

  async addNewCard(latLng: LatLng): Promise<void> {
    const newCard: Card = {
      title: "",
      description: "",
      icon_name: "iconMiscRed",
      radius: 0.0,
      latitude: latLng.lat,
      longitude: latLng.lng,
    };
    await this.cardService.createCard(newCard).then((c) => {
      this.editCard.set(c);
      this.changeSelectedMarker(new MarkerAM(latLng, {}, c));
    });
  }

  moveSelectedMarker(latLng: LatLng): void {
    this.selectedMarker()?.setLatLng(latLng);
    this.selectedMarker.set(this.selectedMarker());
    const updatedCard = this.selectedMarker()?.toCard();
    if (updatedCard) this.cardService.updateCard(updatedCard);
  }

  async reloadSelectedMarker() {
    await this.markerService
      .getMarker(this.selectedMarker()!.cardId)
      .then((m) => {
        this.selectedLayerGroup.clearLayers();
        this.selectedMarker.set(m);
      });
  }
  updateEditCard(changedCardMetaData: Partial<Card>) {
    const currentCard = this.selectedMarker();
    if (!currentCard) {
      return;
    }
    const newCard: Card = {
      ...currentCard.toCard(),
      ...changedCardMetaData,
    };
    this.selectedMarker.set(
      new MarkerAM([newCard.latitude, newCard.longitude], {}, newCard, {
        iconSize: this.iconSizeMap.get(newCard.icon_name),
      }),
    );
    this.editCard.set(newCard);
    this.cardService.updateCard(newCard);
  }

  async deleteEditCard(): Promise<void> {
    const deleteCardId = this.selectedMarker()?.cardId;
    if (deleteCardId === undefined) {
      return;
    }
    await this.cardService.deleteCard(deleteCardId);
    this.editCard.set(undefined);
    this.selectedLayerGroup.clearLayers();
    this.selectedMarker.set(undefined);
    this.mainLayerGroup.eachLayer((l) => {
      if (l instanceof MarkerAM && l.cardId === deleteCardId) {
        this.removeLayerFromMainLayerGroup(l);
      }
    });
  }

  addLayerToMainLayerGroup(marker?: MarkerAM): void {
    if (!marker) {
      return;
    }
    this.mainLayerGroup.addLayer(marker);
    this.clusterGroup.addLayer(marker);
    marker.on("click", () => {
      this.changeSelectedMarker(marker);
    });

    if (marker.radiusLayer) {
      marker.visibilityOfRadius(RadiusVisibility.onHover);
      this.radiusLayerGroup.addLayer(marker.radiusLayer);
    }
  }

  removeLayerFromMainLayerGroup(marker: MarkerAM): void {
    this.mainLayerGroup.removeLayer(marker);
    this.clusterGroup.removeLayer(marker);
    if (marker.radiusLayer) {
      this.radiusLayerGroup.removeLayer(marker.radiusLayer);
    }
  }

  async updateIconSize(iconKey: IconKeys, newSize: number) {
    this.iconSizeMap.set(iconKey, newSize);
    this.mainLayerGroup.getLayers().forEach((l) => {
      if (l instanceof MarkerAM && l.iconType === iconKey) {
        l.setIconSize(newSize);
      }
    });
    this.clusterGroup.getLayers().forEach((l) => {
      if (isMarkerAM(l) && l.iconType === iconKey) {
        l.setIconSize(newSize);
      }
    });
    this.selectedLayerGroup.getLayers().forEach((l) => {
      if (isMarkerAM(l) && l.iconType === iconKey) {
        l.setIconSize(newSize);
      }
    });
  }

  async updateMapBounds(bounds: LatLngBounds) {
    await this.markerService.getMarkerAMInArea(bounds).then((markers) => {
      // remove markers that are not in the new bounds
      this.mainLayerGroup.getLayers().map((l) => {
        if (l instanceof MarkerAM) {
          const wasRemoved = !markers.some((m) => m.cardId === l.cardId);
          if (wasRemoved) {
            this.removeLayerFromMainLayerGroup(l);
          }
        }
      });
      // add new markers
      markers.filter((m) => {
        const wasAdded = !this.mainLayerGroup
          .getLayers()
          .some((l) => l instanceof MarkerAM && l.cardId === m.cardId);
        if (wasAdded && m.cardId !== this.selectedMarker()?.cardId) {
          this.addLayerToMainLayerGroup(m);
        }
      });
    });
  }

  highlightMarker(highlightedMarkerIds: number[]) {
    this.clusterGroup
      .getLayers()
      .filter(
        (marker: Layer) =>
          marker instanceof MarkerAM &&
          highlightedMarkerIds.find((id) => id === marker.cardId) !== undefined,
      )
      .forEach((marker: Layer) => {
        marker.bindTooltip("searched marker");
        marker.toggleTooltip();
      });
  }
}

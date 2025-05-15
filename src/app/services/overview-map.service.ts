import {
  computed,
  effect,
  Injectable,
  Signal,
  signal,
  WritableSignal,
} from "@angular/core";
import { LatLng, LatLngBounds, Layer, LayerGroup } from "leaflet";
import { MarkerService } from "./marker.service";
import { isMarkerAM, RadiusVisibility } from "../model/marker";
import { Card } from "../model/card";
import { CardService } from "./card.service";
import { IconKeys, IconService } from "./icon.service";
import { MarkerAM } from "@app/model/markerAM";

@Injectable()
export class OverviewMapService {
  public readonly mainLayerGroup: LayerGroup;
  public readonly selectedLayerGroup: LayerGroup;
  public readonly radiusLayerGroup: LayerGroup;
  public showLabels?: boolean;
  iconSizeMap: Map<IconKeys, number> = new Map();
  selectedMarker: WritableSignal<MarkerAM | undefined>;
  editCard: Signal<Card | undefined>;

  constructor(
    private markerService: MarkerService,
    private cardService: CardService,
    private iconService: IconService,
  ) {
    this.mainLayerGroup = new LayerGroup();
    this.selectedLayerGroup = new LayerGroup();
    this.radiusLayerGroup = new LayerGroup();
    this.selectedMarker = signal<MarkerAM | undefined>(undefined);
    this.editCard = computed(() => this.selectedMarker()?.toCard());
    this.iconService
      .getIconSizeSettings()
      .then((iconSizeMap: Map<IconKeys, number>) => {
        this.iconSizeMap = iconSizeMap;
      });

    effect(() => {
      this.selectedLayerGroup.clearLayers();
      if (this.selectedMarker()) {
        this.radiusLayerGroup.clearLayers();
        this.removeLayerFromMainLayerGroup(this.selectedMarker()!);
        this.selectedMarker()!.addTo(this.selectedLayerGroup);
        if (this.selectedMarker()?.radiusLayer) {
          this.radiusLayerGroup.addLayer(this.selectedMarker()!.radiusLayer!);
        }
        this.selectedMarker()!.visibilityOfRadius(RadiusVisibility.always);
        this.selectedMarker()?.bindPopup();
        this.selectedMarker()!.openPopup();
      }
    });
  }

  resetMainLayerGroup(): void {
    this.mainLayerGroup.clearLayers();
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
      iconName: "iconMiscRed",
      radius: 0.0,
      latitude: latLng.lat,
      longitude: latLng.lng,
    };
    await this.cardService.createCard(newCard).then((c) => {
      this.changeSelectedMarker(new MarkerAM(latLng, {}, c));
    });
  }

  moveSelectedMarker(latLng: LatLng): void {
    this.selectedMarker()?.setLatLng(latLng);
    this.selectedMarker.set(this.selectedMarker());
    const updatedCard = this.selectedMarker()?.toCard();
    if (updatedCard) this.cardService.updateCard(updatedCard);
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
        iconSize: this.iconSizeMap.get(newCard.iconName),
      }),
    );
    this.cardService.updateCard(newCard);
  }

  async deleteEditCard(): Promise<void> {
    const deleteCardId = this.selectedMarker()?.cardId;
    if (deleteCardId === undefined) {
      return;
    }
    await this.cardService.deleteCard(deleteCardId);
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
    this.selectedLayerGroup.getLayers().forEach((l) => {
      if (isMarkerAM(l) && l.iconType === iconKey) {
        l.setIconSize(newSize);
      }
    });
  }

  async updateMapBounds(bounds: LatLngBounds, selectMarkerId?: number) {
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
    if (selectMarkerId) {
      this.changeSelectedMarker(
        this.mainLayerGroup
          .getLayers()
          .find(
            (marker: Layer) => (marker as MarkerAM).cardId === selectMarkerId,
          ) as MarkerAM,
      );
    }
  }
}

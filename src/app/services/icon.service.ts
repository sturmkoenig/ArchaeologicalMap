import { Injectable } from "@angular/core";

export enum ICONS {
  iconCaveBlack = "assets/icons/cave_black.svg ",
  iconCaveRed = "assets/icons/cave_red.svg ",
  iconCaveSpecial = "assets/icons/cave_special.svg",
  iconPaintedCaveBlack = "assets/icons/painted_cave_black.svg",
  iconPaintedCaveRed = "assets/icons/painted_cave_red.svg",
  iconPaintedCaveSpecial = "assets/icons/painted_cave_special.svg",
  iconMegalithicTombstoneBlack = "assets/icons/megalithic_tombstone_black.svg",
  iconMegalithicTombstoneRed = "assets/icons/megalithic_tombstone_red.svg",
  iconMegalithicTombstoneSpecial = "assets/icons/megalithic_tombstone_special.svg",
  iconBurialMoundBlack = "assets/icons/burial_mound_black.svg",
  iconBurialMoundRed = "assets/icons/burial_mound_red.svg ",
  iconBurialMoundSpecial = "assets/icons/burial_mound_special.svg",
  iconMiscBlack = "assets/icons/misc_black.svg",
  iconMiscRed = "assets/icons/misc_red.svg",
  iconMiscSpecial = "assets/icons/misc_special.png",
  iconMiscCarvedBlack = "assets/icons/misc_carved_black.svg",
  iconMiscCarvedRed = "assets/icons/misc_carved_red.svg",
  iconMiscCarvedSpecial = "assets/icons/misc_carved_special.svg",
  iconRomanBlack = "assets/icons/roman_black.svg",
  iconRomanRed = "assets/icons/roman_red.svg",
  iconRomanSpecial = "assets/icons/roman_special.svg",
  iconRuneStoneBlack = "assets/icons/rune_stone_black.svg",
  iconRuneStoneRed = "assets/icons/rune_stone_red.svg",
  iconRuneStoneSpecial = "assets/icons/rune_stone_special.svg",
  iconChristianChurchRed = "assets/icons/christian_church_red.svg",
  iconChristianChurchBlack = "assets/icons/christian_church_black.svg",
  iconChristianChurchSpecial = "assets/icons/christian_church_special.svg",
  iconPetroglyphBlack = "assets/icons/petroglyph_black.svg",
  iconPetroglyphRed = "assets/icons/petroglyph_red.svg",
  iconPetroglyphSpecial = "assets/icons/petroglyph_special.svg",
  iconFortifiedSettlementBlack = "assets/icons/fortified_settlement_black.svg",
  iconFortifiedSettlementRed = "assets/icons/fortified_settlement_red.svg",
  iconFortifiedSettlementSpecial = "assets/icons/fortified_settlement_special.svg",
  iconRomanSettlementMilitaryBlack = "assets/icons/roman_settlement_military_black.svg",
  iconRomanSettlementMilitaryRed = "assets/icons/roman_settlement_military_red.svg",
  iconRomanSettlementMilitarySpecial = "assets/icons/roman_settlement_military_special.svg",
  iconRomanSettlementBlack = "assets/icons/roman_settlement_black.svg",
  iconRomanSettlementRed = "assets/icons/roman_settlement_red.svg",
  iconRomanSettlementSpecial = "assets/icons/roman_settlement_special.svg",
  iconBorderLimesBlack = "assets/icons/border_limes_black.svg",
  iconBorderLimesRed = "assets/icons/border_limes_red.svg",
  iconBorderLimesSpecial = "assets/icons/border_limes_special.svg",
  iconChurchBlack = "assets/icons/church_black.svg",
  iconChurchRed = "assets/icons/church_red.svg",
  iconSingleMonumentBlack = "assets/icons/single_monument_black.svg",
  iconSingleMonumentRed = "assets/icons/single_monument_red.svg",
  iconSingleMonumentSpecial = "assets/icons/single_monument_special.svg",
  iconMonumentMiscBlack = "assets/icons/monument_misc_black.svg",
  iconMonumentMiscRed = "assets/icons/monument_misc_red.svg",
  iconMonumentMiscSpecial = "assets/icons/monument_misc_special.svg",
  iconMuseumBlack = "assets/icons/museum_black.svg",
  iconMuseumRed = "assets/icons/museum_red.svg",
  iconMuseumSpecial = "assets/icons/museum_special.svg",
  iconMonumentBlack = "assets/icons/monument_black.svg",
  iconMonumentRed = "assets/icons/monument_red.svg",
  iconMonumentSpecial = "assets/icons/monument_special.svg",
  iconChristianBlack = "assets/icons/christian_black.svg",
  iconChristianRed = "assets/icons/christian_red.svg",
  iconChristianSpecial = "assets/icons/christian_special.svg",
  // "assets/icons/field_of_burial_mounds_special.svg"
}

export const iconsSorted = {
  iconBorderLimes: [
    ICONS.iconBorderLimesRed,
    ICONS.iconBorderLimesBlack,
    ICONS.iconBorderLimesSpecial,
  ],
  iconMonument: [
    ICONS.iconMonumentRed,
    ICONS.iconMonumentBlack,
    ICONS.iconMonumentSpecial,
  ],
  iconPaintedCave: [
    ICONS.iconPaintedCaveRed,
    ICONS.iconPaintedCaveBlack,
    ICONS.iconPaintedCaveSpecial,
  ],
  iconBurialMound: [
    ICONS.iconBurialMoundRed,
    ICONS.iconBurialMoundBlack,
    ICONS.iconBurialMoundSpecial,
  ],
  iconCave: [ICONS.iconCaveRed, ICONS.iconCaveBlack, ICONS.iconCaveSpecial],
  iconPetroglyph: [
    ICONS.iconPetroglyphRed,
    ICONS.iconPetroglyphBlack,
    ICONS.iconPetroglyphSpecial,
  ],
  iconChristianChurch: [
    ICONS.iconChristianChurchRed,
    ICONS.iconChristianChurchBlack,
    ICONS.iconChristianChurchSpecial,
  ],
  iconRoman: [ICONS.iconRomanRed, ICONS.iconRomanBlack, ICONS.iconRomanSpecial],
  iconChurch: [
    ICONS.iconChurchRed,
    ICONS.iconChurchBlack,
    // ICONS.iconChurchSpecial,
  ],
  iconRomanSettlement: [
    ICONS.iconRomanSettlementRed,
    ICONS.iconRomanSettlementBlack,
    ICONS.iconRomanSettlementSpecial,
  ],
  iconRomanSettlementMilitary: [
    ICONS.iconRomanSettlementMilitaryRed,
    ICONS.iconRomanSettlementMilitaryBlack,
    ICONS.iconRomanSettlementMilitarySpecial,
  ],
  iconFortifiedSettlement: [
    ICONS.iconFortifiedSettlementRed,
    ICONS.iconFortifiedSettlementBlack,
    ICONS.iconFortifiedSettlementSpecial,
  ],
  iconMisc: [ICONS.iconMiscRed, ICONS.iconMiscBlack, ICONS.iconMiscSpecial],
  iconMiscCarved: [
    ICONS.iconMiscCarvedRed,
    ICONS.iconMiscCarvedBlack,
    ICONS.iconMiscCarvedSpecial,
  ],
  iconRuneStone: [
    ICONS.iconRuneStoneRed,
    ICONS.iconRuneStoneBlack,
    ICONS.iconRuneStoneSpecial,
  ],
  iconSingleMonument: [
    ICONS.iconSingleMonumentRed,
    ICONS.iconSingleMonumentBlack,
    ICONS.iconSingleMonumentSpecial,
  ],
  iconMonumentMisc: [
    ICONS.iconMonumentMiscRed,
    ICONS.iconMonumentMiscBlack,
    ICONS.iconMonumentMiscSpecial,
  ],
  iconChristian: [
    ICONS.iconChristianRed,
    ICONS.iconChristianBlack,
    ICONS.iconChristianSpecial,
  ],
  iconMuseum: [
    ICONS.iconMuseumRed,
    ICONS.iconMuseumBlack,
    ICONS.iconMuseumSpecial,
  ],
  iconMegalithicTombstone: [
    ICONS.iconMegalithicTombstoneRed,
    ICONS.iconMegalithicTombstoneBlack,
    ICONS.iconMegalithicTombstoneSpecial,
  ],
};

@Injectable({
  providedIn: "root",
})
export class IconService {
  constructor() {}

  getIconPath(iconName: keyof typeof ICONS): String {
    if (ICONS[iconName]) {
      return ICONS[iconName];
    }
    return ICONS.iconMiscBlack;
  }
}

import { Injectable } from "@angular/core";

export enum ICONS {
  iconBorderLimesBlack = "assets/icons/border_limes_black.svg",
  iconMonumentMiscRed = "assets/icons/monument_misc_red.svg",
  iconBorderLimesRed = "assets/icons/border_limes_red.svg",
  iconMonumentRed = "assets/icons/monument_red.svg",
  iconBurialMoundBlack = "assets/icons/burial_mound_black.svg",
  iconPaintedCaveBlack = "assets/icons/painted_cave_black.svg",
  iconBurialMoundRed = "assets/icons/burial_mound_red.svg ",
  iconPaintedCaveRed = "assets/icons/painted_cave_red.svg",
  iconCaveBlack = "assets/icons/cave_black.svg ",
  iconCaveRed = "assets/icons/cave_red.svg ",
  iconPetroglyphBlack = "assets/icons/petroglyph_black.svg",
  iconChristianChurchBlack = "assets/icons/christian_church_black.svg",
  iconPetroglyphRed = "assets/icons/petroglyph_red.svg",
  iconChristianChurch_red = "assets/icons/christian_church_red.svg",
  iconRomanBlack = "assets/icons/roman_black.svg",
  iconChurchBlack = "assets/icons/church_black.svg",
  iconRomanRed = "assets/icons/roman_red.svg",
  iconChurchRed = "assets/icons/church_red.svg",
  iconRomanSettlementBlack = "assets/icons/roman_settlement_black.svg",
  iconFortifiedSettlementBlack = "assets/icons/fortified_settlement_black.svg",
  iconRomanSettlementMilitaryBlack = "assets/icons/roman_settlement_military_black.svg",
  iconFortifiedSettlement_red = "assets/icons/fortified_settlement_red.svg",
  iconRomanSettlementMilitaryRed = "assets/icons/roman_settlement_military_red.svg",
  iconMiscBlack = "assets/icons/misc_black.svg",
  iconMiscCarvedBlack = "assets/icons/misc_carved_black.svg",
  iconRomanSettlementRed = "assets/icons/roman_settlement_red.svg",
  iconMiscCarvedRed = "assets/icons/misc_carved_red.svg",
  iconRuneStoneBlack = "assets/icons/rune_stone_black.svg",
  iconMiscRed = "assets/icons/misc_red.svg",
  iconRuneStoneRed = "assets/icons/rune_stone_red.svg",
  iconMonumentBlack = "assets/icons/monument_black.svg",
  iconSingleMonumentBlack = "assets/icons/single_monument_black.svg",
  iconMonumentMiscBlack = "assets/icons/monument_misc_black.svg",
  iconSingleMonumentRed = "assets/icons/single_monument_red.svg",
}

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

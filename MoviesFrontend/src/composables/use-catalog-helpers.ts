import { useCatalogStore } from "../stores/catalog";
import type { Showtime } from "../types";

export function useCatalogHelpers() {
  const catalog = useCatalogStore();

  function movieFor(id: string) {
    return catalog.movieById(id);
  }

  function cinemaFor(id: string) {
    return catalog.cinemaById(id);
  }

  function roomFor(id: string) {
    return catalog.roomById(id);
  }

  function priceFor(format: Showtime["format"]) {
    return ({ "2D": 7, "3D": 9, IMAX: 10, VIP: 12 })[format];
  }

  return { movieFor, cinemaFor, roomFor, priceFor };
}

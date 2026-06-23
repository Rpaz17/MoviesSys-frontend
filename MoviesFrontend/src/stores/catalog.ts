import { defineStore } from "pinia";
import { ref } from "vue";
import { CATALOG_MOVIES, CINEMAS_DATA, CITIES, CUSTOMERS_DATA, ROOMS_DATA, SHOWTIMES_DATA } from "../data/mockData";
import type { CatalogMovie, Cinema, Customer, Room, Showtime } from "../types";

export const useCatalogStore = defineStore("catalog", () => {
  const movies = ref<CatalogMovie[]>(CATALOG_MOVIES.map((item) => ({ ...item })));
  const cinemas = ref<Cinema[]>(CINEMAS_DATA.map((item) => ({ ...item })));
  const rooms = ref<Room[]>(ROOMS_DATA.map((item) => ({ ...item })));
  const showtimes = ref<Showtime[]>(SHOWTIMES_DATA.map((item) => ({ ...item })));
  const customers = ref<Customer[]>(CUSTOMERS_DATA.map((item) => ({ ...item })));
  const cities = ref(CITIES.map((name, index) => ({ id: `CT${String(index + 1).padStart(3, "0")}`, name, active: true })));

  const movieById = (id: string) => movies.value.find((item) => item.id === id);
  const cinemaById = (id: string) => cinemas.value.find((item) => item.id === id);
  const roomById = (id: string) => rooms.value.find((item) => item.id === id);

  function upsertShowtime(next: Showtime) {
    const index = showtimes.value.findIndex((item) => item.id === next.id);
    if (index >= 0) showtimes.value[index] = next;
    else showtimes.value.unshift(next);
  }

  function cancelShowtime(id: string) {
    showtimes.value = showtimes.value.map((item) => item.id === id ? { ...item, status: "inactivo" } : item);
  }

  function toggleMovieStatus(id: string) {
    const order: CatalogMovie["status"][] = ["en-cartelera", "proximamente", "inactivo"];
    movies.value = movies.value.map((movie) => {
      if (movie.id !== id) return movie;
      const index = order.indexOf(movie.status);
      return { ...movie, status: order[(index + 1) % order.length] };
    });
  }

  function upsertCinema(next: Cinema) {
    const index = cinemas.value.findIndex((item) => item.id === next.id);
    if (index >= 0) cinemas.value[index] = next;
    else cinemas.value.unshift(next);
  }

  function upsertRoom(next: Room) {
    const index = rooms.value.findIndex((item) => item.id === next.id);
    if (index >= 0) rooms.value[index] = next;
    else rooms.value.unshift(next);
  }

  return { movies, cinemas, rooms, showtimes, customers, cities, movieById, cinemaById, roomById, upsertShowtime, cancelShowtime, toggleMovieStatus, upsertCinema, upsertRoom };
});

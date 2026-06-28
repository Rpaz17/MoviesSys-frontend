import { defineStore } from "pinia";
import { ref } from "vue";
import { peliculasService } from "../services/peliculas.service";
import { authService } from "../services/auth.service";
import type { CatalogMovie, Cinema, Customer, Room, Showtime } from "../types";

export const useCatalogStore = defineStore("catalog", () => {
  const movies = ref<CatalogMovie[]>([]);
  const cinemas = ref<Cinema[]>([]);
  const rooms = ref<Room[]>([]);
  const showtimes = ref<Showtime[]>([]);
  const customers = ref<Customer[]>([]);
  const cities = ref<{ id: string; name: string; active: boolean }[]>([]);
  const idiomaNames = ref<Map<string, string>>(new Map());
  const generoNames = ref<Map<string, string>>(new Map());
  const ciudadNames = ref<Map<string, string>>(new Map());

  const movieById = (id: string) => movies.value.find((item) => item.id === id);
  const cinemaById = (id: string) => cinemas.value.find((item) => item.id === id);
  const roomById = (id: string) => rooms.value.find((item) => item.id === id);

  async function loadFromAPI(): Promise<void> {
    try {
      const [data, idiomas, generos, cineData, ciudadData] = await Promise.all([
        peliculasService.search().catch(() => [] as Awaited<ReturnType<typeof peliculasService.search>>),
        peliculasService.getIdiomas().catch(() => [] as Awaited<ReturnType<typeof peliculasService.getIdiomas>>),
        peliculasService.getGeneros().catch(() => [] as Awaited<ReturnType<typeof peliculasService.getGeneros>>),
        peliculasService.getCines().catch(() => [] as Awaited<ReturnType<typeof peliculasService.getCines>>),
        peliculasService.getCiudades().catch(() => [] as Awaited<ReturnType<typeof peliculasService.getCiudades>>),
      ]);

      idiomaNames.value = new Map(idiomas.map((i) => [String(i.id), i.nombre]));
      generoNames.value = new Map(generos.map((g) => [String(g.id), g.nombre]));
      ciudadNames.value = new Map(ciudadData.map((c) => [String(c.id), c.nombre]));

      movies.value = data.map((m) => ({
        id: String(m.id),
        title: m.titulo,
        genre: generoNames.value.get(String(m.id_genero)) ?? "Desconocido",
        language: idiomaNames.value.get(String(m.id_idioma)) ?? "Desconocido",
        rating: "NR",
        duration: "120 min",
        releaseDate: m.fecha_estreno ?? "",
        director: "",
        activo: m.activo !== false,
        reservations: 0,
        revenue: "$0",
        img: m.poster_url ?? "",
      }));

      cinemas.value = cineData.map((c) => ({
        id: String(c.id),
        name: c.nombre,
        address: c.direccion ?? "",
        city: ciudadNames.value.get(String(c.id_ciudad)) ?? "Desconocido",
        status: "activo" as const,
        rooms: 0,
        functions: 0,
        revenue: "$0",
        img: "",
      }));

      cities.value = ciudadData.map((c) => ({
        id: String(c.id),
        name: c.nombre,
        active: true,
      }));
    } catch {
      // stay empty if API unavailable
    }
  }

  async function loadFunctionsForMovie(movieId: string): Promise<void> {
    const results = await Promise.allSettled(
      cinemas.value.map((cine) =>
        peliculasService.getFunciones(movieId, cine.id),
      ),
    );

    const allFunciones: Showtime[] = [];
    const newRooms: Room[] = [];

    results.forEach((result, idx) => {
      if (result.status !== "fulfilled") return;
      const cine = cinemas.value[idx];
      for (const f of result.value) {
        const roomId = String(f.salas.id);
        const roomName = f.salas.nombre;
        const cinemaId = cine.id;
        const cinemaName = cine.name;

        if (!rooms.value.find((r) => r.id === roomId) && !newRooms.find((r) => r.id === roomId)) {
          newRooms.push({
            id: roomId,
            name: roomName,
            cinemaId,
            cinema: cinemaName,
            type: "2D",
            rows: 0,
            cols: 0,
            status: "activo",
            functions: 0,
            occupancy: 0,
          });
        }

        const [date, timeRaw] = f.fecha_hora.split("T");
        const time = timeRaw ? timeRaw.slice(0, 5) : "";

        allFunciones.push({
          id: String(f.id),
          movieId,
          cinemaId,
          roomId,
          date,
          time,
          format: "2D",
          status: f.estado === "active" ? "activo" : "inactivo",
          reservations: f._count?.asientosFuncions ?? 0,
          revenue: "$0",
        });
      }
    });

    if (newRooms.length > 0) {
      rooms.value = [...rooms.value, ...newRooms];
    }

    showtimes.value = [
      ...showtimes.value.filter((s) => s.movieId !== movieId),
      ...allFunciones,
    ];
  }

  async function loadAllShowtimes(): Promise<void> {
    const activeMovies = movies.value.filter((m) => m.activo);

    const results = await Promise.allSettled(
      activeMovies.flatMap((movie) =>
        cinemas.value.map((cine) =>
          peliculasService
            .getFunciones(movie.id, cine.id)
            .then((data) => ({ movieId: movie.id, cinemaId: cine.id, cineName: cine.name, data })),
        ),
      ),
    );

    const allFunciones: Showtime[] = [];
    const newRooms: Room[] = [];

    results.forEach((result) => {
      if (result.status !== "fulfilled") return;
      const { movieId, cinemaId, cineName, data } = result.value;

      for (const f of data) {
        const roomId = String(f.salas.id);
        const roomName = f.salas.nombre;

        if (!rooms.value.find((r) => r.id === roomId) && !newRooms.find((r) => r.id === roomId)) {
          newRooms.push({
            id: roomId,
            name: roomName,
            cinemaId,
            cinema: cineName,
            type: "2D",
            rows: 0,
            cols: 0,
            status: "activo",
            functions: 0,
            occupancy: 0,
          });
        }

        const [date, timeRaw] = f.fecha_hora.split("T");
        const time = timeRaw ? timeRaw.slice(0, 5) : "";

        allFunciones.push({
          id: String(f.id),
          movieId,
          cinemaId,
          roomId,
          date,
          time,
          format: "2D",
          status: f.estado === "active" ? "activo" : "inactivo",
          reservations: f._count?.asientosFuncions ?? 0,
          revenue: "$0",
        });
      }
    });

    if (newRooms.length > 0) {
      rooms.value = [...rooms.value, ...newRooms];
    }

    showtimes.value = allFunciones;
  }

  function upsertShowtime(next: Showtime) {
    const index = showtimes.value.findIndex((item) => item.id === next.id);
    if (index >= 0) showtimes.value[index] = next;
    else showtimes.value.unshift(next);
  }

  function cancelShowtime(id: string) {
    showtimes.value = showtimes.value.map((item) =>
      item.id === id ? { ...item, status: "inactivo" as const } : item,
    );
  }

  function toggleMovieStatus(id: string) {
    movies.value = movies.value.map((movie) =>
      movie.id === id ? { ...movie, activo: !movie.activo } : movie,
    );
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

  async function toggleCustomerStatus(id: string) {
    const current = customers.value.find((c) => c.id === id);
    if (!current || current.status === "suspendido") return;

    const apiStatus = current.status === "activo" ? "inactive" : "active";
    const nextStatus = current.status === "activo" ? "inactivo" : "activo";

    try {
      await authService.updateUserStatus(id, apiStatus);
      customers.value = customers.value.map((c) =>
        c.id === id ? { ...c, status: nextStatus } : c,
      );
    } catch {
      // revert silently
    }
  }

  async function loadCustomers(params?: { nombre?: string; email?: string; estado?: string }): Promise<void> {
    try {
      const data = await authService.findAllUsers(params);
      customers.value = data.map((u) => {
        const statusMap: Record<string, Customer["status"]> = {
          active: "activo",
          inactive: "inactivo",
          suspended: "suspendido",
        };
        return {
          id: String(u.id),
          name: u.nombre,
          email: u.email,
          phone: u.telefono ?? "",
          status: statusMap[u.estado ?? ""] ?? "activo",
          registeredAt: u.created_at ?? "",
          reservations: 0,
          spent: "$0",
          avatar: u.nombre.charAt(0).toUpperCase(),
        };
      });
    } catch {
      customers.value = [];
    }
  }

  return {
    movies,
    cinemas,
    rooms,
    showtimes,
    customers,
    cities,
    loadFromAPI,
    loadFunctionsForMovie,
    loadAllShowtimes,
    loadCustomers,
    movieById,
    cinemaById,
    roomById,
    upsertShowtime,
    cancelShowtime,
    toggleMovieStatus,
    upsertCinema,
    upsertRoom,
    toggleCustomerStatus,
  };
});

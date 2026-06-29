import { defineStore } from "pinia";
import { ref } from "vue";
import { peliculasService } from "../services/peliculas.service";
import { authService } from "../services/auth.service";
import type { CatalogMovie, Cinema, Customer, Room, Showtime } from "../types";
import { ciudadesService } from "../services/ciudades.services";
import { cinesService } from "../services/cines.service";
import { salasService } from "../services/salas.service";

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
  const cinemaById = (id: string) =>
    cinemas.value.find((item) => item.id === id);
  const roomById = (id: string) => rooms.value.find((item) => item.id === id);

  async function loadFromAPI(): Promise<void> {
    try {
      const [data, idiomas, generos, cineData, ciudadData, salaData] = await Promise.all([
        peliculasService
          .search()
          .catch(
            () => [] as Awaited<ReturnType<typeof peliculasService.search>>,
          ),
        peliculasService
          .getIdiomas()
          .catch(
            () => [] as Awaited<ReturnType<typeof peliculasService.getIdiomas>>,
          ),
        peliculasService
          .getGeneros()
          .catch(
            () => [] as Awaited<ReturnType<typeof peliculasService.getGeneros>>,
          ),
        cinesService
          .getAll()
          .catch(() => [] as Awaited<ReturnType<typeof cinesService.getAll>>),
        ciudadesService
          .getAll()
          .catch(
            () => [] as Awaited<ReturnType<typeof ciudadesService.getAll>>,
          ),
        salasService
          .getAll()
          .catch(() => [] as Awaited<ReturnType<typeof salasService.getAll>>),
      ]);

      idiomaNames.value = new Map(idiomas.map((i) => [String(i.id), i.nombre]));
      generoNames.value = new Map(generos.map((g) => [String(g.id), g.nombre]));
      ciudadNames.value = new Map(
        ciudadData.map((c) => [String(c.id), c.nombre]),
      );

      movies.value = data.map((m) => ({
        id: String(m.id),
        title: m.titulo,
        genre: generoNames.value.get(String(m.id_genero)) ?? "Desconocido",
        language: idiomaNames.value.get(String(m.id_idioma)) ?? "Desconocido",
        rating: "NR",
        duration: m.sinopsis.match(/Duración:\s*(\d{2}:\d{2})/i)?.[1] ?? "02:00",
        releaseDate: m.fecha_estreno ?? "",
        director: "",
        activo: m.activo !== false,
        reservations: 0,
        revenue: "L 0.00",
        img: m.poster_url ?? "",
      }));

      cinemas.value = cineData.map((c) => ({
        id: String(c.id),
        name: c.nombre,
        address: c.direccion ?? "",
        city: ciudadNames.value.get(String(c.id_ciudad)) ?? "Desconocido",
        status:
          c.activo !== false ? ("activo" as const) : ("inactivo" as const),
        rooms: 0,
        functions: 0,
        revenue: "No disponible",
        img: "",
      }));

      rooms.value = salaData.map((s) => {
        const cinemaId = String(s.id_cine);
        const cinema = cinemas.value.find((c) => c.id === cinemaId);
        return {
          id: String(s.id),
          name: s.nombre,
          cinemaId,
          cinema: cinema?.name ?? "Desconocido",
          type: "2D" as const,
          rows: s.filas,
          cols: s.columnas,
          status: "activo" as const,
          functions: s.funciones_activas ?? 0,
          occupancy: 0,
        };
      });

      cinemas.value = cinemas.value.map((cine) => ({
        ...cine,
        rooms: rooms.value.filter((room) => room.cinemaId === cine.id).length,
      }));

      cities.value = ciudadData.map((c) => ({
        id: String(c.id),
        name: c.nombre,
        active: c.activo !== false,
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

        if (
          !rooms.value.find((r) => r.id === roomId) &&
          !newRooms.find((r) => r.id === roomId)
        ) {
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
          peliculasService.getFunciones(movie.id, cine.id).then((data) => ({
            movieId: movie.id,
            cinemaId: cine.id,
            cineName: cine.name,
            data,
          })),
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

        if (
          !rooms.value.find((r) => r.id === roomId) &&
          !newRooms.find((r) => r.id === roomId)
        ) {
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
          status: ["active", "activo"].includes(f.estado.toLowerCase())
            ? "activo"
            : "inactivo",
          reservations: f._count?.asientosFuncions ?? 0,
          revenue: "$0",
        });
      }
    });

    if (newRooms.length > 0) {
      rooms.value = [...rooms.value, ...newRooms];
    }

    showtimes.value = allFunciones;

    cinemas.value = cinemas.value.map((cinema) => {
      const cinemaShowtimes = allFunciones.filter(
        (showtime) => showtime.cinemaId === cinema.id,
      );
      const cinemaRoomIds = new Set(
        cinemaShowtimes.map((showtime) => showtime.roomId),
      );

      return {
        ...cinema,
        rooms: cinemaRoomIds.size,
        functions: cinemaShowtimes.length,
        revenue: "No disponible",
      };
    });
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

  async function createCity(nombre: string): Promise<void> {
    await ciudadesService.createCiudad({ nombre });
    await loadFromAPI();
  }

  async function updateCity(id: string, nombre: string): Promise<void> {
    await ciudadesService.updateCiudad(id, { nombre });
    await loadFromAPI();
  }

  async function deleteCity(id: string): Promise<void> {
    await ciudadesService.deleteCiudad(id);
    await loadFromAPI();
  }

  async function reactivateCity(id: string): Promise<void> {
    await ciudadesService.reactivarCiudad(id);
    await loadFromAPI();
  }

  async function createCine(payload: {
    nombre: string;
    direccion?: string;
    id_ciudad: number;
  }): Promise<void> {
    await cinesService.create(payload);
    await loadFromAPI();
    await loadAllShowtimes();
  }

  async function updateCine(
    id: string,
    payload: { nombre?: string; direccion?: string; id_ciudad?: number },
  ): Promise<void> {
    await cinesService.update(id, payload);
    await loadFromAPI();
    await loadAllShowtimes();
  }

  async function deleteCine(id: string): Promise<void> {
    await cinesService.delete(id);
    await loadFromAPI();
    await loadAllShowtimes();
  }

  async function reactivateCine(id: string): Promise<void> {
    await cinesService.reactivar(id);
    await loadFromAPI();
    await loadAllShowtimes();
  }

  async function createRoom(payload: {
    nombre: string;
    id_cine: number | string;
    filas: number;
    columnas: number;
  }): Promise<void> {
    await salasService.create(payload.id_cine, {
      nombre: payload.nombre,
      filas: payload.filas,
      columnas: payload.columnas,
    });
    await loadFromAPI();
  }

  async function updateRoom(
    id: string,
    payload: { nombre: string },
  ): Promise<{ warning?: string }> {
    const sala = await salasService.update(id, { nombre: payload.nombre });
    await loadFromAPI();
    return { warning: sala.advertencia };
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
    createCity,
    updateCity,
    deleteCity,
    reactivateCity,
    createCine,
    updateCine,
    deleteCine,
    reactivateCine,
    createRoom,
    updateRoom,
  };
});

import { ref, computed, type MaybeRefOrGetter, toValue } from "vue";
import { peliculasService } from "../services/peliculas.service";
import type { Pelicula, CreatePeliculaInput, UpdatePeliculaInput, UploadPosterInput, FuncionCine } from "../services/peliculas.service";

export interface PeliculaFilters {
  titulo?: MaybeRefOrGetter<string | undefined>;
  genero?: MaybeRefOrGetter<string | undefined>;
  idioma?: MaybeRefOrGetter<string | undefined>;
  fechaEstreno?: MaybeRefOrGetter<string | undefined>;
  activo?: MaybeRefOrGetter<boolean | undefined>;
}

export function usePeliculas() {
  const peliculas = ref<Pelicula[]>([]);
  const funciones = ref<FuncionCine[]>([]);
  const isPending = ref(false);
  const error = ref<string | null>(null);

  const generos = computed(() =>
    [...new Set(peliculas.value.map((p) => p.generos?.nombre).filter(Boolean))] as string[],
  );

  const idiomas = computed(() =>
    [...new Set(peliculas.value.map((p) => p.idiomas?.nombre).filter(Boolean))] as string[],
  );

  function filtrar(filters: PeliculaFilters): Pelicula[] {
    const t = toValue(filters.titulo);
    const g = toValue(filters.genero);
    const i = toValue(filters.idioma);
    const f = toValue(filters.fechaEstreno);
    const a = toValue(filters.activo);

    return peliculas.value.filter((p) => {
      if (t && !p.titulo.toLowerCase().includes(t.toLowerCase())) return false;
      if (g && p.generos?.nombre?.toLowerCase() !== g.toLowerCase()) return false;
      if (i && p.idiomas?.nombre?.toLowerCase() !== i.toLowerCase()) return false;
      if (f && p.fecha_estreno !== f) return false;
      if (a !== undefined && a !== null && p.activo !== a) return false;
      return true;
    });
  }

  async function fetchPeliculas(titulo?: MaybeRefOrGetter<string | undefined>): Promise<Pelicula[]> {
    isPending.value = true;
    error.value = null;
    try {
      const data = await peliculasService.search(toValue(titulo));
      peliculas.value = data;
      return data;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al obtener películas";
      error.value = msg;
      return [];
    } finally {
      isPending.value = false;
    }
  }

  async function createPelicula(payload: CreatePeliculaInput): Promise<Pelicula | null> {
    isPending.value = true;
    error.value = null;
    try {
      const created = await peliculasService.create(payload);
      peliculas.value.push(created);
      return created;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al crear película";
      error.value = msg;
      return null;
    } finally {
      isPending.value = false;
    }
  }

  async function updatePelicula(
    id: number | string,
    payload: UpdatePeliculaInput,
  ): Promise<Pelicula | null> {
    isPending.value = true;
    error.value = null;
    try {
      const updated = await peliculasService.update(id, payload);
      const idx = peliculas.value.findIndex((p) => String(p.id) === String(id));
      if (idx !== -1) peliculas.value[idx] = updated;
      return updated;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al actualizar película";
      error.value = msg;
      return null;
    } finally {
      isPending.value = false;
    }
  }

  async function uploadPoster(
    id: number | string,
    payload: UploadPosterInput,
  ): Promise<boolean> {
    isPending.value = true;
    error.value = null;
    try {
      await peliculasService.uploadPoster(id, payload);
      const idx = peliculas.value.findIndex((p) => String(p.id) === String(id));
      if (idx !== -1) peliculas.value[idx] = { ...peliculas.value[idx], poster_url: payload.posterUrl };
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al subir póster";
      error.value = msg;
      return false;
    } finally {
      isPending.value = false;
    }
  }

  async function fetchFunciones(
    peliculaId: number | string,
    cineId: number | string,
  ): Promise<FuncionCine[]> {
    isPending.value = true;
    error.value = null;
    try {
      const data = await peliculasService.getFunciones(peliculaId, cineId);
      funciones.value = data;
      return data;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al obtener funciones";
      error.value = msg;
      return [];
    } finally {
      isPending.value = false;
    }
  }

  return {
    peliculas,
    funciones,
    generos,
    idiomas,
    isPending,
    error,
    fetchPeliculas,
    fetchFunciones,
    filtrar,
    createPelicula,
    updatePelicula,
    uploadPoster,
  };
}

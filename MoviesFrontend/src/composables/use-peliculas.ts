import { ref, type MaybeRefOrGetter, toValue } from "vue";
import { peliculasService } from "../services/peliculas.service";
import type { Pelicula, CreatePeliculaInput, UpdatePeliculaInput, FuncionCine } from "../services/peliculas.service";

export interface PeliculaFilters {
  titulo?: MaybeRefOrGetter<string | undefined>;
  idIdioma?: MaybeRefOrGetter<string | undefined>;
  idGenero?: MaybeRefOrGetter<string | undefined>;
  fechaEstreno?: MaybeRefOrGetter<string | undefined>;
  activo?: MaybeRefOrGetter<boolean | undefined>;
}

export function usePeliculas() {
  const peliculas = ref<Pelicula[]>([]);
  const funciones = ref<FuncionCine[]>([]);
  const isPending = ref(false);
  const error = ref<string | null>(null);

  function filtrar(filters: PeliculaFilters): Pelicula[] {
    const t = toValue(filters.titulo);
    const idioma = toValue(filters.idIdioma);
    const genero = toValue(filters.idGenero);
    const f = toValue(filters.fechaEstreno);
    const a = toValue(filters.activo);

    return peliculas.value.filter((p) => {
      if (t && !p.titulo.toLowerCase().includes(t.toLowerCase())) return false;
      if (idioma && String(p.id_idioma) !== idioma) return false;
      if (genero && String(p.id_genero) !== genero) return false;
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
    isPending,
    error,
    fetchPeliculas,
    fetchFunciones,
    filtrar,
    createPelicula,
    updatePelicula,
  };
}

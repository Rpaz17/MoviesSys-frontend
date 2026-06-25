import { ref, type MaybeRefOrGetter, toValue } from "vue";
import { funcionesService } from "../services/funciones.service";
import type {
  FuncionDisponibilidad,
  Asiento,
  CreateFuncionInput,
  UpdateFuncionInput,
  BloquearAsientoInput,
} from "../services/funciones.service";

export function useFunciones() {
  const funciones = ref<FuncionDisponibilidad[]>([]);
  const asientos = ref<Asiento[]>([]);
  const isPending = ref(false);
  const error = ref<string | null>(null);

  async function fetchFuncionesDisponibilidad(
    peliculaId: MaybeRefOrGetter<number | string>,
    cineId: MaybeRefOrGetter<number | string>,
  ): Promise<FuncionDisponibilidad[]> {
    isPending.value = true;
    error.value = null;
    try {
      const data = await funcionesService.getFuncionesDisponibilidad(
        toValue(peliculaId),
        toValue(cineId),
      );
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

  async function fetchAsientos(
    funcionId: MaybeRefOrGetter<number | string>,
  ): Promise<Asiento[]> {
    isPending.value = true;
    error.value = null;
    try {
      const data = await funcionesService.getAsientos(toValue(funcionId));
      asientos.value = data;
      return data;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al obtener asientos";
      error.value = msg;
      return [];
    } finally {
      isPending.value = false;
    }
  }

  async function bloquearAsiento(
    funcionId: MaybeRefOrGetter<number | string>,
    asientoId: MaybeRefOrGetter<string>,
  ) {
    isPending.value = true;
    error.value = null;
    try {
      const result = await funcionesService.bloquearAsiento(toValue(funcionId), {
        id_asiento: toValue(asientoId),
      });
      return result;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al bloquear asiento";
      error.value = msg;
      return null;
    } finally {
      isPending.value = false;
    }
  }

  async function createFuncion(payload: CreateFuncionInput) {
    isPending.value = true;
    error.value = null;
    try {
      const result = await funcionesService.create(payload);
      return result;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al crear función";
      error.value = msg;
      return null;
    } finally {
      isPending.value = false;
    }
  }

  async function editFuncion(
    id: MaybeRefOrGetter<number | string>,
    payload: UpdateFuncionInput,
  ) {
    isPending.value = true;
    error.value = null;
    try {
      const result = await funcionesService.edit(toValue(id), payload);
      return result;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al editar función";
      error.value = msg;
      return null;
    } finally {
      isPending.value = false;
    }
  }

  async function cancelFuncion(id: MaybeRefOrGetter<number | string>): Promise<boolean> {
    isPending.value = true;
    error.value = null;
    try {
      await funcionesService.cancel(toValue(id));
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al cancelar función";
      error.value = msg;
      return false;
    } finally {
      isPending.value = false;
    }
  }

  return {
    funciones,
    asientos,
    isPending,
    error,
    fetchFuncionesDisponibilidad,
    fetchAsientos,
    bloquearAsiento,
    createFuncion,
    editFuncion,
    cancelFuncion,
  };
}

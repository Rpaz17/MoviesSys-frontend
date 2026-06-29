import { ref, type MaybeRefOrGetter, toValue } from "vue";
import { reservasService } from "../services/reservas.service";
import type {
  CreateReservaInput,
  ReservaAPI,
  PagoInput,
  PagoEfectivoInput,
  PagoResponse,
} from "../services/reservas.service";

export function useReservas() {
  const reservas = ref<ReservaAPI[]>([]);
  const currentReserva = ref<ReservaAPI | null>(null);
  const isPending = ref(false);
  const error = ref<string | null>(null);

  async function createReserva(payload: CreateReservaInput): Promise<ReservaAPI | null> {
    isPending.value = true;
    error.value = null;
    try {
      const data = await reservasService.create(payload);
      currentReserva.value = data;
      return data;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al crear reserva";
      error.value = msg;
      return null;
    } finally {
      isPending.value = false;
    }
  }

  async function fetchReservas(): Promise<ReservaAPI[]> {
    isPending.value = true;
    error.value = null;
    try {
      const data = await reservasService.findAll();
      reservas.value = data;
      return data;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al obtener reservas";
      error.value = msg;
      return [];
    } finally {
      isPending.value = false;
    }
  }

  async function fetchReserva(id: MaybeRefOrGetter<number | string>): Promise<ReservaAPI | null> {
    isPending.value = true;
    error.value = null;
    try {
      const data = await reservasService.findOne(toValue(id));
      currentReserva.value = data;
      return data;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al obtener reserva";
      error.value = msg;
      return null;
    } finally {
      isPending.value = false;
    }
  }

  async function cancelReserva(id: MaybeRefOrGetter<number | string>): Promise<boolean> {
    isPending.value = true;
    error.value = null;
    try {
      await reservasService.cancel(toValue(id));
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al cancelar reserva";
      error.value = msg;
      return false;
    } finally {
      isPending.value = false;
    }
  }

  async function payReserva(payload: PagoInput): Promise<PagoResponse | null> {
    isPending.value = true;
    error.value = null;
    try {
      const data = await reservasService.processPayment(payload);
      return data;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al procesar pago";
      error.value = msg;
      return null;
    } finally {
      isPending.value = false;
    }
  }

  async function payCashReserva(payload: PagoEfectivoInput): Promise<PagoResponse | null> {
    isPending.value = true;
    error.value = null;
    try {
      const data = await reservasService.processCashPayment(payload);
      return data;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al procesar pago en efectivo";
      error.value = msg;
      return null;
    } finally {
      isPending.value = false;
    }
  }

  async function validateCoupon(
    codigo: MaybeRefOrGetter<string>,
  ): Promise<{ tipo: string; valor: string | number } | null> {
    isPending.value = true;
    error.value = null;
    try {
      const data = await reservasService.validateCoupon({
        codigo: toValue(codigo),
      });
      return data;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al validar cupón";
      error.value = msg;
      return null;
    } finally {
      isPending.value = false;
    }
  }

  return {
    reservas,
    currentReserva,
    isPending,
    error,
    createReserva,
    fetchReservas,
    fetchReserva,
    cancelReserva,
    payReserva,
    payCashReserva,
    validateCoupon,
  };
}

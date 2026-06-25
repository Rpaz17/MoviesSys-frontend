import { defineStore } from "pinia";
import { ref } from "vue";
import { reservasService } from "../services/reservas.service";
import type { Coupon, Reservation } from "../types";

export const useReservationsStore = defineStore("reservations", () => {
  const reservations = ref<Reservation[]>([]);
  const coupons = ref<Coupon[]>([]);

  async function loadFromAPI(): Promise<void> {
    if (!localStorage.getItem("access_token")) return;
    try {
      const [apiReservas, apiCoupons] = await Promise.all([
        reservasService.findAll(),
        reservasService.findAllCoupons(),
      ]);
      reservations.value = apiReservas.map((r) => {
        const movie = r.funcion?.pelicula;
        const sala = r.funcion?.sala;
        const cine = sala?.cine;
        const dt = r.funcion?.fecha_hora ? new Date(r.funcion.fecha_hora) : null;
        return {
          id: r.numero_reserva || String(r.id),
          customerName: r.usuario?.nombre ?? "",
          customerEmail: r.usuario?.email ?? "",
          movieId: String(movie?.id ?? ""),
          showtimeId: String(r.id_funcion ?? r.id),
          cinemaId: String(cine?.id ?? ""),
          roomId: String(sala?.id ?? ""),
          date: dt ? dt.toISOString().slice(0, 10) : "",
          time: dt ? dt.toTimeString().slice(0, 5) : "",
          seats: [],
          status: r.estado === "pagada" || r.estado === "completed" ? "confirmada" : r.estado === "cancelada" ? "cancelada" : "pendiente",
          paymentStatus: r.estado === "pagada" ? "pagado" : "pendiente",
          total: 0,
          createdAt: r.created_at?.slice(0, 10) ?? "",
        };
      });
      coupons.value = apiCoupons.map((c) => ({
        id: String(c.id),
        code: c.codigo,
        type: (c.tipo === "porcentaje" ? "porcentaje" : "monto") as Coupon["type"],
        value: Number(c.valor),
        expiresAt: c.fecha_expiracion ?? "",
        active: c.activo ?? true,
        uses: c.usos_actuales ?? 0,
      }));
    } catch {
      // stay empty if API unavailable
    }
  }

  function addReservation(reservation: Reservation, couponId?: string) {
    reservations.value.unshift(reservation);
    if (couponId) coupons.value = coupons.value.map((coupon) => coupon.id === couponId ? { ...coupon, uses: coupon.uses + 1 } : coupon);
  }

  function cancelReservation(id: string, refundAmount: number, policy: string) {
    reservations.value = reservations.value.map((reservation) => reservation.id === id ? {
      ...reservation,
      status: "cancelada" as const,
      paymentStatus: refundAmount > 0 ? "reembolsado" as const : reservation.paymentStatus,
      cancelledAt: new Date().toISOString().slice(0, 10),
      refundStatus: refundAmount > 0 ? "procesando" as const : "no-aplica" as const,
      refundAmount,
      cancellationPolicy: policy,
    } : reservation);
  }

  function payReservation(id: string, method: "tarjeta" | "efectivo" = "efectivo") {
    reservations.value = reservations.value.map((reservation) => reservation.id === id ? {
      ...reservation,
      status: "confirmada" as const,
      paymentStatus: "pagado" as const,
      paymentMethod: method,
      transactionId: reservation.transactionId ?? `TX-${Date.now()}`,
    } : reservation);
  }

  function addCoupon(coupon: Coupon) {
    coupons.value.unshift(coupon);
  }

  function toggleCoupon(id: string) {
    coupons.value = coupons.value.map((coupon) => coupon.id === id ? { ...coupon, active: !coupon.active } : coupon);
  }

  return { reservations, coupons, loadFromAPI, addReservation, cancelReservation, payReservation, addCoupon, toggleCoupon };
});

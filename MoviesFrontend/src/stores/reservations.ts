import { defineStore } from "pinia";
import { ref } from "vue";
import type { Coupon, Reservation } from "../types";

const initialReservations: Reservation[] = [
  { id: "R1001", customerName: "Valeria Montoya", customerEmail: "valeria@moviesys.com", movieId: "M001", showtimeId: "F001", cinemaId: "CI001", roomId: "S001", date: "2026-06-16", time: "14:30", seats: ["C4", "C5"], status: "confirmada", paymentStatus: "pagado", total: 14, createdAt: "2026-06-15" },
  { id: "R1002", customerName: "Isabella Torres", customerEmail: "isa.torres@gmail.com", movieId: "M011", showtimeId: "F003", cinemaId: "CI002", roomId: "S003", date: "2026-06-16", time: "19:00", seats: ["F10", "F11", "F12"], status: "confirmada", paymentStatus: "pagado", total: 30, createdAt: "2026-06-15" },
  { id: "R1003", customerName: "Carlos Herrera", customerEmail: "carlos@moviesys.com", movieId: "M003", showtimeId: "F006", cinemaId: "CI006", roomId: "S007", date: "2026-06-18", time: "18:20", seats: ["B2"], status: "cancelada", paymentStatus: "reembolsado", refundStatus: "completado", refundAmount: 12, total: 12, createdAt: "2026-06-14" },
];

const initialCoupons: Coupon[] = [
  { id: "CP001", code: "CINE10", type: "porcentaje", value: 10, expiresAt: "2026-12-31", active: true, uses: 0 },
  { id: "CP002", code: "VIP5", type: "monto", value: 5, expiresAt: "2026-09-30", active: true, uses: 1 },
  { id: "CP003", code: "OLD20", type: "porcentaje", value: 20, expiresAt: "2025-12-31", active: false, uses: 4 },
];

export const useReservationsStore = defineStore("reservations", () => {
  const reservations = ref<Reservation[]>(initialReservations);
  const coupons = ref<Coupon[]>(initialCoupons);

  function addReservation(reservation: Reservation, couponId?: string) {
    reservations.value.unshift(reservation);
    if (couponId) coupons.value = coupons.value.map((coupon) => coupon.id === couponId ? { ...coupon, uses: coupon.uses + 1 } : coupon);
  }

  function cancelReservation(id: string, refundAmount: number, policy: string) {
    reservations.value = reservations.value.map((reservation) => reservation.id === id ? {
      ...reservation,
      status: "cancelada",
      paymentStatus: refundAmount > 0 ? "reembolsado" : reservation.paymentStatus,
      cancelledAt: new Date().toISOString().slice(0, 10),
      refundStatus: refundAmount > 0 ? "procesando" : "no-aplica",
      refundAmount,
      cancellationPolicy: policy,
    } : reservation);
  }

  function addCoupon(coupon: Coupon) {
    coupons.value.unshift(coupon);
  }

  function toggleCoupon(id: string) {
    coupons.value = coupons.value.map((coupon) => coupon.id === id ? { ...coupon, active: !coupon.active } : coupon);
  }

  return { reservations, coupons, addReservation, cancelReservation, addCoupon, toggleCoupon };
});

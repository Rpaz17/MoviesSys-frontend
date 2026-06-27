import { defineStore } from "pinia";
import { ref } from "vue";
import type { Coupon, Reservation } from "../types";

const initialReservations: Reservation[] = [
  { id: "R1001", customerName: "Valeria Montoya", customerEmail: "valeria@moviesys.com", movieId: "M001", showtimeId: "F001", cinemaId: "CI001", roomId: "S001", date: "2026-06-16", time: "14:30", seats: ["C4", "C5"], status: "confirmada", paymentStatus: "pagado", total: 14, createdAt: "2026-06-15" },
  { id: "R1002", customerName: "Isabella Torres", customerEmail: "isa.torres@gmail.com", movieId: "M011", showtimeId: "F003", cinemaId: "CI002", roomId: "S003", date: "2026-06-16", time: "19:00", seats: ["F10", "F11", "F12"], status: "confirmada", paymentStatus: "pagado", total: 30, createdAt: "2026-06-15" },
  { id: "R1003", customerName: "Carlos Herrera", customerEmail: "carlos@moviesys.com", movieId: "M003", showtimeId: "F006", cinemaId: "CI006", roomId: "S007", date: "2026-06-18", time: "18:20", seats: ["B2"], status: "cancelada", paymentStatus: "reembolsado", refundStatus: "completado", refundAmount: 12, total: 12, createdAt: "2026-06-14" },
  { id: "R1004", customerName: "Andres Rios", customerEmail: "andres.rios@outlook.com", movieId: "M010", showtimeId: "F005", cinemaId: "CI004", roomId: "S006", date: "2026-06-17", time: "20:30", seats: ["D6", "D7"], status: "pendiente", paymentStatus: "pendiente", total: 14, createdAt: "2026-06-16" },
  { id: "R1005", customerName: "Laura Castillo", customerEmail: "laura.c@gmail.com", movieId: "M001", showtimeId: "F001", cinemaId: "CI001", roomId: "S001", date: "2026-06-16", time: "14:30", seats: ["A1", "A2", "A3", "A4"], status: "confirmada", paymentStatus: "pagado", total: 28, createdAt: "2026-06-15" },
  { id: "R1006", customerName: "Mariana Salcedo", customerEmail: "msalcedo@yahoo.com", movieId: "M001", showtimeId: "F001", cinemaId: "CI001", roomId: "S001", date: "2026-06-16", time: "14:30", seats: ["E7", "E8", "F7", "F8"], status: "confirmada", paymentStatus: "pagado", total: 28, createdAt: "2026-06-15" },
  { id: "R1007", customerName: "Daniel Moreno", customerEmail: "dmoreno@empresa.co", movieId: "M001", showtimeId: "F001", cinemaId: "CI001", roomId: "S001", date: "2026-06-16", time: "14:30", seats: ["B10", "B11", "B12"], status: "confirmada", paymentStatus: "pagado", total: 21, createdAt: "2026-06-14" },
  { id: "R1008", customerName: "Felipe Guerrero", customerEmail: "fguerrero@proton.me", movieId: "M001", showtimeId: "F001", cinemaId: "CI001", roomId: "S001", date: "2026-06-16", time: "14:30", seats: ["D1", "D2", "D3", "D4", "D5"], status: "confirmada", paymentStatus: "pagado", total: 35, createdAt: "2026-06-13" },
  { id: "R1009", customerName: "Juan Velasquez", customerEmail: "jvelasquez@hotmail.com", movieId: "M011", showtimeId: "F003", cinemaId: "CI002", roomId: "S003", date: "2026-06-16", time: "19:00", seats: ["C8", "C9", "D8", "D9"], status: "confirmada", paymentStatus: "pagado", total: 40, createdAt: "2026-06-14" },
  { id: "R1010", customerName: "Camila Restrepo", customerEmail: "camila.r@moviesys.com", movieId: "M011", showtimeId: "F003", cinemaId: "CI002", roomId: "S003", date: "2026-06-16", time: "19:00", seats: ["E14", "E15", "E16", "F14", "F15", "F16"], status: "confirmada", paymentStatus: "pagado", total: 60, createdAt: "2026-06-13" },
  { id: "R1011", customerName: "Miguel Ospina", customerEmail: "mospina@gmail.com", movieId: "M011", showtimeId: "F003", cinemaId: "CI002", roomId: "S003", date: "2026-06-16", time: "19:00", seats: ["A20", "A21", "B19", "B20", "B21"], status: "confirmada", paymentStatus: "pagado", total: 50, createdAt: "2026-06-12" },
  { id: "R1012", customerName: "Sofia Prada", customerEmail: "sofia.prada@gmail.com", movieId: "M010", showtimeId: "F005", cinemaId: "CI004", roomId: "S006", date: "2026-06-17", time: "20:30", seats: ["A3", "A4", "A5"], status: "confirmada", paymentStatus: "pagado", total: 21, createdAt: "2026-06-15" },
  { id: "R1013", customerName: "Valeria Montoya", customerEmail: "valeria@moviesys.com", movieId: "M010", showtimeId: "F005", cinemaId: "CI004", roomId: "S006", date: "2026-06-17", time: "20:30", seats: ["G10", "G11", "G12", "H10", "H11", "H12"], status: "confirmada", paymentStatus: "pagado", total: 42, createdAt: "2026-06-14" },
  { id: "R1014", customerName: "Isabella Torres", customerEmail: "isa.torres@gmail.com", movieId: "M002", showtimeId: "F002", cinemaId: "CI001", roomId: "S002", date: "2026-06-16", time: "17:45", seats: ["B3", "B4", "C3", "C4"], status: "confirmada", paymentStatus: "pagado", total: 48, createdAt: "2026-06-15" },
  { id: "R1015", customerName: "Carlos Herrera", customerEmail: "carlos@moviesys.com", movieId: "M002", showtimeId: "F002", cinemaId: "CI001", roomId: "S002", date: "2026-06-16", time: "17:45", seats: ["D1", "D2", "E1", "E2"], status: "confirmada", paymentStatus: "pagado", total: 48, createdAt: "2026-06-14" },
  { id: "R1016", customerName: "Laura Castillo", customerEmail: "laura.c@gmail.com", movieId: "M001", showtimeId: "F008", cinemaId: "CI001", roomId: "S001", date: "2026-06-18", time: "21:15", seats: ["F3", "F4", "F5", "F6"], status: "confirmada", paymentStatus: "pagado", total: 28, createdAt: "2026-06-16" },
  { id: "R1017", customerName: "Mariana Salcedo", customerEmail: "msalcedo@yahoo.com", movieId: "M001", showtimeId: "F008", cinemaId: "CI001", roomId: "S001", date: "2026-06-18", time: "21:15", seats: ["C1", "C2", "D1", "D2"], status: "confirmada", paymentStatus: "pagado", total: 28, createdAt: "2026-06-15" },
  { id: "R1018", customerName: "Daniel Moreno", customerEmail: "dmoreno@empresa.co", movieId: "M001", showtimeId: "F008", cinemaId: "CI001", roomId: "S001", date: "2026-06-18", time: "21:15", seats: ["A8", "A9", "A10", "A11", "A12"], status: "confirmada", paymentStatus: "pagado", total: 35, createdAt: "2026-06-14" },
  { id: "R1019", customerName: "Juan Velasquez", customerEmail: "jvelasquez@hotmail.com", movieId: "M007", showtimeId: "F004", cinemaId: "CI002", roomId: "S004", date: "2026-06-17", time: "15:15", seats: ["B5", "B6", "C5", "C6"], status: "confirmada", paymentStatus: "pagado", total: 36, createdAt: "2026-06-15" },
  { id: "R1020", customerName: "Camila Restrepo", customerEmail: "camila.r@moviesys.com", movieId: "M001", showtimeId: "F011", cinemaId: "CI001", roomId: "S001", date: "2026-06-24", time: "14:00", seats: ["B4", "B5", "C4", "C5"], status: "confirmada", paymentStatus: "pagado", total: 28, createdAt: "2026-06-23" },
  { id: "R1021", customerName: "Felipe Guerrero", customerEmail: "fguerrero@proton.me", movieId: "M007", showtimeId: "F012", cinemaId: "CI001", roomId: "S002", date: "2026-06-24", time: "18:30", seats: ["A1", "A2"], status: "confirmada", paymentStatus: "pagado", total: 24, createdAt: "2026-06-23" },
  { id: "R1022", customerName: "Valeria Montoya", customerEmail: "valeria@moviesys.com", movieId: "M011", showtimeId: "F013", cinemaId: "CI002", roomId: "S003", date: "2026-06-24", time: "20:00", seats: ["E10", "E11", "E12", "F10", "F11", "F12"], status: "confirmada", paymentStatus: "pagado", total: 60, createdAt: "2026-06-22" },
  { id: "R1023", customerName: "Laura Castillo", customerEmail: "laura.c@gmail.com", movieId: "M011", showtimeId: "F013", cinemaId: "CI002", roomId: "S003", date: "2026-06-24", time: "20:00", seats: ["C15", "C16", "D15", "D16"], status: "confirmada", paymentStatus: "pagado", total: 40, createdAt: "2026-06-23" },
  { id: "R1024", customerName: "Daniel Moreno", customerEmail: "dmoreno@empresa.co", movieId: "M010", showtimeId: "F016", cinemaId: "CI004", roomId: "S006", date: "2026-06-24", time: "19:30", seats: ["D3", "D4", "D5", "E3", "E4", "E5"], status: "confirmada", paymentStatus: "pagado", total: 42, createdAt: "2026-06-23" },
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

  function payReservation(id: string, method: "tarjeta" | "efectivo" = "efectivo") {
    reservations.value = reservations.value.map((reservation) => reservation.id === id ? {
      ...reservation,
      status: "confirmada",
      paymentStatus: "pagado",
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

  return { reservations, coupons, addReservation, cancelReservation, payReservation, addCoupon, toggleCoupon };
});

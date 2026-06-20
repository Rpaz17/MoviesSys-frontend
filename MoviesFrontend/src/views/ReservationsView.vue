<template>
  <section class="page">
    <div class="section-header">
      <div>
        <p class="eyebrow">Reserva de entradas</p>
        <h1>{{ mode === "mine" ? "Mis reservas" : selectedShowtime ? "Selecciona tus asientos" : "Funciones disponibles" }}</h1>
      </div>
      <button v-if="selectedShowtime" class="ghost-button" type="button" @click="clearFlow">Volver a funciones</button>
    </div>

    <div v-if="mode === 'functions' && !selectedShowtime" class="grid-list">
      <article v-for="showtime in availableShowtimes" :key="showtime.id" class="card function-card">
        <img :src="imageUrl(movieFor(showtime.movieId)?.img)" :alt="movieFor(showtime.movieId)?.title" />
        <div class="card-body">
          <span class="pill">{{ showtime.format }}</span>
          <h2>{{ movieFor(showtime.movieId)?.title }}</h2>
          <p>{{ cinemaFor(showtime.cinemaId)?.name }} · {{ roomFor(showtime.roomId)?.name }}</p>
          <p>{{ showtime.date }} · {{ showtime.time }}</p>
          <div class="row-between">
            <strong>{{ money(priceFor(showtime.format)) }}</strong>
            <button class="primary-button" type="button" @click="startReservation(showtime)">Reservar</button>
          </div>
        </div>
      </article>
    </div>

    <div v-else-if="mode === 'functions' && selectedShowtime" class="booking-grid">
      <article class="card seat-card">
        <div class="screen">Pantalla</div>
        <div class="seat-scroll" aria-label="Mapa de asientos">
          <div class="seat-map" :style="{ gridTemplateColumns: `repeat(${selectedRoom?.cols ?? 10}, 48px)` }">
            <button
              v-for="seat in seats"
              :key="seat"
              type="button"
              class="seat"
              :class="{ reserved: reservedSeats.has(seat), selected: selectedSeats.includes(seat) }"
              :disabled="reservedSeats.has(seat)"
              @click="toggleSeat(seat)"
            >
              {{ seat }}
            </button>
          </div>
        </div>
        <div class="legend">
          <span><i class="seat-dot available"></i>Disponible</span>
          <span><i class="seat-dot selected-dot"></i>Seleccionado</span>
          <span><i class="seat-dot reserved-dot"></i>Reservado</span>
        </div>
      </article>

      <aside class="card checkout-card">
        <h2>{{ selectedMovie?.title }}</h2>
        <p>{{ selectedCinema?.name }} · {{ selectedRoom?.name }}</p>
        <p>{{ selectedShowtime.date }} · {{ selectedShowtime.time }}</p>
        <div class="summary-line"><span>Asientos</span><strong class="selected-seat-list">{{ selectedSeats.join(", ") || "Sin seleccionar" }}</strong></div>
        <div class="summary-line"><span>Subtotal</span><strong>{{ money(subtotal) }}</strong></div>
        <div class="coupon-row">
          <input v-model.trim="couponCode" class="input" placeholder="Cupón" />
          <button class="ghost-button" type="button" @click="applyCoupon">Aplicar</button>
        </div>
        <p v-if="couponMessage" class="form-note">{{ couponMessage }}</p>
        <div class="summary-line"><span>Descuento</span><strong>-{{ money(discount) }}</strong></div>
        <div class="summary-line total"><span>Total</span><strong>{{ money(total) }}</strong></div>

        <label class="field">
          Método de pago
          <select v-model="paymentMethod" class="input">
            <option value="tarjeta">Tarjeta</option>
            <option value="paypal">PayPal</option>
            <option value="efectivo">Efectivo</option>
          </select>
        </label>
        <div v-if="paymentMethod === 'tarjeta'" class="payment-grid">
          <input v-model="cardNumber" class="input" placeholder="Número de tarjeta" />
          <input v-model="cardExpiry" class="input" placeholder="MM/AA" />
          <input v-model="cardCvv" class="input" placeholder="CVV" />
        </div>
        <p class="policy-box">Puedes cancelar antes de la función. El reembolso estimado depende de la política configurada y se verá en Mis reservas.</p>
        <button class="primary-button full" type="button" :disabled="!canConfirm" @click="confirmReservation">Confirmar y pagar</button>
        <p v-if="confirmation" class="success-box">{{ confirmation }}</p>
      </aside>
    </div>

    <div v-else class="stack">
      <article v-for="reservation in myReservations" :key="reservation.id" class="card reservation-row">
        <div>
          <span class="pill">{{ reservation.status }}</span>
          <h2>{{ movieFor(reservation.movieId)?.title }}</h2>
          <p>{{ cinemaFor(reservation.cinemaId)?.name }} · {{ roomFor(reservation.roomId)?.name }}</p>
          <p>{{ reservation.date }} · {{ reservation.time }} · Asientos {{ reservation.seats.join(", ") }}</p>
          <p v-if="reservation.refundStatus">Reembolso: {{ reservation.refundStatus }} · {{ money(reservation.refundAmount ?? 0) }}</p>
        </div>
        <div class="row-actions">
          <strong>{{ money(reservation.total) }}</strong>
          <button v-if="reservation.status !== 'cancelada'" class="danger-button" type="button" @click="openCancel(reservation)">Cancelar reserva</button>
        </div>
      </article>
      <div v-if="myReservations.length === 0" class="empty-state card">Aún no tienes reservas activas.</div>
    </div>

    <div v-if="cancelTarget" class="modal-backdrop" @click.self="cancelTarget = null">
      <article class="modal-card">
        <h2>Confirmar cancelación</h2>
        <p>Política: reembolso completo con más de 24 horas de anticipación, 50% entre 6 y 24 horas, sin reembolso en las últimas 6 horas.</p>
        <div class="summary-line total"><span>Reembolso estimado</span><strong>{{ money(refundEstimate) }}</strong></div>
        <div class="modal-actions">
          <button class="ghost-button" type="button" @click="cancelTarget = null">Volver</button>
          <button class="danger-button" type="button" @click="confirmCancel">Cancelar reserva</button>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { storeToRefs } from "pinia";
import { useCatalogStore } from "../stores/catalog";
import { useReservationsStore } from "../stores/reservations";
import { useSessionStore } from "../stores/session";
import type { PaymentMethod, Reservation, Showtime } from "../types";

const route = useRoute();
const router = useRouter();
const catalog = useCatalogStore();
const reservationsStore = useReservationsStore();
const session = useSessionStore();
const { reservations, coupons } = storeToRefs(reservationsStore);

const selectedShowtime = ref<Showtime | null>(null);
const selectedSeats = ref<string[]>([]);
const couponCode = ref("");
const appliedCouponId = ref("");
const couponMessage = ref("");
const paymentMethod = ref<PaymentMethod>("tarjeta");
const cardNumber = ref("");
const cardExpiry = ref("");
const cardCvv = ref("");
const confirmation = ref("");
const cancelTarget = ref<Reservation | null>(null);

const mode = computed(() => String(route.meta.mode ?? "functions"));
const selectedShowtimeId = computed(() => String(route.query.showtime || ""));
const availableShowtimes = computed(() => catalog.showtimes.filter((item) => item.status === "activo"));
const myReservations = computed(() => reservations.value.filter((item) => item.customerEmail === session.user?.email));

const selectedMovie = computed(() => selectedShowtime.value ? catalog.movieById(selectedShowtime.value.movieId) : undefined);
const selectedCinema = computed(() => selectedShowtime.value ? catalog.cinemaById(selectedShowtime.value.cinemaId) : undefined);
const selectedRoom = computed(() => selectedShowtime.value ? catalog.roomById(selectedShowtime.value.roomId) : undefined);
const unitPrice = computed(() => selectedShowtime.value ? priceFor(selectedShowtime.value.format) : 0);
const subtotal = computed(() => selectedSeats.value.length * unitPrice.value);
const appliedCoupon = computed(() => coupons.value.find((coupon) => coupon.id === appliedCouponId.value));
const discount = computed(() => {
  if (!appliedCoupon.value) return 0;
  return appliedCoupon.value.type === "porcentaje" ? subtotal.value * (appliedCoupon.value.value / 100) : appliedCoupon.value.value;
});
const total = computed(() => Math.max(0, subtotal.value - discount.value));
const canConfirm = computed(() => selectedSeats.value.length > 0 && (paymentMethod.value !== "tarjeta" || Boolean(cardNumber.value && cardExpiry.value && cardCvv.value)));
const reservedSeats = computed(() => new Set(reservations.value
  .filter((item) => item.showtimeId === selectedShowtime.value?.id && item.status !== "cancelada")
  .flatMap((item) => item.seats)));
const seats = computed(() => {
  const room = selectedRoom.value;
  if (!room) return [];
  return Array.from({ length: room.rows * room.cols }, (_, index) => `${String.fromCharCode(65 + Math.floor(index / room.cols))}${(index % room.cols) + 1}`);
});
const refundEstimate = computed(() => cancelTarget.value ? calculateRefund(cancelTarget.value) : 0);

watch(() => route.path, () => clearFlow());
watch(selectedShowtimeId, (id) => {
  if (!id || mode.value !== "functions") return;
  const showtime = availableShowtimes.value.find((item) => item.id === id);
  if (showtime) startReservation(showtime);
}, { immediate: true });

function movieFor(id: string) {
  return catalog.movieById(id);
}

function cinemaFor(id: string) {
  return catalog.cinemaById(id);
}

function roomFor(id: string) {
  return catalog.roomById(id);
}

function imageUrl(id?: string) {
  return `https://images.unsplash.com/${id ?? "photo-1489599849927-2ee91cede3ba"}?auto=format&fit=crop&w=900&q=80`;
}

function priceFor(format: Showtime["format"]) {
  return ({ "2D": 7, "3D": 9, IMAX: 10, VIP: 12 })[format];
}

function money(value: number) {
  return new Intl.NumberFormat("es-HN", { style: "currency", currency: "USD" }).format(value);
}

function startReservation(showtime: Showtime) {
  selectedShowtime.value = showtime;
  selectedSeats.value = [];
  confirmation.value = "";
}

function clearFlow() {
  selectedShowtime.value = null;
  selectedSeats.value = [];
  couponCode.value = "";
  appliedCouponId.value = "";
  couponMessage.value = "";
  confirmation.value = "";
}

function toggleSeat(seat: string) {
  selectedSeats.value = selectedSeats.value.includes(seat)
    ? selectedSeats.value.filter((item) => item !== seat)
    : [...selectedSeats.value, seat];
}

function applyCoupon() {
  const code = couponCode.value.toUpperCase();
  const coupon = coupons.value.find((item) => item.code === code && item.active && new Date(item.expiresAt) >= new Date());
  appliedCouponId.value = coupon?.id ?? "";
  couponMessage.value = coupon ? `Cupón ${coupon.code} aplicado.` : "Cupón no disponible o vencido.";
}

function confirmReservation() {
  if (!selectedShowtime.value || !canConfirm.value) return;
  if (!session.user) {
    router.push({
      path: "/login",
      query: {
        reason: "checkout",
        redirect: `/reservas/funciones?showtime=${selectedShowtime.value.id}`,
      },
    });
    return;
  }
  const reservation: Reservation = {
    id: `R${Date.now().toString().slice(-6)}`,
    customerName: session.user.name,
    customerEmail: session.user.email,
    movieId: selectedShowtime.value.movieId,
    showtimeId: selectedShowtime.value.id,
    cinemaId: selectedShowtime.value.cinemaId,
    roomId: selectedShowtime.value.roomId,
    date: selectedShowtime.value.date,
    time: selectedShowtime.value.time,
    seats: [...selectedSeats.value],
    status: "confirmada",
    paymentStatus: "pagado",
    paymentMethod: paymentMethod.value,
    transactionId: `TX-${Date.now()}`,
    couponCode: appliedCoupon.value?.code,
    discount: discount.value,
    total: total.value,
    createdAt: new Date().toISOString().slice(0, 10),
  };
  reservationsStore.addReservation(reservation, appliedCouponId.value || undefined);
  confirmation.value = `Reserva ${reservation.id} confirmada.`;
  router.push("/reservas/mis-reservas");
}

function openCancel(reservation: Reservation) {
  cancelTarget.value = reservation;
}

function calculateRefund(reservation: Reservation) {
  const showDate = new Date(`${reservation.date}T${reservation.time}:00`);
  const hours = (showDate.getTime() - Date.now()) / 36e5;
  if (hours > 24) return reservation.total;
  if (hours > 6) return reservation.total * 0.5;
  return 0;
}

function confirmCancel() {
  if (!cancelTarget.value) return;
  reservationsStore.cancelReservation(cancelTarget.value.id, refundEstimate.value, "Política estándar de cancelación");
  cancelTarget.value = null;
}
</script>

<style scoped>
.section-header { display: flex; justify-content: space-between; gap: 16px; align-items: flex-end; width: min(100%, 1100px); margin: 0 auto 24px; }
.eyebrow { color: #c8a96e; font-family: "DM Mono", monospace; text-transform: uppercase; font-size: 11px; letter-spacing: .09em; margin: 0 0 4px; }
h1 { font-size: clamp(22px, 3vw, 34px); font-weight: 600; color: #f0ece4; margin: 0; font-family: 'Playfair Display', serif; letter-spacing: -0.01em; }
h2 { color: #f0ece4; margin: 0; font-size: 1rem; font-weight: 600; }
p { color: #7a7590; margin: 0; font-size: .875rem; }
.grid-list { width: min(100%, 1100px); margin: 0 auto; display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 16px; }
.function-card { overflow: hidden; padding: 0; transition: transform .15s, border-color .15s; }
.function-card:hover { transform: translateY(-2px); border-color: rgba(200,169,110,0.22); }
.function-card img { width: 100%; height: 170px; object-fit: cover; }
.card-body { padding: 1rem 1.125rem; display: grid; gap: 8px; }
.booking-grid { width: min(100%, 1100px); margin: 0 auto; display: grid; grid-template-columns: minmax(0, 1fr) minmax(320px, 380px); gap: 18px; align-items: start; }
.seat-card { min-width: 0; padding: 1.25rem; overflow: hidden; }
.screen { text-align: center; padding: 8px; border-bottom: 2px solid rgba(200,169,110,0.3); color: #7a7590; margin: 0 0 16px; font-size: .75rem; letter-spacing: .06em; text-transform: uppercase; font-family: 'DM Mono', monospace; }
.seat-scroll { overflow-x: auto; overflow-y: hidden; padding: 0 0 10px; scrollbar-width: thin; scrollbar-color: rgba(200,169,110,.4) rgba(255,255,255,.04); }
.seat-scroll::-webkit-scrollbar { display: block; height: 6px; }
.seat-scroll::-webkit-scrollbar-thumb { background: rgba(200,169,110,.4); border-radius: 999px; }
.seat-scroll::-webkit-scrollbar-track { background: rgba(255,255,255,.04); border-radius: 999px; }
.seat-map { display: grid; gap: 7px; width: max-content; min-width: 100%; justify-content: center; }
.seat { width: 44px; height: 38px; border: 1px solid rgba(200,169,110,0.14); background: rgba(255,255,255,0.03); color: #9e9ab0; border-radius: 3px; font-size: 11px; font-family: 'DM Mono', monospace; transition: background .1s, border-color .1s; }
.seat:hover:not(:disabled) { background: rgba(200,169,110,0.08); border-color: rgba(200,169,110,0.3); }
.seat.selected { background: #c8a96e; border-color: #c8a96e; color: #0a0a0f; font-weight: 600; }
.seat.reserved { background: rgba(200,60,60,0.18); color: rgba(255,255,255,0.3); cursor: not-allowed; border-color: rgba(200,60,60,0.2); }
.legend { display: flex; gap: 14px; flex-wrap: wrap; margin-top: 14px; color: #7a7590; font-size: .75rem; }
.seat-dot { display: inline-block; width: 11px; height: 11px; border-radius: 3px; margin-right: 5px; vertical-align: -1px; border: 1px solid rgba(200,169,110,0.2); }
.selected-dot { background: #c8a96e; border-color: #c8a96e; }
.reserved-dot { background: rgba(200,60,60,0.45); border-color: rgba(200,60,60,0.3); }
.checkout-card { display: grid; gap: 12px; min-width: 0; padding: 1.375rem; position: sticky; top: 72px; }
.field { display: grid; gap: 6px; color: #c8a96e; font-size: .8125rem; font-weight: 500; }
.summary-line, .row-between { display: flex; justify-content: space-between; gap: 14px; align-items: center; font-size: .875rem; }
.summary-line strong { text-align: right; color: #f0ece4; }
.selected-seat-list { max-width: 180px; overflow-wrap: anywhere; font-size: .8125rem; }
.summary-line.total { font-size: 1.0625rem; font-weight: 600; padding-top: 10px; border-top: 1px solid rgba(200,169,110,0.12); }
.coupon-row { display: grid; grid-template-columns: 1fr auto; gap: 7px; }
.payment-grid { display: grid; grid-template-columns: minmax(0, 1fr) 88px 78px; gap: 7px; }
.policy-box, .success-box { border-radius: 3px; padding: .75rem; background: rgba(255,255,255,0.04); color: #7a7590; font-size: .8125rem; line-height: 1.5; }
.success-box { color: #4caf7d; background: rgba(76,175,125,0.06); }
.form-note { font-size: .75rem; color: #c8a96e; margin: 0; }
.full { width: 100%; }
.stack { width: min(100%, 1100px); margin: 0 auto; display: grid; gap: 12px; }
.reservation-row { display: flex; justify-content: space-between; gap: 16px; align-items: center; padding: 1.25rem 1.5rem; }
.row-actions { display: grid; gap: 8px; justify-items: end; }
.danger-button { border-radius: 3px; padding: .4375rem .875rem; font-size: .8125rem; font-weight: 500; color: #ffd8df; border: 1px solid rgba(232,96,122,.3); background: rgba(232,96,122,.08); transition: background .12s; }
.danger-button:hover { background: rgba(232,96,122,.15); }
.modal-backdrop { position: fixed; inset: 0; display: grid; place-items: center; background: rgba(0,0,0,0.65); z-index: 30; backdrop-filter: blur(4px); }
.modal-card { width: min(480px, calc(100vw - 2rem)); background: #171526; border: 1px solid rgba(200,169,110,0.14); border-radius: 4px; padding: 1.5rem; display: grid; gap: 14px; box-shadow: 0 24px 60px rgba(0,0,0,0.6); }
.modal-actions { display: flex; justify-content: flex-end; gap: 8px; }
.empty-state { padding: 3rem 1.5rem; text-align: center; color: #7a7590; font-size: .875rem; }
@media (max-width: 900px) {
  .booking-grid { grid-template-columns: 1fr; }
  .checkout-card { position: static; }
  .payment-grid { grid-template-columns: 1fr; }
  .reservation-row { align-items: stretch; flex-direction: column; }
  .row-actions { justify-items: stretch; }
}
@media (max-width: 640px) {
  .section-header { align-items: stretch; flex-direction: column; }
  .section-header .ghost-button { justify-content: center; width: 100%; }
  .seat-card, .checkout-card { padding: 1rem; }
  .seat-map { gap: 5px; justify-content: start; }
  .seat { width: 38px; height: 34px; font-size: 10px; }
  .coupon-row { grid-template-columns: 1fr; }
  .summary-line { align-items: flex-start; }
}
</style>

<template>
  <section class="page">
    <div class="section-header">
      <div>
        <p class="eyebrow">Reserva de entradas</p>
        <h1>Selecciona tus asientos</h1>
      </div>
      <button class="ghost-button" type="button" @click="router.push('/reservas/funciones')">Volver a funciones</button>
    </div>

    <div v-if="!showtime" class="empty-state card">Función no encontrada.</div>

    <div v-else class="booking-grid">
      <article class="card seat-card">
        <div class="screen">Pantalla</div>
        <div class="seat-scroll" aria-label="Mapa de asientos">
          <div class="seat-map" :style="{ gridTemplateColumns: `repeat(${room?.cols ?? 10}, 48px)` }">
            <button
              v-for="seat in seatList"
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
        <h2>{{ movie?.title }}</h2>
        <p>{{ cinema?.name }} · {{ room?.name }}</p>
        <p>{{ formatDate(showtime.date) }} · {{ showtime.time }}</p>
        <div class="summary-line">
          <span>Asientos</span>
          <strong class="selected-seat-list">{{ selectedSeats.join(", ") || "Sin seleccionar" }}</strong>
        </div>
        <div class="summary-line countdown">
          <span>Bloqueo</span>
          <strong>{{ lockCountdown }}</strong>
        </div>
        <div class="summary-line">
          <span>Subtotal</span>
          <strong>{{ money(subtotal) }}</strong>
        </div>
        <div class="coupon-row">
          <input v-model.trim="couponCode" class="input" placeholder="Cupón" />
          <button class="ghost-button" type="button" @click="applyCoupon">Aplicar</button>
        </div>
        <p v-if="couponMessage" class="form-note">{{ couponMessage }}</p>
        <div class="summary-line">
          <span>Descuento</span>
          <strong>-{{ money(discount) }}</strong>
        </div>
        <div class="summary-line total">
          <span>Total</span>
          <strong>{{ money(total) }}</strong>
        </div>

        <label class="field">
          Método de pago
          <select v-model="paymentMethod" class="input">
            <option value="tarjeta">Tarjeta</option>
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
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { storeToRefs } from "pinia";
import { useCatalogStore } from "../../stores/catalog";
import { useReservationsStore } from "../../stores/reservations";
import { useSessionStore } from "../../stores/session";
import { useCatalogHelpers } from "../../composables/use-catalog-helpers";
import { useFormat } from "../../composables/use-format";
import type { PaymentMethod, Reservation } from "../../types";

const route = useRoute();
const router = useRouter();
const catalog = useCatalogStore();
const reservationsStore = useReservationsStore();
const session = useSessionStore();
const { reservations, coupons } = storeToRefs(reservationsStore);
const { movieFor, cinemaFor, roomFor, priceFor } = useCatalogHelpers();
const { money, formatDate, imageUrl } = useFormat();

const showtimeId = computed(() => String(route.params.showtimeId));
const showtime = computed(() => catalog.showtimes.find((s) => s.id === showtimeId.value));
const movie = computed(() => (showtime.value ? catalog.movieById(showtime.value.movieId) : undefined));
const cinema = computed(() => (showtime.value ? catalog.cinemaById(showtime.value.cinemaId) : undefined));
const room = computed(() => (showtime.value ? catalog.roomById(showtime.value.roomId) : undefined));

const selectedSeats = ref<string[]>([]);
const couponCode = ref("");
const appliedCouponId = ref("");
const couponMessage = ref("");
const paymentMethod = ref<PaymentMethod>("tarjeta");
const cardNumber = ref("");
const cardExpiry = ref("");
const cardCvv = ref("");
const confirmation = ref("");
const lockedUntil = ref(0);
const now = ref(Date.now());
let timer: number | undefined;

const unitPrice = computed(() => (showtime.value ? priceFor(showtime.value.format) : 0));
const subtotal = computed(() => selectedSeats.value.length * unitPrice.value);
const appliedCoupon = computed(() => coupons.value.find((coupon) => coupon.id === appliedCouponId.value));
const discount = computed(() => {
  if (!appliedCoupon.value) return 0;
  return appliedCoupon.value.type === "porcentaje"
    ? subtotal.value * (appliedCoupon.value.value / 100)
    : appliedCoupon.value.value;
});
const total = computed(() => Math.max(0, subtotal.value - discount.value));
const canConfirm = computed(
  () =>
    selectedSeats.value.length > 0 &&
    (paymentMethod.value !== "tarjeta" || Boolean(cardNumber.value && cardExpiry.value && cardCvv.value)),
);
const reservedSeats = computed(() =>
  new Set(
    reservations.value
      .filter((item) => item.showtimeId === showtime.value?.id && item.status !== "cancelada")
      .flatMap((item) => item.seats),
  ),
);
const seatList = computed(() => {
  const r = room.value;
  if (!r) return [];
  return Array.from(
    { length: r.rows * r.cols },
    (_, index) =>
      `${String.fromCharCode(65 + Math.floor(index / r.cols))}${(index % r.cols) + 1}`,
  );
});
const lockCountdown = computed(() => {
  const remaining = Math.max(0, lockedUntil.value - now.value);
  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
});

watch(selectedSeats, (val) => {
  if (val.length > 0 && lockedUntil.value === 0) {
    lockedUntil.value = Date.now() + 5 * 60 * 1000;
  }
});

onMounted(() => {
  if (!showtime.value) {
    router.replace("/reservas/funciones");
    return;
  }
  if (!session.user) {
    router.push({
      path: "/login",
      query: {
        reason: "checkout",
        redirect: `/reservas/funciones/${showtimeId.value}/asientos`,
      },
    });
    return;
  }
  timer = window.setInterval(() => {
    now.value = Date.now();
    if (lockedUntil.value > 0 && lockedUntil.value <= now.value) {
      router.push("/reservas/funciones");
    }
  }, 1000);
});

onUnmounted(() => {
  if (timer) window.clearInterval(timer);
});

function toggleSeat(seat: string) {
  if (selectedSeats.value.length === 0) {
    lockedUntil.value = Date.now() + 5 * 60 * 1000;
  }
  selectedSeats.value = selectedSeats.value.includes(seat)
    ? selectedSeats.value.filter((item) => item !== seat)
    : [...selectedSeats.value, seat];
}

function applyCoupon() {
  const code = couponCode.value.toUpperCase();
  const coupon = coupons.value.find(
    (item) => item.code === code && item.active && new Date(item.expiresAt) >= new Date(),
  );
  appliedCouponId.value = coupon?.id ?? "";
  couponMessage.value = coupon ? `Cupón ${coupon.code} aplicado.` : "Cupón no disponible o vencido.";
}

function confirmReservation() {
  if (!showtime.value || !canConfirm.value || !session.user) return;
  const reservation: Reservation = {
    id: `R${Date.now().toString().slice(-6)}`,
    customerName: session.user.name,
    customerEmail: session.user.email,
    movieId: showtime.value.movieId,
    showtimeId: showtime.value.id,
    cinemaId: showtime.value.cinemaId,
    roomId: showtime.value.roomId,
    date: showtime.value.date,
    time: showtime.value.time,
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
  router.push(`/reservas/resultado/${reservation.id}`);
}
</script>

<style scoped>
.section-header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-end;
  width: min(100%, 1100px);
  margin: 0 auto 24px;
}
.eyebrow {
  color: #c8a96e;
  font-family: "DM Mono", monospace;
  text-transform: uppercase;
  font-size: 11px;
  letter-spacing: 0.09em;
  margin: 0 0 4px;
}
h1 {
  font-size: clamp(22px, 3vw, 34px);
  font-weight: 600;
  color: #f0ece4;
  margin: 0;
  font-family: "Playfair Display", serif;
  letter-spacing: -0.01em;
}
h2 {
  color: #f0ece4;
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
}
p {
  color: #7a7590;
  margin: 0;
  font-size: 0.875rem;
}
.empty-state {
  padding: 3rem 1.5rem;
  text-align: center;
  color: #7a7590;
  font-size: 0.875rem;
}
.booking-grid {
  width: min(100%, 1100px);
  margin: 0 auto;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(320px, 380px);
  gap: 18px;
  align-items: start;
}
.seat-card {
  min-width: 0;
  padding: 1.25rem;
  overflow: hidden;
}
.screen {
  text-align: center;
  padding: 8px;
  border-bottom: 2px solid rgba(200, 169, 110, 0.3);
  color: #7a7590;
  margin: 0 0 16px;
  font-size: 0.75rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  font-family: "DM Mono", monospace;
}
.seat-scroll {
  overflow-x: auto;
  overflow-y: hidden;
  padding: 0 0 10px;
  scrollbar-width: thin;
  scrollbar-color: rgba(200, 169, 110, 0.4) rgba(255, 255, 255, 0.04);
}
.seat-scroll::-webkit-scrollbar {
  display: block;
  height: 6px;
}
.seat-scroll::-webkit-scrollbar-thumb {
  background: rgba(200, 169, 110, 0.4);
  border-radius: 999px;
}
.seat-scroll::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.04);
  border-radius: 999px;
}
.seat-map {
  display: grid;
  gap: 7px;
  width: max-content;
  min-width: 100%;
  justify-content: center;
}
.seat {
  width: 44px;
  height: 38px;
  border: 1px solid rgba(200, 169, 110, 0.14);
  background: rgba(255, 255, 255, 0.03);
  color: #9e9ab0;
  border-radius: 3px;
  font-size: 11px;
  font-family: "DM Mono", monospace;
  transition: background 0.1s, border-color 0.1s;
}
.seat:hover:not(:disabled) {
  background: rgba(200, 169, 110, 0.08);
  border-color: rgba(200, 169, 110, 0.3);
}
.seat.selected {
  background: #c8a96e;
  border-color: #c8a96e;
  color: #0a0a0f;
  font-weight: 600;
}
.seat.reserved {
  background: rgba(200, 60, 60, 0.18);
  color: rgba(255, 255, 255, 0.3);
  cursor: not-allowed;
  border-color: rgba(200, 60, 60, 0.2);
}
.legend {
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
  margin-top: 14px;
  color: #7a7590;
  font-size: 0.75rem;
}
.seat-dot {
  display: inline-block;
  width: 11px;
  height: 11px;
  border-radius: 3px;
  margin-right: 5px;
  vertical-align: -1px;
  border: 1px solid rgba(200, 169, 110, 0.2);
}
.selected-dot {
  background: #c8a96e;
  border-color: #c8a96e;
}
.reserved-dot {
  background: rgba(200, 60, 60, 0.45);
  border-color: rgba(200, 60, 60, 0.3);
}
.checkout-card {
  display: grid;
  gap: 12px;
  min-width: 0;
  padding: 1.375rem;
  position: sticky;
  top: 72px;
}
.field {
  display: grid;
  gap: 6px;
  color: #c8a96e;
  font-size: 0.8125rem;
  font-weight: 500;
}
.summary-line {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  align-items: center;
  font-size: 0.875rem;
}
.summary-line strong {
  text-align: right;
  color: #f0ece4;
}
.selected-seat-list {
  max-width: 180px;
  overflow-wrap: anywhere;
  font-size: 0.8125rem;
}
.summary-line.total {
  font-size: 1.0625rem;
  font-weight: 600;
  padding-top: 10px;
  border-top: 1px solid rgba(200, 169, 110, 0.12);
}
.coupon-row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 7px;
}
.payment-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 88px 78px;
  gap: 7px;
}
.policy-box,
.success-box {
  border-radius: 3px;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.04);
  color: #7a7590;
  font-size: 0.8125rem;
  line-height: 1.5;
}
.success-box {
  color: #4caf7d;
  background: rgba(76, 175, 125, 0.06);
}
.form-note {
  font-size: 0.75rem;
  color: #c8a96e;
  margin: 0;
}
.full {
  width: 100%;
}
.countdown strong {
  color: #c8a96e;
  font-family: "DM Mono", monospace;
}
@media (max-width: 900px) {
  .booking-grid {
    grid-template-columns: 1fr;
  }
  .checkout-card {
    position: static;
  }
  .payment-grid {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 640px) {
  .section-header {
    align-items: stretch;
    flex-direction: column;
  }
  .section-header .ghost-button {
    justify-content: center;
    width: 100%;
  }
  .seat-card,
  .checkout-card {
    padding: 1rem;
  }
  .seat-map {
    gap: 5px;
    justify-content: start;
  }
  .seat {
    width: 38px;
    height: 34px;
    font-size: 10px;
  }
  .coupon-row {
    grid-template-columns: 1fr;
  }
  .summary-line {
    align-items: flex-start;
  }
}
</style>

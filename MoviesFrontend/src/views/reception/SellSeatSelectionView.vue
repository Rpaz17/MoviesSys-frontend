<template>
  <section class="page">
    <div class="section-header">
      <div>
        <p class="eyebrow">Recepcion</p>
        <h1>Vender boletos</h1>
      </div>
      <button class="ghost-button" type="button" @click="router.push('/recepcion/vender')">Volver a funciones</button>
    </div>

    <div v-if="sellShowtime" class="booking-grid">
      <article class="card seat-card">
        <div class="screen">Pantalla</div>
        <div class="seat-scroll" aria-label="Mapa de asientos">
          <div class="seat-map" :style="{ gridTemplateColumns: `repeat(${sellRoom?.cols ?? 10}, 48px)` }">
            <button
              v-for="seat in sellSeatList"
              :key="seat"
              type="button"
              class="seat"
              :class="{ reserved: sellReservedSeats.has(seat), selected: sellSeats.includes(seat) }"
              :disabled="sellReservedSeats.has(seat)"
              @click="toggleSellSeat(seat)"
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
        <h2>{{ sellMovie?.title }}</h2>
        <p>{{ sellCinema?.name }} · {{ sellRoom?.name }}</p>
        <p>{{ sellShowtime.date }} · {{ sellShowtime.time }}</p>
        <div class="summary-line"><span>Asientos</span><strong class="selected-seat-list">{{ sellSeats.join(", ") || "Sin seleccionar" }}</strong></div>
        <div class="summary-line total"><span>Total</span><strong>{{ money(sellTotal) }}</strong></div>

        <label class="field">
          Nombre del cliente
          <input v-model="sellCustomerName" class="input" placeholder="Nombre completo" />
        </label>

        <div class="pos-cash-row">
          <label class="field" style="flex:1">
            Efectivo recibido
            <input v-model.number="cashReceived" class="input" type="number" min="0" step="0.01" placeholder="0.00" />
          </label>
          <div class="pos-change" v-if="cashReceived >= sellTotal">
            <span class="mono muted" style="font-size:.6875rem;text-transform:uppercase">Cambio</span>
            <strong>{{ money(cashReceived - sellTotal) }}</strong>
          </div>
        </div>

        <button class="primary-button full" type="button" :disabled="!canSell" @click="confirmSell">Cobrar y emitir boleto</button>
        <button class="ghost-button full" type="button" @click="router.push('/recepcion/vender')">Cancelar venta</button>
      </aside>
    </div>

    <div v-else class="empty-state card">Funcion no encontrada.</div>

    <SellReceiptModal
      v-if="sellReceipt"
      :receipt="sellReceipt"
      :showtime="sellShowtime"
      :cashReceived="cashReceived"
      @close="closeSellReceipt"
    />
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { storeToRefs } from "pinia";
import { useCatalogStore } from "../../stores/catalog";
import { useReservationsStore } from "../../stores/reservations";
import { useCatalogHelpers } from "../../composables/use-catalog-helpers";
import { useFormat } from "../../composables/use-format";
import SellReceiptModal from "../../components/SellReceiptModal.vue";
import type { Reservation, Showtime } from "../../types";

const route = useRoute();
const router = useRouter();
const catalog = useCatalogStore();
const reservationsStore = useReservationsStore();
const { reservations } = storeToRefs(reservationsStore);
const { movieFor, cinemaFor, roomFor, priceFor } = useCatalogHelpers();
const { money } = useFormat();

const showtimeId = computed(() => String(route.params.showtimeId));

const sellShowtime = computed<Showtime | null>(() =>
  catalog.showtimes.find((s) => s.id === showtimeId.value) ?? null
);

const sellSeats = ref<string[]>([]);
const sellCustomerName = ref("");
const cashReceived = ref(0);
const sellReceipt = ref<Reservation | null>(null);

const sellMovie = computed(() => (sellShowtime.value ? movieFor(sellShowtime.value.movieId) : undefined));
const sellCinema = computed(() => (sellShowtime.value ? cinemaFor(sellShowtime.value.cinemaId) : undefined));
const sellRoom = computed(() => (sellShowtime.value ? roomFor(sellShowtime.value.roomId) : undefined));

const sellSeatList = computed(() => {
  const room = sellRoom.value;
  if (!room) return [];
  return Array.from({ length: room.rows * room.cols }, (_, index) =>
    `${String.fromCharCode(65 + Math.floor(index / room.cols))}${(index % room.cols) + 1}`
  );
});

const sellReservedSeats = computed(() =>
  new Set(
    reservations.value
      .filter((item) => item.showtimeId === sellShowtime.value?.id && item.status !== "cancelada")
      .flatMap((item) => item.seats)
  )
);

const sellTotal = computed(() =>
  sellSeats.value.length * (sellShowtime.value ? priceFor(sellShowtime.value.format) : 0)
);

const canSell = computed(
  () => sellSeats.value.length > 0 && sellCustomerName.value.trim().length > 0 && cashReceived.value >= sellTotal.value
);

function toggleSellSeat(seat: string) {
  sellSeats.value = sellSeats.value.includes(seat)
    ? sellSeats.value.filter((item) => item !== seat)
    : [...sellSeats.value, seat];
}

function confirmSell() {
  if (!sellShowtime.value || !canSell.value) return;
  const reservation: Reservation = {
    id: `R${Date.now().toString().slice(-6)}`,
    customerName: sellCustomerName.value.trim(),
    customerEmail: "venta-en-taquilla@cine.com",
    movieId: sellShowtime.value.movieId,
    showtimeId: sellShowtime.value.id,
    cinemaId: sellShowtime.value.cinemaId,
    roomId: sellShowtime.value.roomId,
    date: sellShowtime.value.date,
    time: sellShowtime.value.time,
    seats: [...sellSeats.value],
    status: "confirmada",
    paymentStatus: "pagado",
    paymentMethod: "efectivo",
    transactionId: `TX-EF-${Date.now()}`,
    total: sellTotal.value,
    createdAt: new Date().toISOString().slice(0, 10),
  };
  reservationsStore.addReservation(reservation);
  sellReceipt.value = reservation;
}

function closeSellReceipt() {
  sellReceipt.value = null;
  sellSeats.value = [];
  sellCustomerName.value = "";
  cashReceived.value = 0;
  router.push("/recepcion/vender");
}
</script>

<style scoped>
.section-header { display: flex; justify-content: space-between; gap: 16px; align-items: flex-end; width: min(100%, 1100px); margin: 0 auto 24px; }
.eyebrow { color: #c8a96e; font-family: "DM Mono", monospace; text-transform: uppercase; font-size: 11px; letter-spacing: .09em; margin: 0 0 4px; }
h1 { font-size: clamp(22px, 3vw, 34px); font-weight: 600; color: #f0ece4; margin: 0; font-family: 'Playfair Display', serif; letter-spacing: -0.01em; }
h2 { color: #f0ece4; margin: 0; font-size: 1rem; font-weight: 600; }
p { color: #7a7590; margin: 0; font-size: .875rem; }
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
.summary-line { display: flex; justify-content: space-between; gap: 14px; align-items: center; font-size: .875rem; }
.summary-line strong { text-align: right; color: #f0ece4; }
.selected-seat-list { max-width: 180px; overflow-wrap: anywhere; font-size: .8125rem; }
.summary-line.total { font-size: 1.0625rem; font-weight: 600; padding-top: 10px; border-top: 1px solid rgba(200,169,110,0.12); }
.full { width: 100%; }
.pos-cash-row { display: flex; gap: 12px; align-items: end; }
.pos-change { display: flex; flex-direction: column; align-items: flex-end; gap: 2px; border: 1px solid rgba(76,175,125,0.25); border-radius: 3px; padding: .5rem .75rem; background: rgba(76,175,125,0.05); }
.pos-change strong { font-size: 1.125rem; color: #4caf7d; }
.empty-state { padding: 3rem 1.5rem; text-align: center; color: #7a7590; font-size: .875rem; }
@media (max-width: 900px) {
  .booking-grid { grid-template-columns: 1fr; }
  .checkout-card { position: static; }
}
@media (max-width: 640px) {
  .section-header { align-items: stretch; flex-direction: column; }
  .section-header .ghost-button { justify-content: center; width: 100%; }
  .seat-card, .checkout-card { padding: 1rem; }
  .seat-map { gap: 5px; justify-content: start; }
  .seat { width: 38px; height: 34px; font-size: 10px; }
  .summary-line { align-items: flex-start; }
}
</style>

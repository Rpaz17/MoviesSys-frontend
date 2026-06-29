<template>
  <section class="page">
    <div class="section-header">
      <div>
        <p class="eyebrow">Recepcion</p>
        <h1>Caja de recepcion</h1>
      </div>
    </div>

    <div class="stack">
      <div class="filters-card card">
        <input v-model.trim="receptionSearch" class="input" placeholder="Buscar por reserva, cliente o pelicula" />
      </div>

      <article v-for="reservation in receptionReservations" :key="reservation.id" class="card reservation-row">
        <div>
          <span class="pill">{{ reservation.paymentStatus }}</span>
          <h2>{{ reservation.id }} · {{ reservation.customerName }}</h2>
          <p>{{ movieFor(reservation.movieId)?.title }} · {{ cinemaFor(reservation.cinemaId)?.name }}</p>
          <p>{{ reservation.date }} {{ reservation.time }} · Asientos {{ reservation.seats.join(", ") }}</p>
        </div>
        <div class="row-actions">
          <strong>{{ money(reservation.total) }}</strong>
          <button class="ghost-button" type="button" @click="selectedReservation = reservation">Ver detalle</button>

          <template v-if="reservation.paymentStatus !== 'pagado'">
            <select v-model="paymentMethods[reservation.id]" class="input" style="min-width:110px">
              <option value="efectivo">Efectivo</option>
              <option value="tarjeta">Tarjeta</option>
            </select>

            <template v-if="paymentMethods[reservation.id] === 'tarjeta'">
              <input v-model="cardNumbers[reservation.id]" class="input" placeholder="Nº tarjeta" />
              <input v-model="cardExpiries[reservation.id]" class="input" placeholder="MM/AA" />
              <input v-model="cardCvvs[reservation.id]" class="input" placeholder="CVV" />
            </template>

            <button
              class="primary-button"
              type="button"
              :disabled="paying[reservation.id] || !canPayReservation(reservation)"
              @click="handlePay(reservation)"
            >
              {{ paying[reservation.id] ? 'Procesando...' : 'Pagar ' + (paymentMethods[reservation.id] === 'efectivo' ? 'efectivo' : 'con tarjeta') }}
            </button>
            <p v-if="payErrors[reservation.id]" class="error-msg">{{ payErrors[reservation.id] }}</p>
          </template>
        </div>
      </article>

      <div v-if="receptionReservations.length === 0" class="empty-state card">No se encontraron reservas.</div>
    </div>

    <ReservationDetailModal
      v-if="selectedReservation"
      :reservation="selectedReservation"
      @close="selectedReservation = null"
    />
  </section>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import { storeToRefs } from "pinia";
import { useCatalogStore } from "../../stores/catalog";
import { useReservationsStore } from "../../stores/reservations";
import { useCatalogHelpers } from "../../composables/use-catalog-helpers";
import { useFormat } from "../../composables/use-format";
import ReservationDetailModal from "../../components/ReservationDetailModal.vue";
import type { Reservation } from "../../types";

const catalog = useCatalogStore();
const reservationsStore = useReservationsStore();
const { reservations } = storeToRefs(reservationsStore);
const { movieFor, cinemaFor, priceFor } = useCatalogHelpers();
const { money } = useFormat();

const receptionSearch = ref("");
const selectedReservation = ref<Reservation | null>(null);

const paymentMethods = reactive<Record<string, string>>({});
const cardNumbers = reactive<Record<string, string>>({});
const cardExpiries = reactive<Record<string, string>>({});
const cardCvvs = reactive<Record<string, string>>({});
const paying = reactive<Record<string, boolean>>({});
const payErrors = reactive<Record<string, string>>({});

const receptionReservations = computed(() => {
  const query = receptionSearch.value.toLowerCase();
  const now = Date.now();
  return reservations.value.filter((reservation) => {
    const showDate = new Date(`${reservation.date}T${reservation.time}:00`);
    if (showDate.getTime() <= now) return false;
    const movie = movieFor(reservation.movieId)?.title.toLowerCase() ?? "";
    return !query
      || reservation.id.toLowerCase().includes(query)
      || reservation.customerName.toLowerCase().includes(query)
      || movie.includes(query);
  });
});

function canPayReservation(reservation: Reservation) {
  const method = paymentMethods[reservation.id] || "efectivo";
  if (method === "tarjeta") {
    return !!(cardNumbers[reservation.id] && cardExpiries[reservation.id] && cardCvvs[reservation.id]);
  }
  return true;
}

async function handlePay(reservation: Reservation) {
  const method = (paymentMethods[reservation.id] || "efectivo") as "tarjeta" | "efectivo";
  paying[reservation.id] = true;
  payErrors[reservation.id] = "";

  const seatCount = reservation.seats.length || 1;
  const showtime = catalog.showtimes.find((s) => s.id === reservation.showtimeId);
  const pricePerSeat = showtime ? priceFor(showtime.format) : reservation.total / seatCount;

  const ok = await reservationsStore.payReservation(reservation.id, method, pricePerSeat);
  if (!ok) {
    payErrors[reservation.id] = "Error al procesar el pago. Intenta de nuevo.";
  }
  paying[reservation.id] = false;
}
</script>

<style scoped>
.section-header { display: flex; justify-content: space-between; gap: 16px; align-items: flex-end; width: min(100%, 1100px); margin: 0 auto 24px; }
.eyebrow { color: #c8a96e; font-family: "DM Mono", monospace; text-transform: uppercase; font-size: 11px; letter-spacing: .09em; margin: 0 0 4px; }
h1 { font-size: clamp(22px, 3vw, 34px); font-weight: 600; color: #f0ece4; margin: 0; font-family: 'Playfair Display', serif; letter-spacing: -0.01em; }
h2 { color: #f0ece4; margin: 0; font-size: 1rem; font-weight: 600; }
p { color: #7a7590; margin: 0; font-size: .875rem; }
.filters-card { width: min(100%, 1100px); margin: 0 auto; padding: 1rem 1.125rem; }
.stack { width: min(100%, 1100px); margin: 0 auto; display: grid; gap: 12px; }
.reservation-row { display: flex; justify-content: space-between; gap: 16px; align-items: center; padding: 1.25rem 1.5rem; }
.row-actions { display: grid; gap: 8px; justify-items: end; }
.empty-state { padding: 3rem 1.5rem; text-align: center; color: #7a7590; font-size: .875rem; }
.error-msg { color: #e8607a; font-size: .75rem; margin: 0; text-align: right; }
@media (max-width: 900px) {
  .reservation-row { align-items: stretch; flex-direction: column; }
  .row-actions { justify-items: stretch; }
}
@media (max-width: 640px) {
  .section-header { align-items: stretch; flex-direction: column; }
}
</style>

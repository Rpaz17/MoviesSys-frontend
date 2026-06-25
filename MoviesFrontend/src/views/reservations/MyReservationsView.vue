<template>
  <section class="page">
    <div class="section-header">
      <div>
        <p class="eyebrow">Reserva de entradas</p>
        <h1>Mis reservas</h1>
      </div>
    </div>

    <div v-if="myReservations.length === 0" class="empty-state card">Aún no tienes reservas activas.</div>

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
          <button class="ghost-button" type="button" @click="selectedReservation = reservation">Ver detalle</button>
          <button v-if="reservation.status !== 'cancelada'" class="danger-button" type="button" @click="openCancel(reservation)">Cancelar reserva</button>
        </div>
      </article>
    </div>

    <ReservationDetailModal
      v-if="selectedReservation"
      :reservation="selectedReservation"
      @close="selectedReservation = null"
    />

    <CancelReservationModal
      v-if="cancelTarget"
      :reservation="cancelTarget"
      @close="cancelTarget = null"
      @confirm="confirmCancel"
    />
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { storeToRefs } from "pinia";
import { useReservationsStore } from "../../stores/reservations";
import { useSessionStore } from "../../stores/session";
import { useCatalogStore } from "../../stores/catalog";
import { useCatalogHelpers } from "../../composables/use-catalog-helpers";
import { useFormat } from "../../composables/use-format";
import ReservationDetailModal from "../../components/ReservationDetailModal.vue";
import CancelReservationModal from "../../components/CancelReservationModal.vue";
import type { Reservation } from "../../types";

const reservationsStore = useReservationsStore();
const session = useSessionStore();
const catalog = useCatalogStore();
const { reservations } = storeToRefs(reservationsStore);
const { movieFor, cinemaFor, roomFor } = useCatalogHelpers();
const { money, formatDate } = useFormat();

const selectedReservation = ref<Reservation | null>(null);
const cancelTarget = ref<Reservation | null>(null);

const myReservations = computed(() =>
  reservations.value.filter((item) => item.customerEmail === session.user?.email),
);

function openCancel(reservation: Reservation) {
  cancelTarget.value = reservation;
}

function confirmCancel() {
  if (!cancelTarget.value) return;
  const refund = calculateRefund(cancelTarget.value);
  reservationsStore.cancelReservation(cancelTarget.value.id, refund, "Política estándar de cancelación");
  cancelTarget.value = null;
}

function calculateRefund(reservation: Reservation) {
  const showDate = new Date(`${reservation.date}T${reservation.time}:00`);
  const hours = (showDate.getTime() - Date.now()) / 36e5;
  if (hours > 24) return reservation.total;
  if (hours > 6) return reservation.total * 0.5;
  return 0;
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
.stack {
  width: min(100%, 1100px);
  margin: 0 auto;
  display: grid;
  gap: 12px;
}
.reservation-row {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: center;
  padding: 1.25rem 1.5rem;
}
.row-actions {
  display: grid;
  gap: 8px;
  justify-items: end;
}
.row-actions strong {
  color: #f0ece4;
}
.danger-button {
  border-radius: 3px;
  padding: 0.4375rem 0.875rem;
  font-size: 0.8125rem;
  font-weight: 500;
  color: #ffd8df;
  border: 1px solid rgba(232, 96, 122, 0.3);
  background: rgba(232, 96, 122, 0.08);
  transition: background 0.12s;
}
.danger-button:hover {
  background: rgba(232, 96, 122, 0.15);
}
@media (max-width: 900px) {
  .reservation-row {
    align-items: stretch;
    flex-direction: column;
  }
  .row-actions {
    justify-items: stretch;
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
}
</style>

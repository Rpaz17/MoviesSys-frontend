<template>
  <section class="page">
    <div class="section-header">
      <div>
        <p class="eyebrow">Reserva de entradas</p>
        <h1>Resultado de pago</h1>
      </div>
    </div>

    <div v-if="!reservation" class="empty-state card">Reserva no encontrada.</div>

    <div v-else class="result-card card">
      <span class="pill">Pago exitoso</span>
      <h2>Reserva {{ reservation.id }}</h2>
      <p>{{ movie?.title }} · {{ formatDate(reservation.date) }} · {{ reservation.time }}</p>
      <p>Asientos {{ reservation.seats.join(", ") }} · Total {{ money(reservation.total) }}</p>
      <div class="form-actions">
        <button class="ghost-button" type="button" @click="router.push('/reservas/mis-reservas')">Ver mis reservas</button>
        <button class="primary-button" type="button" @click="router.push('/reservas/funciones')">Comprar otra entrada</button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { storeToRefs } from "pinia";
import { useReservationsStore } from "../../stores/reservations";
import { useCatalogStore } from "../../stores/catalog";
import { useCatalogHelpers } from "../../composables/use-catalog-helpers";
import { useFormat } from "../../composables/use-format";
import type { Reservation } from "../../types";

const route = useRoute();
const router = useRouter();
const reservationsStore = useReservationsStore();
const catalog = useCatalogStore();
const { reservations } = storeToRefs(reservationsStore);
const { movieFor } = useCatalogHelpers();
const { money, formatDate } = useFormat();

const reservationId = computed(() => String(route.params.reservationId));
const reservation = computed(() => reservations.value.find((r) => r.id === reservationId.value));
const movie = computed(() => (reservation.value ? catalog.movieById(reservation.value.movieId) : undefined));

function isPast(reservation: Reservation) {
  const showDate = new Date(`${reservation.date}T${reservation.time}:00`);
  return showDate.getTime() <= Date.now();
}

onMounted(() => {
  const r = reservation.value;
  if (r && isPast(r)) {
    router.replace("/");
  }
});
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
.result-card {
  width: min(100%, 640px);
  margin: 0 auto;
  padding: 2rem 1.5rem;
  display: grid;
  gap: 14px;
  text-align: center;
  justify-items: center;
}
.result-card .pill {
  margin-bottom: 4px;
}
.form-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: center;
  margin-top: 8px;
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
  .form-actions {
    flex-direction: column;
    width: 100%;
  }
}
</style>

<template>
  <section class="page">
    <div class="section-header">
      <div>
        <p class="eyebrow">Recepcion</p>
        <h1>Funciones de hoy</h1>
      </div>
    </div>

    <div v-if="isLoading" class="empty-state card">Cargando funciones...</div>

    <div v-else class="cinema-groups">
      <section v-for="group in todayShowtimeGroups" :key="group.cinema.id" class="cinema-group">
        <div class="group-heading">
          <div>
            <h2>{{ group.cinema.name }}</h2>
            <p>{{ group.cinema.city }} · {{ group.cinema.address }}</p>
          </div>
          <span class="pill">{{ group.items.length }} funciones</span>
        </div>
        <div class="funciones-list">
          <article v-for="showtime in group.items" :key="showtime.id" class="card funcion-row">
            <div class="funcion-row-info">
              <span class="pill">{{ showtime.format }}</span>
              <span class="funcion-date">{{ formatDate(showtime.date) }} · {{ showtime.time }}</span>
              <span>{{ movieFor(showtime.movieId)?.title }}</span>
            </div>
            <div class="funcion-row-action">
              <strong>{{ money(priceFor(showtime.format)) }}</strong>
              <button class="primary-button" type="button" @click="router.push(`/recepcion/vender/${showtime.id}`)">Seleccionar</button>
            </div>
          </article>
        </div>
      </section>
      <div v-if="todayShowtimeGroups.length === 0" class="empty-state card">No hay funciones activas para hoy.</div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useCatalogStore } from "../../stores/catalog";
import { useCatalogHelpers } from "../../composables/use-catalog-helpers";
import { useFormat } from "../../composables/use-format";

const router = useRouter();
const catalog = useCatalogStore();
const { movieFor, priceFor } = useCatalogHelpers();
const { money, formatDate } = useFormat();

const isLoading = ref(false);

onMounted(async () => {
  console.log("[SellFunctionsView] mounted, showtimes:", catalog.showtimes.length);
  isLoading.value = true;
  await catalog.loadAllShowtimes();
  console.log("[SellFunctionsView] post loadAllShowtimes, showtimes:", catalog.showtimes.length);
  isLoading.value = false;
});

const todayShowtimes = computed(() =>
  catalog.showtimes.filter(
    (item) => item.status === "activo" && item.date === new Date().toISOString().slice(0, 10)
  )
);

const todayShowtimeGroups = computed(() =>
  catalog.cinemas
    .map((cinema) => ({
      cinema,
      items: todayShowtimes.value.filter((showtime) => showtime.cinemaId === cinema.id),
    }))
    .filter((group) => group.items.length > 0)
);
</script>

<style scoped>
.section-header { display: flex; justify-content: space-between; gap: 16px; align-items: flex-end; width: min(100%, 1100px); margin: 0 auto 24px; }
.eyebrow { color: #c8a96e; font-family: "DM Mono", monospace; text-transform: uppercase; font-size: 11px; letter-spacing: .09em; margin: 0 0 4px; }
h1 { font-size: clamp(22px, 3vw, 34px); font-weight: 600; color: #f0ece4; margin: 0; font-family: 'Playfair Display', serif; letter-spacing: -0.01em; }
h2 { color: #f0ece4; margin: 0; font-size: 1rem; font-weight: 600; }
p { color: #7a7590; margin: 0; font-size: .875rem; }
.cinema-groups { width: min(100%, 1100px); margin: 0 auto; display: grid; gap: 24px; }
.cinema-group { display: grid; gap: 12px; }
.group-heading { display: flex; justify-content: space-between; gap: 12px; align-items: end; border-bottom: 1px solid rgba(200,169,110,.1); padding-bottom: 10px; }
.funciones-list { display: grid; gap: 8px; }
.funcion-row { display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: .875rem 1.125rem; }
.funcion-row-info { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; min-width: 0; }
.funcion-date { color: #f0ece4; font-size: .875rem; font-weight: 500; }
.funcion-row-action { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
.empty-state { padding: 3rem 1.5rem; text-align: center; color: #7a7590; font-size: .875rem; }
@media (max-width: 900px) {
  .funcion-row { align-items: stretch; flex-direction: column; }
  .funcion-row-action { justify-content: space-between; width: 100%; }
}
@media (max-width: 640px) {
  .section-header { align-items: stretch; flex-direction: column; }
}
</style>

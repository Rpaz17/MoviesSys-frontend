<template>
  <section class="page">
    <div class="section-header">
      <div>
        <p class="eyebrow">Reserva de entradas</p>
        <h1>Funciones disponibles</h1>
      </div>
    </div>

    <div class="filters-card card">
      <input v-model.trim="search" class="input" placeholder="Buscar película" />
      <select v-model="genreFilter" class="input">
        <option value="">Todos los géneros</option>
        <option v-for="genre in genres" :key="genre" :value="genre">{{ genre }}</option>
      </select>
      <select v-model="languageFilter" class="input">
        <option value="">Todos los idiomas</option>
        <option v-for="language in languages" :key="language" :value="language">{{ language }}</option>
      </select>
      <input v-model="dateFilter" class="input" type="date" />
      <select v-model="cityFilter" class="input">
        <option value="">Todas las ciudades</option>
        <option v-for="city in cities" :key="city" :value="city">{{ city }}</option>
      </select>
      <select v-model="cinemaFilter" class="input">
        <option value="">Todos los cines</option>
        <option v-for="cinema in filteredCinemas" :key="cinema.id" :value="cinema.id">{{ cinema.name }}</option>
      </select>
    </div>

    <div v-if="isLoading" class="empty-state card">Cargando funciones...</div>

    <div v-else class="cinema-groups">
      <section v-for="group in showtimeGroups" :key="group.cinema.id" class="cinema-group">
        <div class="group-heading">
          <div>
            <h2>{{ group.cinema.name }}</h2>
            <p>{{ group.cinema.city }} · {{ group.cinema.address }}</p>
          </div>
          <span class="pill">{{ group.items.length }} funciones</span>
        </div>
        <div class="grid-list">
          <article v-for="showtime in group.items" :key="showtime.id" class="card function-card">
            <img :src="imageUrl(movieFor(showtime.movieId)?.img)" :alt="movieFor(showtime.movieId)?.title" />
            <div class="card-body">
              <span class="pill">{{ showtime.format }}</span>
              <h2>{{ movieFor(showtime.movieId)?.title }}</h2>
              <p>{{ roomFor(showtime.roomId)?.name }}</p>
              <p>{{ formatDate(showtime.date) }} · {{ showtime.time }}</p>
              <div class="row-between">
                <strong>{{ money(priceFor(showtime.format)) }}</strong>
                <button class="primary-button" type="button" @click="handleReservar(showtime)">Reservar</button>
              </div>
            </div>
          </article>
        </div>
      </section>
      <div v-if="showtimeGroups.length === 0" class="empty-state card">No hay funciones con esos filtros.</div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { useCatalogStore } from "../../stores/catalog";
import { useSessionStore } from "../../stores/session";
import { useCatalogHelpers } from "../../composables/use-catalog-helpers";
import { useFormat } from "../../composables/use-format";
import type { Showtime } from "../../types";

const router = useRouter();
const catalog = useCatalogStore();
const session = useSessionStore();
const { movieFor, cinemaFor, roomFor, priceFor } = useCatalogHelpers();
const { money, formatDate, imageUrl } = useFormat();

const isLoading = ref(false);

const search = ref("");
const genreFilter = ref("");
const languageFilter = ref("");
const dateFilter = ref("");
const cityFilter = ref("");
const cinemaFilter = ref("");

const availableShowtimes = computed(() =>
  catalog.showtimes.filter((item) => {
    if (item.status !== "activo") return false;
    const movie = movieFor(item.movieId);
    const cinema = cinemaFor(item.cinemaId);
    const query = search.value.toLowerCase();
    return (
      (!query || movie?.title.toLowerCase().includes(query)) &&
      (!genreFilter.value || movie?.genre === genreFilter.value) &&
      (!languageFilter.value || movie?.language === languageFilter.value) &&
      (!dateFilter.value || item.date === dateFilter.value) &&
      (!cityFilter.value || cinema?.city === cityFilter.value) &&
      (!cinemaFilter.value || item.cinemaId === cinemaFilter.value)
    );
  }),
);

const showtimeGroups = computed(() =>
  catalog.cinemas
    .map((cinema) => ({
      cinema,
      items: availableShowtimes.value.filter((showtime) => showtime.cinemaId === cinema.id),
    }))
    .filter((group) => group.items.length > 0),
);

const genres = computed(() => [...new Set(catalog.movies.map((movie) => movie.genre))]);
const languages = computed(() => [...new Set(catalog.movies.map((movie) => movie.language))]);
const cities = computed(() => [...new Set(catalog.cinemas.map((cinema) => cinema.city))]);
const filteredCinemas = computed(() =>
  catalog.cinemas.filter((cinema) => !cityFilter.value || cinema.city === cityFilter.value),
);

watch([cityFilter, cinemaFilter], () => {
  if (cinemaFilter.value && !filteredCinemas.value.some((cinema) => cinema.id === cinemaFilter.value)) {
    cinemaFilter.value = "";
  }
});

onMounted(async () => {
  isLoading.value = true;
  if (catalog.cinemas.length === 0 || catalog.movies.length === 0) {
    await catalog.loadFromAPI();
  }
  await catalog.loadAllShowtimes();
  isLoading.value = false;
});

function handleReservar(showtime: Showtime) {
  if (!session.user) {
    router.push({
      path: "/login",
      query: {
        reason: "checkout",
        redirect: `/reservas/funciones/${showtime.id}/asientos`,
      },
    });
    return;
  }
  router.push(`/reservas/funciones/${showtime.id}/asientos`);
}
</script>

<style scoped>
.section-header { display: flex; justify-content: space-between; gap: 16px; align-items: flex-end; width: min(100%, 1100px); margin: 0 auto 24px; }
.eyebrow { color: #c8a96e; font-family: "DM Mono", monospace; text-transform: uppercase; font-size: 11px; letter-spacing: .09em; margin: 0 0 4px; }
h1 { font-size: clamp(22px, 3vw, 34px); font-weight: 600; color: #f0ece4; margin: 0; font-family: 'Playfair Display', serif; letter-spacing: -0.01em; }
h2 { color: #f0ece4; margin: 0; font-size: 1rem; font-weight: 600; }
p { color: #7a7590; margin: 0; font-size: .875rem; }
.filters-card { width: min(100%, 1100px); margin: 0 auto 24px; display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 10px; padding: 1rem 1.125rem; align-items: end; }
.filters-card .input { min-width: 0; }
.grid-list { width: min(100%, 1100px); margin: 0 auto; display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 16px; }
.cinema-groups { width: min(100%, 1100px); margin: 0 auto; display: grid; gap: 24px; }
.cinema-group { display: grid; gap: 12px; }
.group-heading { display: flex; justify-content: space-between; gap: 12px; align-items: end; border-bottom: 1px solid rgba(200,169,110,.1); padding-bottom: 10px; }
.function-card { overflow: hidden; padding: 0; transition: transform .15s, border-color .15s; }
.function-card:hover { transform: translateY(-2px); border-color: rgba(200,169,110,0.22); }
.function-card img { width: 100%; height: 170px; object-fit: cover; }
.card-body { padding: 1rem 1.125rem; display: grid; gap: 8px; }
.row-between { display: flex; justify-content: space-between; gap: 14px; align-items: center; font-size: .875rem; }
.row-between strong { text-align: right; color: #f0ece4; }
.empty-state { padding: 3rem 1.5rem; text-align: center; color: #7a7590; font-size: .875rem; }
@media (max-width: 640px) {
  .section-header { align-items: stretch; flex-direction: column; }
  .section-header .ghost-button { justify-content: center; width: 100%; }
}
</style>

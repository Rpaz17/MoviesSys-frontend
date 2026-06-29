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
          <article v-for="funcion in group.items" :key="funcion.id" class="card function-card">
            <img :src="imageUrl(catalog.movieById(funcion.movieId)?.img)" :alt="catalog.movieById(funcion.movieId)?.title" />
            <div class="card-body">
              <span class="pill">{{ funcion.sala.nombre }}</span>
              <h2>{{ catalog.movieById(funcion.movieId)?.title }}</h2>
              <p>{{ formatDate(dateFrom(funcion.fecha_hora)) }} · {{ timeFrom(funcion.fecha_hora) }}</p>
              <div class="row-between">
                <strong>{{ funcion.disponibilidad.disponibles }} asientos libres</strong>
                <button
                  v-if="funcion.disponibilidad.disponibles > 0"
                  class="primary-button"
                  type="button"
                  @click="handleReservar(funcion)"
                >
                  Reservar
                </button>
                <span v-else class="pill pill-full">Función llena</span>
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
import { useFormat } from "../../composables/use-format";
import { funcionesService } from "../../services/funciones.service";
import type { FuncionDisponibilidad } from "../../services/funciones.service";

interface FuncionItem extends FuncionDisponibilidad {
  movieId: string;
  cinemaId: string;
}

const router = useRouter();
const catalog = useCatalogStore();
const session = useSessionStore();
const { formatDate, imageUrl } = useFormat();
const { fromUTC } = useFormat();

const isLoading = ref(false);
const funciones = ref<FuncionItem[]>([]);

const search = ref("");
const genreFilter = ref("");
const languageFilter = ref("");
const dateFilter = ref("");
const cityFilter = ref("");
const cinemaFilter = ref("");

function dateFrom(fecha_hora: string) {
  return fromUTC(fecha_hora).date;
}

function timeFrom(fecha_hora: string) {
  return fromUTC(fecha_hora).time;
}

const availableFunciones = computed(() =>
  funciones.value.filter((item) => {
    const movie = catalog.movieById(item.movieId);
    const cinema = catalog.cinemaById(item.cinemaId);
    const query = search.value.toLowerCase();
    const isFuture = new Date(item.fecha_hora).getTime() > Date.now();
    return (
      isFuture &&
      (!query || movie?.title.toLowerCase().includes(query)) &&
      (!genreFilter.value || movie?.genre === genreFilter.value) &&
      (!languageFilter.value || movie?.language === languageFilter.value) &&
      (!dateFilter.value || dateFrom(item.fecha_hora) === dateFilter.value) &&
      (!cityFilter.value || cinema?.city === cityFilter.value) &&
      (!cinemaFilter.value || item.cinemaId === cinemaFilter.value)
    );
  }),
);

const showtimeGroups = computed(() =>
  catalog.cinemas
    .map((cinema) => ({
      cinema,
      items: availableFunciones.value.filter((f) => f.cinemaId === cinema.id),
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

  const activeMovies = catalog.movies.filter((m) => m.activo);
  const results = await Promise.allSettled(
    activeMovies.flatMap((movie) =>
      catalog.cinemas.map((cinema) =>
        funcionesService
          .getFuncionesDisponibilidad(movie.id, cinema.id)
          .then((data) => ({ movieId: movie.id, cinemaId: cinema.id, data })),
      ),
    ),
  );

  const all: FuncionItem[] = [];
  for (const result of results) {
    if (result.status !== "fulfilled") continue;
    const { movieId, cinemaId, data } = result.value;
    for (const f of data) {
      all.push({ ...f, movieId, cinemaId });
    }
  }
  funciones.value = all;
  isLoading.value = false;
});

function handleReservar(funcion: FuncionItem) {
  const seatUrl = `/reservas/funciones/${funcion.id}/asientos?movieId=${funcion.movieId}&cinemaId=${funcion.cinemaId}&room=${encodeURIComponent(funcion.sala.nombre)}&fecha=${encodeURIComponent(funcion.fecha_hora)}`;
  if (!session.user) {
    router.push({
      path: "/login",
      query: {
        reason: "checkout",
        redirect: seatUrl,
      },
    });
    return;
  }
  router.push(seatUrl);
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
.pill-full {
  background: rgba(200, 60, 60, 0.15);
  color: #e06060;
  border-color: transparent;
  white-space: nowrap;
}
.card-body { padding: 1rem 1.125rem; display: grid; gap: 8px; }
.row-between { display: flex; justify-content: space-between; gap: 14px; align-items: center; font-size: .875rem; }
.row-between strong { text-align: right; color: #f0ece4; }
.empty-state { padding: 3rem 1.5rem; text-align: center; color: #7a7590; font-size: .875rem; }
@media (max-width: 640px) {
  .section-header { align-items: stretch; flex-direction: column; }
  .section-header .ghost-button { justify-content: center; width: 100%; }
}
</style>

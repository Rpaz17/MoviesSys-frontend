<template>
  <section class="page">
    <div class="section-header">
      <div>
        <p class="eyebrow">Reserva de entradas</p>
        <h1>{{ movieData?.title ?? "Película" }}</h1>
      </div>
      <button class="ghost-button" type="button" @click="router.push('/reservas/peliculas')">Volver a películas</button>
    </div>

    <div v-if="!movieData" class="empty-state card">Película no encontrada.</div>

    <div v-else class="movie-split">
      <aside class="card movie-info-card">
        <img :src="imageUrl(movieData.img)" :alt="movieData.title" class="movie-poster" />
        <div class="movie-info-body">
          <span class="pill">{{ movieData.status }}</span>
          <h2>{{ movieData.title }}</h2>
          <p>{{ movieData.genre }} · {{ movieData.language }}</p>
          <p>{{ movieData.rating }} · {{ movieData.duration }}</p>
          <p class="muted">Dirigida por {{ movieData.director }}</p>
          <p class="muted">Estreno: {{ movieData.releaseDate }}</p>
        </div>
      </aside>

      <div class="movie-functions-panel">
        <div v-if="movieShowtimeGroups.length === 0" class="empty-state card">No hay funciones disponibles para esta película.</div>
        <section v-for="group in movieShowtimeGroups" :key="group.cinema.id" class="cinema-group">
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
                <span class="funcion-room">{{ roomFor(showtime.roomId)?.name }}</span>
              </div>
              <div class="funcion-row-action">
                <strong>{{ money(priceFor(showtime.format)) }}</strong>
                <button class="primary-button" type="button" @click="handleReservar(showtime)">Reservar</button>
              </div>
            </article>
          </div>
        </section>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useCatalogStore } from "../../stores/catalog";
import { useSessionStore } from "../../stores/session";
import { useCatalogHelpers } from "../../composables/use-catalog-helpers";
import { useFormat } from "../../composables/use-format";
import type { Showtime } from "../../types";

const route = useRoute();
const router = useRouter();
const catalog = useCatalogStore();
const session = useSessionStore();
const { movieFor, cinemaFor, roomFor, priceFor } = useCatalogHelpers();
const { money, formatDate, imageUrl } = useFormat();

const movieId = computed(() => String(route.params.movieId));
const movieData = computed(() => catalog.movieById(movieId.value));

const availableShowtimes = computed(() =>
  catalog.showtimes.filter((item) => item.status === "activo" && item.movieId === movieId.value),
);

const movieShowtimeGroups = computed(() =>
  catalog.cinemas
    .map((cinema) => ({
      cinema,
      items: availableShowtimes.value.filter((showtime) => showtime.cinemaId === cinema.id),
    }))
    .filter((group) => group.items.length > 0),
);

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
.movie-split {
  width: min(100%, 1100px);
  margin: 0 auto;
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  gap: 18px;
  align-items: start;
}
.movie-info-card {
  min-width: 0;
  padding: 0;
  overflow: hidden;
  position: sticky;
  top: 72px;
}
.movie-poster {
  width: 100%;
  aspect-ratio: 2 / 3;
  object-fit: cover;
  display: block;
}
.movie-info-body {
  padding: 1rem 1.125rem;
  display: grid;
  gap: 8px;
}
.movie-functions-panel {
  display: grid;
  gap: 20px;
  min-width: 0;
}
.cinema-group {
  display: grid;
  gap: 12px;
}
.group-heading {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: end;
  border-bottom: 1px solid rgba(200, 169, 110, 0.1);
  padding-bottom: 10px;
}
.funciones-list {
  display: grid;
  gap: 8px;
}
.funcion-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 0.875rem 1.125rem;
}
.funcion-row-info {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  min-width: 0;
}
.funcion-date {
  color: #f0ece4;
  font-size: 0.875rem;
  font-weight: 500;
}
.funcion-room {
  color: #7a7590;
  font-size: 0.8125rem;
}
.funcion-row-action {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}
.funcion-row-action strong {
  color: #f0ece4;
}
.full {
  width: 100%;
}
@media (max-width: 900px) {
  .movie-split {
    grid-template-columns: 1fr;
  }
  .movie-info-card {
    position: static;
  }
  .movie-poster {
    aspect-ratio: 16 / 9;
    max-height: 240px;
  }
  .funcion-row {
    align-items: stretch;
    flex-direction: column;
  }
  .funcion-row-action {
    justify-content: space-between;
    width: 100%;
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

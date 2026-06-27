<template>
  <section class="page">
    <div class="page-inner">
      <div class="section-header">
        <div>
          <p class="eyebrow">Panel de administrador</p>
          <h1>Películas</h1>
        </div>
        <div class="header-actions">
          <button class="ghost-button" type="button" @click="router.push('/admin')">
            <LayoutDashboard class="w-3.5 h-3.5" /> Dashboard
          </button>
          <button class="primary-button" type="button" @click="router.push('/admin/peliculas/crear')">Nueva película</button>
        </div>
      </div>

      <div class="grid-list">
        <article v-for="movie in catalog.movies" :key="movie.id" class="card catalog-card">
          <img :src="imageUrl(movie.img)" :alt="movie.title" />
          <div class="card-body">
            <span class="pill">{{ movie.status }}</span>
            <h2>{{ movie.title }}</h2>
            <p>{{ movie.genre }} · {{ movie.language }} · {{ movie.duration }}</p>
            <p>{{ movie.director }}</p>
            <p>Cines disponibles: {{ cinemasForMovie(movie.id).join(", ") || "Sin funciones activas" }}</p>
            <div class="row-between">
              <span>{{ movie.reservations }} reservas</span>
              <div class="row-actions">
                <button class="ghost-button" type="button" @click="catalog.toggleMovieStatus(movie.id)">Estado</button>
                <button class="ghost-button" type="button" @click="router.push('/admin/peliculas/' + movie.id + '/editar')">Editar</button>
              </div>
            </div>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";
import { LayoutDashboard } from "lucide-vue-next";
import { useCatalogStore } from "../../stores/catalog";
import { useFormat } from "../../composables/use-format";
import { useCatalogHelpers } from "../../composables/use-catalog-helpers";

const router = useRouter();
const catalog = useCatalogStore();
const { imageUrl } = useFormat();
const { cinemaFor } = useCatalogHelpers();

function cinemasForMovie(movieId: string) {
  const cinemaNames = catalog.showtimes
    .filter((showtime) => showtime.movieId === movieId && showtime.status === "activo")
    .map((showtime) => cinemaFor(showtime.cinemaId)?.name)
    .filter(Boolean) as string[];
  return [...new Set(cinemaNames)];
}
</script>

<style scoped>
.section-header { display: flex; justify-content: space-between; gap: 14px; align-items: flex-end; margin-bottom: 20px; }
.eyebrow { color: #c8a96e; font-family: "DM Mono", monospace; text-transform: uppercase; font-size: 11px; letter-spacing: .09em; margin: 0 0 4px; }
h1 { font-size: clamp(20px, 2.5vw, 30px); font-weight: 600; color: #f0ece4; margin: 0; font-family: 'Playfair Display', serif; letter-spacing: -0.01em; }
h2 { font-size: .9375rem; font-weight: 600; color: #f0ece4; margin: 0; }
p, span { color: #7a7590; font-size: .875rem; margin: 0; }
.header-actions { display: flex; flex-wrap: wrap; gap: 8px; }
.grid-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 14px; }
.catalog-card { overflow: hidden; padding: 0; transition: transform .15s, border-color .15s; }
.catalog-card:hover { transform: translateY(-2px); border-color: rgba(200,169,110,0.22); }
.catalog-card img { width: 100%; height: 160px; object-fit: cover; }
.card-body { padding: 1rem 1.125rem; display: grid; gap: 10px; }
.row-between { display: flex; justify-content: space-between; align-items: center; gap: 10px; }
.row-actions { display: flex; gap: 7px; }
@media (max-width: 900px) {
  .section-header { align-items: stretch; flex-direction: column; }
}
</style>

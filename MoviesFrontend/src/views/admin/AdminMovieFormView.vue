<template>
  <section class="page">
    <div class="page-inner">
      <div class="section-header">
        <div>
          <p class="eyebrow">Panel de administrador</p>
          <h1>{{ isEdit ? "Editar película" : "Crear película" }}</h1>
        </div>
        <div class="header-actions">
          <button class="ghost-button" type="button" @click="router.push('/admin')">
            <LayoutDashboard class="w-3.5 h-3.5" /> Dashboard
          </button>
        </div>
      </div>

      <form class="card form-card" @submit.prevent="saveMovie">
        <div class="form-grid">
          <label class="field">Título<input v-model="movieForm.title" class="input" required /></label>
          <label class="field">Género<input v-model="movieForm.genre" class="input" required /></label>
          <label class="field">Idioma<input v-model="movieForm.language" class="input" required /></label>
          <label class="field">Clasificación<input v-model="movieForm.rating" class="input" required /></label>
          <label class="field">Duración<input v-model="movieForm.duration" class="input" required /></label>
          <label class="field">Estreno<input v-model="movieForm.releaseDate" class="input" type="date" required /></label>
          <label class="field">Director<input v-model="movieForm.director" class="input" required /></label>
          <label class="field">Estado
            <select v-model="movieForm.status" class="input">
              <option value="en-cartelera">En cartelera</option>
              <option value="proximamente">Próximamente</option>
              <option value="inactivo">Inactivo</option>
            </select>
          </label>
          <label class="field wide">URL de imagen
            <input v-model="movieForm.img" class="input" placeholder="photo-1489599849927-2ee91cede3ba o https://..." />
          </label>
          <div class="field wide">
            <span class="sample-label">Pósters de muestra</span>
            <div class="sample-row">
              <button v-for="sample in POSTER_SAMPLES" :key="sample.url" type="button" class="sample-chip" :class="{ active: movieForm.img === sample.url }" @click="movieForm.img = sample.url">{{ sample.label }}</button>
            </div>
          </div>
          <label class="field wide">Subir archivo
            <input class="input" type="file" accept="image/*" @change="loadMovieImage" />
          </label>
        </div>
        <img v-if="movieForm.img" class="poster-preview" :src="imageUrl(movieForm.img)" :alt="movieForm.title" />
        <div class="form-actions">
          <button class="ghost-button" type="button" @click="router.push('/admin/peliculas')">Cancelar</button>
          <button class="primary-button" type="submit">Guardar película</button>
        </div>
      </form>
    </div>
  </section>
</template>

<script setup lang="ts">
import { reactive, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { LayoutDashboard } from "lucide-vue-next";
import { useCatalogStore } from "../../stores/catalog";
import { useFormat } from "../../composables/use-format";
import { POSTER_SAMPLES } from "../../data/mockData";
import type { CatalogMovie } from "../../types";

const route = useRoute();
const router = useRouter();
const catalog = useCatalogStore();
const { imageUrl } = useFormat();

const isEdit = computed(() => !!route.params.id);

const existing = isEdit.value ? catalog.movieById(String(route.params.id)) : undefined;

const movieForm = reactive<CatalogMovie>(
  existing
    ? { ...existing }
    : { id: "", title: "", genre: "", language: "", rating: "", duration: "", releaseDate: "", director: "", status: "en-cartelera", reservations: 0, revenue: "$0", img: "photo-1489599849927-2ee91cede3ba" }
);

function loadMovieImage(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    movieForm.img = String(reader.result);
  };
  reader.readAsDataURL(file);
}

function saveMovie() {
  const next = { ...movieForm, id: movieForm.id || `M${String(catalog.movies.length + 1).padStart(3, "0")}` };
  const index = catalog.movies.findIndex((movie) => movie.id === next.id);
  if (index >= 0) catalog.movies[index] = next;
  else catalog.movies.unshift(next);
  router.push("/admin/peliculas");
}
</script>

<style scoped>
.section-header { display: flex; justify-content: space-between; gap: 14px; align-items: flex-end; margin-bottom: 20px; }
.eyebrow { color: #c8a96e; font-family: "DM Mono", monospace; text-transform: uppercase; font-size: 11px; letter-spacing: .09em; margin: 0 0 4px; }
h1 { font-size: clamp(20px, 2.5vw, 30px); font-weight: 600; color: #f0ece4; margin: 0; font-family: 'Playfair Display', serif; letter-spacing: -0.01em; }
.header-actions { display: flex; flex-wrap: wrap; gap: 8px; }
.form-card { padding: 1.5rem; display: grid; gap: 1.125rem; }
.form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
.field { display: grid; gap: 6px; color: #c8a96e; font-size: .8125rem; font-weight: 500; }
.wide { grid-column: 1 / -1; }
.form-actions { display: flex; justify-content: space-between; align-items: center; gap: 10px; }
.poster-preview { width: min(280px, 100%); aspect-ratio: 2 / 3; object-fit: cover; border-radius: 3px; border: 1px solid rgba(200,169,110,.14); }
.sample-label { font-size: .75rem; color: #7a7590; }
.sample-row { display: flex; flex-wrap: wrap; gap: 6px; }
.sample-chip { font-size: .75rem; padding: .3125rem .625rem; border-radius: 3px; color: #9e9ab0; border: 1px solid rgba(200,169,110,0.14); background: rgba(255,255,255,0.02); transition: background .12s, border-color .12s, color .12s; cursor: pointer; }
.sample-chip:hover { background: rgba(200,169,110,0.08); border-color: rgba(200,169,110,0.28); color: #c8a96e; }
.sample-chip.active { background: rgba(200,169,110,0.12); border-color: rgba(200,169,110,0.35); color: #c8a96e; }
@media (max-width: 900px) {
  .section-header, .form-actions { align-items: stretch; flex-direction: column; }
  .form-grid { grid-template-columns: 1fr; }
  .wide { grid-column: auto; }
}
</style>

<template>
  <section class="page">
    <div class="section-header">
      <div>
        <p class="eyebrow">Reserva de entradas</p>
        <h1>Películas con cines disponibles</h1>
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
    </div>

    <div class="grid-list">
      <article v-for="movie in availableMovies" :key="movie.id" class="card function-card">
        <img :src="imageUrl(movie.img)" :alt="movie.title" />
        <div class="card-body">
          <span class="pill">{{ movie.activo ? 'En cartelera' : 'Inactivo' }}</span>
          <h2>{{ movie.title }}</h2>
          <p>{{ movie.genre }} · {{ movie.language }}</p>
          <p class="muted">{{ movie.releaseDate ? 'Estreno: ' + formatDate(movie.releaseDate) : 'Próximamente' }}</p>
          <button class="primary-button" type="button" @click="router.push(`/reservas/peliculas/${movie.id}`)">Ver funciones</button>
        </div>
      </article>
      <div v-if="availableMovies.length === 0" class="empty-state card">No hay películas con esos filtros.</div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import { useCatalogStore } from "../../stores/catalog";
import { useFormat } from "../../composables/use-format";

const router = useRouter();
const catalog = useCatalogStore();
const { formatDate, imageUrl } = useFormat();

const search = ref("");
const genreFilter = ref("");
const languageFilter = ref("");

const availableMovies = computed(() =>
  catalog.movies.filter((movie) => {
    const query = search.value.toLowerCase();
    return (
      movie.activo &&
      (!query || movie.title.toLowerCase().includes(query)) &&
      (!genreFilter.value || movie.genre === genreFilter.value) &&
      (!languageFilter.value || movie.language === languageFilter.value)
    );
  }),
);

const genres = computed(() => [...new Set(catalog.movies.map((movie) => movie.genre))]);
const languages = computed(() => [...new Set(catalog.movies.map((movie) => movie.language))]);
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
.filters-card {
  width: min(100%, 1100px);
  margin: 0 auto 24px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 10px;
  padding: 1rem 1.125rem;
  align-items: end;
}
.filters-card .input {
  min-width: 0;
}
.grid-list {
  width: min(100%, 1100px);
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
}
.function-card {
  overflow: hidden;
  padding: 0;
  transition: transform 0.15s, border-color 0.15s;
}
.function-card:hover {
  transform: translateY(-2px);
  border-color: rgba(200, 169, 110, 0.22);
}
.function-card img {
  width: 100%;
  height: 170px;
  object-fit: cover;
}
.card-body {
  padding: 1rem 1.125rem;
  display: grid;
  gap: 8px;
}
.empty-state {
  padding: 3rem 1.5rem;
  text-align: center;
  color: #7a7590;
  font-size: 0.875rem;
  grid-column: 1 / -1;
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

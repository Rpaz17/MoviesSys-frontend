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
          <label class="field">Género<input v-model="movieForm.genre" class="input" list="movie-genres" required /></label>
          <label class="field">Idioma<input v-model="movieForm.language" class="input" list="movie-languages" required /></label>
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
        <datalist id="movie-genres">
          <option v-for="genre in generos" :key="genre.id" :value="genre.nombre" />
        </datalist>
        <datalist id="movie-languages">
          <option v-for="language in idiomas" :key="language.id" :value="language.nombre" />
        </datalist>
        <img v-if="movieForm.img" class="poster-preview" :src="imageUrl(movieForm.img)" :alt="movieForm.title" />
        <p v-if="feedback" class="form-feedback" :class="feedbackType">{{ feedback }}</p>
        <div class="form-actions">
          <button class="ghost-button" type="button" @click="router.push('/admin/peliculas')">Cancelar</button>
          <button class="primary-button" type="submit" :disabled="isSaving">{{ isSaving ? "Guardando..." : "Guardar película" }}</button>
        </div>
      </form>
    </div>
  </section>
</template>

<script setup lang="ts">
import { reactive, computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { LayoutDashboard } from "lucide-vue-next";
import { useCatalogStore } from "../../stores/catalog";
import { useSessionStore } from "../../stores/session";
import { useFormat } from "../../composables/use-format";
import { POSTER_SAMPLES } from "../../data/posterSamples";
import { peliculasService, type Genero, type Idioma } from "../../services/peliculas.service";
import type { CatalogMovie } from "../../types";

type MovieFormState = CatalogMovie & {
  status: "en-cartelera" | "proximamente" | "inactivo";
};

const route = useRoute();
const router = useRouter();
const catalog = useCatalogStore();
const session = useSessionStore();
const { imageUrl } = useFormat();

const isEdit = computed(() => !!route.params.id);
const isSaving = ref(false);
const feedback = ref("");
const feedbackType = ref<"success" | "error">("success");
const generos = ref<Genero[]>([]);
const idiomas = ref<Idioma[]>([]);

const existing = isEdit.value ? catalog.movieById(String(route.params.id)) : undefined;
const defaultMovieForm: MovieFormState = {
  id: "",
  title: "",
  genre: "",
  language: "",
  rating: "",
  duration: "",
  releaseDate: "",
  director: "",
  activo: true,
  status: "en-cartelera",
  reservations: 0,
  revenue: "$0",
  img: "photo-1489599849927-2ee91cede3ba",
};

const movieForm = reactive<MovieFormState>(
  existing
    ? { ...existing, status: existing.activo ? "en-cartelera" : "inactivo" }
    : { ...defaultMovieForm }
);

onMounted(async () => {
  const [genreData, languageData] = await Promise.all([
    peliculasService.getGeneros().catch(() => []),
    peliculasService.getIdiomas().catch(() => []),
  ]);
  generos.value = genreData.filter((item) => item.activo !== false);
  idiomas.value = languageData.filter((item) => item.activo !== false);
});

function loadMovieImage(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    movieForm.img = String(reader.result);
  };
  reader.readAsDataURL(file);
}

function normalize(value: string) {
  return value.trim().toLocaleLowerCase("es");
}

function findCatalogId<T extends { id: string | number; nombre: string }>(items: T[], value: string) {
  return items.find((item) => normalize(item.nombre) === normalize(value))?.id;
}

function buildSynopsis() {
  const details = [movieForm.director && `Director: ${movieForm.director}`, movieForm.rating && `Clasificación: ${movieForm.rating}`, movieForm.duration && `Duración: ${movieForm.duration}`].filter(Boolean);
  return details.length ? details.join(". ") : `Película ${movieForm.title}`;
}

async function saveMovie() {
  feedback.value = "";
  const genreId = findCatalogId(generos.value, movieForm.genre);
  const languageId = findCatalogId(idiomas.value, movieForm.language);

  if (!session.user?.id) {
    feedbackType.value = "error";
    feedback.value = "No se encontró el usuario autenticado para crear la película.";
    return;
  }
  if (!genreId || !languageId) {
    feedbackType.value = "error";
    feedback.value = "Selecciona un género e idioma existentes.";
    return;
  }

  isSaving.value = true;
  try {
    if (isEdit.value && movieForm.id) {
      await peliculasService.update(movieForm.id, {
        titulo: movieForm.title,
        sinopsis: buildSynopsis(),
        poster_url: movieForm.img,
        fecha_estreno: movieForm.releaseDate,
        id_genero: Number(genreId),
        id_idioma: Number(languageId),
        activo: movieForm.status !== "inactivo",
      });
      feedback.value = "Película actualizada correctamente.";
    } else {
      await peliculasService.create({
        titulo: movieForm.title,
        sinopsis: buildSynopsis(),
        poster_url: movieForm.img,
        genero: String(genreId),
        idioma: String(languageId),
        fecha_estreno: movieForm.releaseDate,
        uploaded_by: session.user.id,
      });
      feedback.value = "Película creada correctamente.";
    }
    feedbackType.value = "success";
    await catalog.loadFromAPI();
    router.push("/admin/peliculas");
  } catch (err) {
    feedbackType.value = "error";
    feedback.value = err instanceof Error ? err.message : "No se pudo guardar la película.";
  } finally {
    isSaving.value = false;
  }
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
.form-feedback { border-radius: 3px; padding: .75rem .875rem; font-size: .8125rem; margin: 0; }
.form-feedback.success { color: #4caf7d; background: rgba(76,175,125,.08); border: 1px solid rgba(76,175,125,.18); }
.form-feedback.error { color: #e8607a; background: rgba(200,16,46,.08); border: 1px solid rgba(200,16,46,.2); }
@media (max-width: 900px) {
  .section-header, .form-actions { align-items: stretch; flex-direction: column; }
  .form-grid { grid-template-columns: 1fr; }
  .wide { grid-column: auto; }
}
</style>

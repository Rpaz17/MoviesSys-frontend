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
          <label class="field wide">Título
            <input v-model="movieForm.title" class="input" required maxlength="200" />
          </label>
          <label class="field wide">Sinopsis
            <textarea v-model="movieForm.sinopsis" class="input textarea" rows="4" required></textarea>
          </label>
          <label class="field">Género
            <select v-model="movieForm.genreId" class="input">
              <option value="">Seleccionar</option>
              <option v-for="genre in generos" :key="genre.id" :value="String(genre.id)">{{ genre.nombre }}</option>
            </select>
          </label>
          <label class="field">Idioma
            <select v-model="movieForm.languageId" class="input">
              <option value="">Seleccionar</option>
              <option v-for="language in idiomas" :key="language.id" :value="String(language.id)">{{ language.nombre }}</option>
            </select>
          </label>
          <label class="field">Estreno
            <input v-model="movieForm.releaseDate" class="input" type="date" />
          </label>
          <label v-if="isEdit" class="field">
            <span class="checkbox-label">
              <input v-model="movieForm.activo" type="checkbox" />
              Película activa
            </span>
          </label>
          <label class="field wide">URL del póster
            <input v-model="movieForm.posterUrl" class="input" placeholder="https://..." required />
          </label>
        </div>
        <img v-if="movieForm.posterUrl" class="poster-preview" :src="movieForm.posterUrl" :alt="movieForm.title" />
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
import { peliculasService, type Genero, type Idioma } from "../../services/peliculas.service";

interface MovieFormState {
  title: string;
  sinopsis: string;
  genreId: string;
  languageId: string;
  releaseDate: string;
  posterUrl: string;
  activo: boolean;
}

const route = useRoute();
const router = useRouter();
const catalog = useCatalogStore();
const session = useSessionStore();

const isEdit = computed(() => !!route.params.id);
const isSaving = ref(false);
const feedback = ref("");
const feedbackType = ref<"success" | "error">("success");
const generos = ref<Genero[]>([]);
const idiomas = ref<Idioma[]>([]);

const defaultMovieForm: MovieFormState = {
  title: "",
  sinopsis: "",
  genreId: "",
  languageId: "",
  releaseDate: new Date().toISOString().slice(0, 10),
  posterUrl: "",
  activo: true,
};

const movieForm = reactive<MovieFormState>({ ...defaultMovieForm });

onMounted(async () => {
  const [genreData, languageData] = await Promise.all([
    peliculasService.getGeneros().catch(() => []),
    peliculasService.getIdiomas().catch(() => []),
  ]);
  generos.value = genreData.filter((item) => item.activo !== false);
  idiomas.value = languageData.filter((item) => item.activo !== false);

  if (isEdit.value) {
    await hydrateEditForm();
  }
});

async function hydrateEditForm() {
  if (catalog.movies.length === 0) {
    await catalog.loadFromAPI();
  }

  const existing = catalog.movieById(String(route.params.id));
  if (!existing) {
    feedbackType.value = "error";
    feedback.value = "No se encontró la película para editar.";
    return;
  }

  const genreId = generos.value.find((g) => g.nombre === existing.genre)?.id ?? "";
  const languageId = idiomas.value.find((g) => g.nombre === existing.language)?.id ?? "";

  Object.assign(movieForm, {
    title: existing.title,
    sinopsis: existing.sinopsis,
    genreId: String(genreId),
    languageId: String(languageId),
    releaseDate: existing.releaseDate ? existing.releaseDate.slice(0, 10) : "",
    posterUrl: existing.img,
    activo: existing.activo,
  });
}

async function saveMovie() {
  feedback.value = "";

  if (!session.user?.id) {
    feedbackType.value = "error";
    feedback.value = "No se encontró el usuario autenticado.";
    return;
  }

  const fechaISO = movieForm.releaseDate
    ? new Date(movieForm.releaseDate + "T00:00:00").toISOString()
    : undefined;

  isSaving.value = true;
  try {
    if (isEdit.value && route.params.id) {
      const movieId = String(route.params.id);
      await peliculasService.update(movieId, {
        titulo: movieForm.title,
        sinopsis: movieForm.sinopsis,
        poster_url: movieForm.posterUrl,
        fecha_estreno: fechaISO,
        id_idioma: movieForm.languageId ? Number(movieForm.languageId) : undefined,
        id_genero: movieForm.genreId ? Number(movieForm.genreId) : undefined,
        activo: movieForm.activo,
      });
      feedback.value = "Película actualizada correctamente.";
    } else {
      await peliculasService.create({
        titulo: movieForm.title,
        sinopsis: movieForm.sinopsis,
        poster_url: movieForm.posterUrl,
        idioma: movieForm.languageId || undefined,
        genero: movieForm.genreId || undefined,
        fecha_estreno: fechaISO,
        uploaded_by: session.user.id,
      });
      feedback.value = "Película creada correctamente.";
    }
    feedbackType.value = "success";
    await catalog.loadFromAPI();
    window.setTimeout(() => {
      router.push("/admin/peliculas");
    }, isEdit.value ? 1200 : 700);
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
.form-feedback { border-radius: 3px; padding: .75rem .875rem; font-size: .8125rem; margin: 0; }
.form-feedback.success { color: #4caf7d; background: rgba(76,175,125,.08); border: 1px solid rgba(76,175,125,.18); }
.form-feedback.error { color: #e8607a; background: rgba(200,16,46,.08); border: 1px solid rgba(200,16,46,.2); }
.textarea { resize: vertical; min-height: 80px; }
.checkbox-label { display: flex; align-items: center; gap: 8px; color: #f0ece4; font-size: .875rem; cursor: pointer; }
.checkbox-label input[type="checkbox"] { width: 16px; height: 16px; accent-color: #c8a96e; cursor: pointer; }
@media (max-width: 900px) {
  .section-header, .form-actions { align-items: stretch; flex-direction: column; }
  .form-grid { grid-template-columns: 1fr; }
  .wide { grid-column: auto; }
}
</style>

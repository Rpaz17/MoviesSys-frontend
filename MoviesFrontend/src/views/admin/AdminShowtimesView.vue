<template>
  <section class="page">
    <div class="page-inner">
      <div class="section-header">
        <div>
          <p class="eyebrow">Panel de administrador</p>
          <h1>Funciones</h1>
        </div>
        <div class="header-actions">
          <button class="ghost-button" type="button" @click="router.push('/admin')">
            <LayoutDashboard class="w-3.5 h-3.5" /> Dashboard
          </button>
        </div>
      </div>

      <div class="admin-split">
        <form class="card form-card" @submit.prevent="saveShowtime">
          <div class="form-grid">
            <label class="field">Pelicula<select v-model="showtimeForm.movieId" class="input" required><option v-for="movie in activeMovies" :key="movie.id" :value="movie.id">{{ movie.title }}</option></select></label>
            <label class="field">Cine<select v-model="showtimeForm.cinemaId" class="input" required><option v-for="cinema in activeCinemas" :key="cinema.id" :value="cinema.id">{{ cinema.name }}</option></select></label>
            <label class="field">Sala<select v-model="showtimeForm.roomId" class="input" required><option v-for="room in filteredRooms" :key="room.id" :value="room.id">{{ room.name }} · {{ room.type }}</option></select></label>
            <label class="field">Fecha<input v-model="showtimeForm.date" class="input" type="date" required /></label>
            <label class="field">Hora<input v-model="showtimeForm.time" class="input" type="time" required /></label>
          </div>
          <p v-if="saveError" class="error-msg">{{ saveError }}</p>
          <div class="form-actions">
            <button class="ghost-button" type="button" @click="resetShowtime">Limpiar</button>
            <button class="primary-button" type="submit" :disabled="isSaving">{{ isSaving ? 'Guardando...' : 'Agregar funcion' }}</button>
          </div>
        </form>
        <div class="stack">
          <div class="filters-bar">
            <select v-model="filterMovie" class="input">
              <option value="">Todas las peliculas</option>
              <option v-for="movie in activeMovies" :key="movie.id" :value="movie.id">{{ movie.title }}</option>
            </select>
            <select v-model="filterCinema" class="input">
              <option value="">Todos los cines</option>
              <option v-for="cinema in activeCinemas" :key="cinema.id" :value="cinema.id">{{ cinema.name }}</option>
            </select>
            <input v-model="filterDateFrom" class="input" type="date" placeholder="Desde" />
            <input v-model="filterDateTo" class="input" type="date" placeholder="Hasta" />
          </div>
          <article v-for="showtime in filteredShowtimes" :key="showtime.id" class="card list-row">
            <div>
              <h2>{{ movieFor(showtime.movieId)?.title }}</h2>
              <p>{{ cinemaFor(showtime.cinemaId)?.name }} · {{ roomFor(showtime.roomId)?.name }} · {{ showtime.date }} {{ showtime.time }}</p>
            </div>
            <div class="row-actions">
              <span class="pill" :class="'status-' + showtime.status">{{ showtime.status }}</span>
              <button class="ghost-button" type="button" @click="router.push('/admin/funciones/' + showtime.id + '/editar')">Editar</button>
              <button class="danger-button" type="button" @click="openCancelShowtime(showtime)">Cancelar</button>
            </div>
          </article>
        </div>
      </div>

      <CancelShowtimeModal
        v-if="cancelShowtimeTarget"
        :showtime="cancelShowtimeTarget"
        @close="cancelShowtimeTarget = null"
        @confirm="confirmCancelShowtime"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import { reactive, ref, computed, watch } from "vue";
import { useRouter } from "vue-router";
import { LayoutDashboard } from "lucide-vue-next";
import { useCatalogStore } from "../../stores/catalog";
import { useCatalogHelpers } from "../../composables/use-catalog-helpers";
import { funcionesService } from "../../services/funciones.service";
import CancelShowtimeModal from "../../components/CancelShowtimeModal.vue";
import type { Showtime } from "../../types";

const router = useRouter();
const catalog = useCatalogStore();
const { movieFor, cinemaFor, roomFor } = useCatalogHelpers();

const editingShowtimeId = ref("");
const cancelShowtimeTarget = ref<Showtime | null>(null);
const isSaving = ref(false);
const saveError = ref("");

const filterMovie = ref("");
const filterCinema = ref("");
const filterDateFrom = ref("");
const filterDateTo = ref("");

const showtimeForm = reactive({
  movieId: "",
  cinemaId: "",
  roomId: "",
  date: new Date().toISOString().slice(0, 10),
  time: "18:00",
});

const activeMovies = computed(() => catalog.movies.filter((item) => item.activo));
const activeCinemas = computed(() => catalog.cinemas.filter((item) => item.status === "activo"));
const filteredRooms = computed(() => catalog.rooms.filter((room) => room.cinemaId === showtimeForm.cinemaId && room.status === "activo"));

const filteredShowtimes = computed(() =>
  catalog.showtimes.filter((s) =>
    (!filterMovie.value || s.movieId === filterMovie.value) &&
    (!filterCinema.value || s.cinemaId === filterCinema.value) &&
    (!filterDateFrom.value || s.date >= filterDateFrom.value) &&
    (!filterDateTo.value || s.date <= filterDateTo.value)
  ),
);

watch(() => showtimeForm.cinemaId, () => {
  if (!filteredRooms.value.some((room) => room.id === showtimeForm.roomId)) showtimeForm.roomId = filteredRooms.value[0]?.id ?? "";
});

function resetShowtime() {
  editingShowtimeId.value = "";
  showtimeForm.movieId = activeMovies.value[0]?.id ?? "";
  showtimeForm.cinemaId = activeCinemas.value[0]?.id ?? "";
  showtimeForm.roomId = filteredRooms.value[0]?.id ?? "";
  showtimeForm.date = new Date().toISOString().slice(0, 10);
  showtimeForm.time = "18:00";
  saveError.value = "";
}

async function saveShowtime() {
  if (!showtimeForm.movieId || !showtimeForm.roomId || !showtimeForm.date || !showtimeForm.time) return;
  isSaving.value = true;
  saveError.value = "";
  try {
    await funcionesService.create({
      id_pelicula: showtimeForm.movieId,
      id_sala: showtimeForm.roomId,
      fecha_hora: `${showtimeForm.date}T${showtimeForm.time}:00`,
    });
    await catalog.loadAllShowtimes();
    resetShowtime();
  } catch {
    saveError.value = "Error al crear la funcion. Verifica que no haya solapamiento de horario en la misma sala.";
  }
  isSaving.value = false;
}

function openCancelShowtime(showtime: Showtime) {
  cancelShowtimeTarget.value = showtime;
}

async function confirmCancelShowtime() {
  if (!cancelShowtimeTarget.value) return;
  try {
    await funcionesService.cancel(cancelShowtimeTarget.value.id);
    await catalog.loadAllShowtimes();
  } catch {
    // silently fail
  }
  cancelShowtimeTarget.value = null;
}

resetShowtime();
</script>

<style scoped>
.section-header { display: flex; justify-content: space-between; gap: 14px; align-items: flex-end; margin-bottom: 20px; }
.eyebrow { color: #c8a96e; font-family: "DM Mono", monospace; text-transform: uppercase; font-size: 11px; letter-spacing: .09em; margin: 0 0 4px; }
h1 { font-size: clamp(20px, 2.5vw, 30px); font-weight: 600; color: #f0ece4; margin: 0; font-family: 'Playfair Display', serif; letter-spacing: -0.01em; }
h2 { font-size: .9375rem; font-weight: 600; color: #f0ece4; margin: 0; }
p, span { color: #7a7590; font-size: .875rem; margin: 0; }
.header-actions { display: flex; flex-wrap: wrap; gap: 8px; }
.form-card { padding: 1.5rem; display: grid; gap: 1.125rem; }
.form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
.field { display: grid; gap: 6px; color: #c8a96e; font-size: .8125rem; font-weight: 500; }
.form-actions { display: flex; justify-content: space-between; align-items: center; gap: 10px; }
.admin-split { display: grid; grid-template-columns: minmax(300px, 440px) 1fr; gap: 16px; align-items: start; }
.stack { display: grid; gap: 10px; }
.filters-bar { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 8px; }
.list-row { display: flex; justify-content: space-between; align-items: center; gap: 10px; padding: 1rem 1.125rem; }
.row-actions { display: flex; gap: 7px; align-items: center; }
.danger-button { border-radius: 3px; padding: .375rem .8125rem; font-size: .8125rem; font-weight: 500; color: #ffd8df; border: 1px solid rgba(232,96,122,.3); background: rgba(232,96,122,.08); transition: background .12s; cursor: pointer; }
.danger-button:hover { background: rgba(232,96,122,.15); }
.error-msg { color: #e8607a; font-size: .75rem; margin: 0; }
.status-activo { background: rgba(76,175,125,0.08); border-color: rgba(76,175,125,0.2); color: #4caf7d; }
.status-mantenimiento { background: rgba(200,169,110,.08); border-color: rgba(200,169,110,.24); color: #c8a96e; }
.status-inactivo { background: rgba(122,117,144,0.08); border-color: rgba(122,117,144,0.2); color: #7a7590; }
@media (max-width: 900px) {
  .section-header, .list-row, .form-actions { align-items: stretch; flex-direction: column; }
  .admin-split, .form-grid { grid-template-columns: 1fr; }
}
</style>

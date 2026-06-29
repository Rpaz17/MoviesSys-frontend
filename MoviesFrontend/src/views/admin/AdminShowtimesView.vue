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
          <p v-if="errorMessage" class="error-text">{{ errorMessage }}</p>
          <div class="form-grid">
            <label class="field">Película<select v-model="showtimeForm.movieId" class="input" required>
                <option v-for="movie in activeMovies" :key="movie.id" :value="movie.id">{{ movie.title }}</option>
              </select></label>
            <label class="field">Cine<select v-model="showtimeForm.cinemaId" class="input" required>
                <option v-for="cinema in activeCinemas" :key="cinema.id" :value="cinema.id">{{ cinema.name }}</option>
              </select></label>
            <label class="field">Sala<select v-model="showtimeForm.roomId" class="input" required>
                <option v-for="room in filteredRooms" :key="room.id" :value="room.id">{{ room.name }} · {{ room.type }}
                </option>
              </select></label>
            <label class="field">Fecha<input v-model="showtimeForm.date" class="input" type="date" required /></label>
            <label class="field">Hora<input v-model="showtimeForm.time" class="input" type="time" required /></label>
            <div class="field schedule-summary">
              <span>Fin estimado</span>
              <strong>{{ estimatedEndTime || "Selecciona película y hora" }}</strong>
              <small>Incluye {{ CLEANING_MINUTES }} minutos de limpieza.</small>
            </div>
            <label class="field">Formato<select v-model="showtimeForm.format" class="input">
                <option>2D</option>
                <option>3D</option>
                <option>IMAX</option>
                <option>VIP</option>
              </select></label>
          </div>
          <div class="form-actions">
            <button class="ghost-button" type="button" @click="resetShowtime">Limpiar</button>
            <button class="primary-button" type="submit" :disabled="saving">
              {{ saving ? "Guardando..." : editingShowtimeId ? "Actualizar" : "Agregar función" }}
            </button>
          </div>
        </form>
        <div class="stack">
          <article v-for="showtime in catalog.showtimes" :key="showtime.id" class="card list-row">
            <div>
              <h2>{{ movieFor(showtime.movieId)?.title }}</h2>
              <p>{{ cinemaFor(showtime.cinemaId)?.name }} · {{ roomFor(showtime.roomId)?.name }} · {{ showtime.date }}
                {{ showtime.time }}</p>
            </div>
            <div class="row-actions">
              <span class="pill" :class="'status-' + showtime.status">{{ showtime.status }}</span>
              <button class="ghost-button" type="button"
                @click="router.push('/admin/funciones/' + showtime.id + '/editar')">Editar</button>
              <button class="danger-button" type="button" @click="openCancelShowtime(showtime)">Cancelar</button>
            </div>
          </article>
        </div>
      </div>

      <CancelShowtimeModal v-if="cancelShowtimeTarget" :showtime="cancelShowtimeTarget"
        @close="cancelShowtimeTarget = null" @confirm="confirmCancelShowtime" />
    </div>
  </section>
</template>

<script setup lang="ts">
import { reactive, ref, computed, watch, onMounted } from "vue";
import { useRouter } from "vue-router";
import { LayoutDashboard } from "lucide-vue-next";
import { useCatalogStore } from "../../stores/catalog";
import { useCatalogHelpers } from "../../composables/use-catalog-helpers";
import { funcionesService } from "../../services/funciones.service";
import CancelShowtimeModal from "../../components/CancelShowtimeModal.vue";
import type { Showtime, AdminStatus } from "../../types";

const router = useRouter();
const catalog = useCatalogStore();
const { movieFor, cinemaFor, roomFor } = useCatalogHelpers();

const editingShowtimeId = ref("");
const cancelShowtimeTarget = ref<Showtime | null>(null);
const saving = ref(false);
const errorMessage = ref("");
const CLEANING_MINUTES = 15;

const showtimeForm = reactive<Omit<Showtime, "id" | "reservations" | "revenue" | "status"> & { editingStatus?: AdminStatus }>({
  movieId: "",
  cinemaId: "",
  roomId: "",
  date: new Date().toISOString().slice(0, 10),
  time: "18:00",
  format: "2D",
});

const activeMovies = computed(() => catalog.movies.filter((item) => item.activo));
const activeCinemas = computed(() => catalog.cinemas.filter((item) => item.status === "activo"));
const filteredRooms = computed(() => catalog.rooms.filter((room) => room.cinemaId === showtimeForm.cinemaId && room.status === "activo"));
const selectedMovie = computed(() => catalog.movieById(showtimeForm.movieId));

function durationToMinutes(value = "") {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  return match ? Number(match[1]) * 60 + Number(match[2]) : 0;
}

function dateTimeInMinutes(date: string, time: string) {
  return new Date(`${date}T${time}:00`).getTime() / 60000;
}

const estimatedEndTime = computed(() => {
  const duration = durationToMinutes(selectedMovie.value?.duration);
  if (!showtimeForm.time || !duration) return "";
  const [hours, minutes] = showtimeForm.time.split(":").map(Number);
  const end = hours * 60 + minutes + duration + CLEANING_MINUTES;
  return `${String(Math.floor(end / 60) % 24).padStart(2, "0")}:${String(end % 60).padStart(2, "0")}`;
});

function hasScheduleConflict() {
  const duration = durationToMinutes(selectedMovie.value?.duration);
  if (!duration) return false;
  const start = dateTimeInMinutes(showtimeForm.date, showtimeForm.time);
  const end = start + duration + CLEANING_MINUTES;
  return catalog.showtimes.some((item) => {
    if (item.id === editingShowtimeId.value || item.roomId !== showtimeForm.roomId || item.status !== "activo") return false;
    const otherDuration = durationToMinutes(catalog.movieById(item.movieId)?.duration);
    const otherStart = dateTimeInMinutes(item.date, item.time);
    const otherEnd = otherStart + otherDuration + CLEANING_MINUTES;
    return start < otherEnd && end > otherStart;
  });
}

watch(() => showtimeForm.cinemaId, () => {
  if (!filteredRooms.value.some((room) => room.id === showtimeForm.roomId)) showtimeForm.roomId = filteredRooms.value[0]?.id ?? "";
});

function resetShowtime() {
  editingShowtimeId.value = "";
  errorMessage.value = "";
  showtimeForm.movieId = activeMovies.value[0]?.id ?? "";
  showtimeForm.cinemaId = activeCinemas.value[0]?.id ?? "";
  showtimeForm.roomId = filteredRooms.value[0]?.id ?? "";
  showtimeForm.date = new Date().toISOString().slice(0, 10);
  showtimeForm.time = "18:00";
  showtimeForm.format = "2D";
}

async function saveShowtime() {
  errorMessage.value = "";

  if (!showtimeForm.movieId || !showtimeForm.cinemaId || !showtimeForm.roomId || !showtimeForm.date || !showtimeForm.time) {
    errorMessage.value = "Completa todos los campos requeridos.";
    return;
  }
  if (hasScheduleConflict()) {
    errorMessage.value = `El horario se cruza con otra función, incluyendo ${CLEANING_MINUTES} minutos de limpieza.`;
    return;
  }

  saving.value = true;
  const fechaHora = `${showtimeForm.date}T${showtimeForm.time}:00Z`;

  try {
    if (editingShowtimeId.value) {
      await funcionesService.edit(editingShowtimeId.value, {
        id_pelicula: showtimeForm.movieId,
        id_sala: showtimeForm.roomId,
        fecha_hora: fechaHora,
      });
    } else {
      await funcionesService.create({
        id_pelicula: showtimeForm.movieId,
        id_sala: showtimeForm.roomId,
        fecha_hora: fechaHora,
      });
    }
    await catalog.loadAllShowtimes();
    resetShowtime();
  } catch (err) {
    const apiErr = err as { status?: number; message?: string };
    if (apiErr.status === 409) {
      errorMessage.value = apiErr.message ?? "Ya existe una función que se solapa con ese horario en esta sala.";
    } else if (apiErr.status === 404) {
      errorMessage.value = "Película o sala no encontrada.";
    } else {
      errorMessage.value = "No se pudo guardar la función. Intenta de nuevo.";
    }
  } finally {
    saving.value = false;
  }
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
    errorMessage.value = "No se pudo cancelar la función.";
  } finally {
    cancelShowtimeTarget.value = null;
  }
}

onMounted(async () => {
  if (catalog.movies.length === 0 || catalog.cinemas.length === 0) {
    await catalog.loadFromAPI();
  }
  await catalog.loadAllShowtimes();
  resetShowtime();
});
</script>

<style scoped>
.section-header {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  align-items: flex-end;
  margin-bottom: 20px;
}

.eyebrow {
  color: #c8a96e;
  font-family: "DM Mono", monospace;
  text-transform: uppercase;
  font-size: 11px;
  letter-spacing: .09em;
  margin: 0 0 4px;
}

h1 {
  font-size: clamp(20px, 2.5vw, 30px);
  font-weight: 600;
  color: #f0ece4;
  margin: 0;
  font-family: 'Playfair Display', serif;
  letter-spacing: -0.01em;
}

h2 {
  font-size: .9375rem;
  font-weight: 600;
  color: #f0ece4;
  margin: 0;
}

p,
span {
  color: #7a7590;
  font-size: .875rem;
  margin: 0;
}

.header-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.form-card {
  padding: 1.5rem;
  display: grid;
  gap: 1.125rem;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.field {
  display: grid;
  gap: 6px;
  color: #c8a96e;
  font-size: .8125rem;
  font-weight: 500;
}
.schedule-summary strong { color: #f0ece4; }
.schedule-summary small { color: #7a7590; }

.form-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}

.admin-split {
  display: grid;
  grid-template-columns: minmax(300px, 440px) 1fr;
  gap: 16px;
  align-items: start;
}

.stack {
  display: grid;
  gap: 10px;
}

.list-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  padding: 1rem 1.125rem;
}

.row-actions {
  display: flex;
  gap: 7px;
  align-items: center;
}

.danger-button {
  border-radius: 3px;
  padding: .375rem .8125rem;
  font-size: .8125rem;
  font-weight: 500;
  color: #ffd8df;
  border: 1px solid rgba(232, 96, 122, .3);
  background: rgba(232, 96, 122, .08);
  transition: background .12s;
  cursor: pointer;
}

.danger-button:hover {
  background: rgba(232, 96, 122, .15);
}

.status-activo {
  background: rgba(76, 175, 125, 0.08);
  border-color: rgba(76, 175, 125, 0.2);
  color: #4caf7d;
}

.status-mantenimiento {
  background: rgba(200, 169, 110, .08);
  border-color: rgba(200, 169, 110, .24);
  color: #c8a96e;
}

.status-inactivo {
  background: rgba(122, 117, 144, 0.08);
  border-color: rgba(122, 117, 144, 0.2);
  color: #7a7590;
}

.error-text {
  color: #e57373;
  font-size: 13px;
  margin: 0;
}

@media (max-width: 900px) {

  .section-header,
  .list-row,
  .form-actions {
    align-items: stretch;
    flex-direction: column;
  }

  .admin-split,
  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>

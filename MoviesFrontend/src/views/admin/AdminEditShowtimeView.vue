<template>
  <section class="page">
    <div class="page-inner">
      <div class="section-header">
        <div>
          <p class="eyebrow">Panel de administrador</p>
          <h1>Editar funcion</h1>
        </div>
        <div class="header-actions">
          <button class="ghost-button" type="button" @click="router.push('/admin')">
            <LayoutDashboard class="w-3.5 h-3.5" /> Dashboard
          </button>
        </div>
      </div>

      <form class="card form-card" @submit.prevent="saveEditedShowtime">
        <div class="form-grid">
          <label class="field">Pelicula<select v-model="showtimeForm.movieId" class="input" required><option v-for="movie in activeMovies" :key="movie.id" :value="movie.id">{{ movie.title }}</option></select></label>
          <label class="field">Cine<select v-model="showtimeForm.cinemaId" class="input" required><option v-for="cinema in activeCinemas" :key="cinema.id" :value="cinema.id">{{ cinema.name }}</option></select></label>
          <label class="field">Sala<select v-model="showtimeForm.roomId" class="input" required><option v-for="room in filteredRooms" :key="room.id" :value="room.id">{{ room.name }} · {{ room.type }}</option></select></label>
          <label class="field">Fecha<input v-model="showtimeForm.date" class="input" type="date" required /></label>
          <label class="field">Hora<input v-model="showtimeForm.time" class="input" type="time" required /></label>
        </div>
        <p v-if="saveError" class="error-msg">{{ saveError }}</p>
        <div class="form-actions">
          <button class="ghost-button" type="button" @click="router.push('/admin/funciones')">Volver a funciones</button>
          <button class="primary-button" type="submit" :disabled="isSaving">{{ isSaving ? 'Guardando...' : 'Guardar cambios' }}</button>
        </div>
      </form>
    </div>
  </section>
</template>

<script setup lang="ts">
import { reactive, computed, watch, ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { LayoutDashboard } from "lucide-vue-next";
import { useCatalogStore } from "../../stores/catalog";
import { funcionesService } from "../../services/funciones.service";
import type { Showtime } from "../../types";

const route = useRoute();
const router = useRouter();
const catalog = useCatalogStore();

const id = String(route.params.id);
const isSaving = ref(false);
const saveError = ref("");

const showtimeForm = reactive({
  movieId: "",
  cinemaId: "",
  roomId: "",
  date: "",
  time: "",
});

const activeMovies = computed(() => catalog.movies.filter((item) => item.activo));
const activeCinemas = computed(() => catalog.cinemas.filter((item) => item.status === "activo"));
const filteredRooms = computed(() => catalog.rooms.filter((room) => room.cinemaId === showtimeForm.cinemaId && room.status === "activo"));

watch(() => showtimeForm.cinemaId, () => {
  if (!filteredRooms.value.some((room) => room.id === showtimeForm.roomId)) showtimeForm.roomId = filteredRooms.value[0]?.id ?? "";
});

function loadEditShowtime() {
  const showtime = catalog.showtimes.find((item) => item.id === id);
  if (!showtime) return;
  showtimeForm.movieId = showtime.movieId;
  showtimeForm.cinemaId = showtime.cinemaId;
  showtimeForm.roomId = showtime.roomId;
  showtimeForm.date = showtime.date;
  showtimeForm.time = showtime.time;
}

async function saveEditedShowtime() {
  isSaving.value = true;
  saveError.value = "";
  try {
    await funcionesService.edit(id, {
      id_pelicula: showtimeForm.movieId,
      id_sala: showtimeForm.roomId,
      fecha_hora: `${showtimeForm.date}T${showtimeForm.time}:00`,
    });
    await catalog.loadAllShowtimes();
    router.push("/admin/funciones");
  } catch {
    saveError.value = "Error al guardar los cambios. Verifica que no haya solapamiento de horario.";
  }
  isSaving.value = false;
}

onMounted(() => {
  loadEditShowtime();
});
</script>

<style scoped>
.section-header { display: flex; justify-content: space-between; gap: 14px; align-items: flex-end; margin-bottom: 20px; }
.eyebrow { color: #c8a96e; font-family: "DM Mono", monospace; text-transform: uppercase; font-size: 11px; letter-spacing: .09em; margin: 0 0 4px; }
h1 { font-size: clamp(20px, 2.5vw, 30px); font-weight: 600; color: #f0ece4; margin: 0; font-family: 'Playfair Display', serif; letter-spacing: -0.01em; }
.header-actions { display: flex; flex-wrap: wrap; gap: 8px; }
.form-card { padding: 1.5rem; display: grid; gap: 1.125rem; }
.form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
.field { display: grid; gap: 6px; color: #c8a96e; font-size: .8125rem; font-weight: 500; }
.form-actions { display: flex; justify-content: space-between; align-items: center; gap: 10px; }
.error-msg { color: #e8607a; font-size: .75rem; margin: 0; }
@media (max-width: 900px) {
  .section-header, .form-actions { align-items: stretch; flex-direction: column; }
  .form-grid { grid-template-columns: 1fr; }
}
</style>

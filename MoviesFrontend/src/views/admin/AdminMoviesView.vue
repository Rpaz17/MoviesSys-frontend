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
          <button class="primary-button" type="button" @click="router.push('/admin/peliculas/crear')">
            Nueva película
          </button>
        </div>
      </div>

      <div class="grid-list">
        <article v-for="movie in catalog.movies" :key="movie.id" class="card catalog-card"
          :class="{ 'is-inactive': !movie.activo }">
          <img :src="imageUrl(movie.img)" :alt="movie.title" />
          <div class="card-body">
            <span class="pill" :class="{ 'blocked-pill': !movie.activo }">
              {{ movie.activo ? "En cartelera" : "Inactiva" }}
            </span>
            <h2>{{ movie.title }}</h2>
            <p>{{ movie.genre }} · {{ movie.language }} · {{ movie.duration }}</p>
            <p>{{ movie.director }}</p>
            <p>Cines disponibles: {{ cinemasForMovie(movie.id).join(", ") || "Sin funciones activas" }}</p>
            <div class="row-between">
              <span>{{ reservationCountForMovie(movie.id) }} reservas</span>
              <div class="row-actions">
                <button class="ghost-button" :class="{ 'reactivate-button': !movie.activo }" type="button"
                  :disabled="changingMovieId === movie.id"
                  @click="openStatusModal(movie.id, movie.title, movie.activo)">
                  {{ changingMovieId === movie.id
                    ? "Procesando..."
                    : movie.activo ? "Desactivar" : "Reactivar" }}
                </button>
                <button v-if="movie.activo" class="ghost-button" type="button"
                  @click="router.push('/admin/peliculas/' + movie.id + '/editar')">
                  Editar
                </button>
              </div>
            </div>
          </div>
        </article>
      </div>
    </div>
  </section>

  <Teleport to="body">
    <div v-if="statusAction" class="modal-backdrop" @click.self="closeStatusModal">
      <section class="status-modal" role="dialog" aria-modal="true" aria-labelledby="movie-status-title">
        <button class="modal-close" type="button" aria-label="Cerrar" :disabled="Boolean(changingMovieId)"
          @click="closeStatusModal">
          <X class="w-4 h-4" />
        </button>

        <div class="modal-icon" :class="statusAction.currentlyActive ? 'danger-icon' : 'success-icon'">
          <AlertTriangle v-if="statusAction.currentlyActive" class="w-6 h-6" />
          <Film v-else class="w-6 h-6" />
        </div>
        <p class="modal-eyebrow">
          {{ statusAction.currentlyActive ? "Confirmar desactivación" : "Confirmar reactivación" }}
        </p>
        <h2 id="movie-status-title">
          {{ statusAction.currentlyActive ? "¿Desactivar esta película?" : "¿Reactivar esta película?" }}
        </h2>
        <p class="modal-description">
          <strong>{{ statusAction.title }}</strong>
          {{ statusAction.currentlyActive
            ? " dejará de aparecer como disponible para nuevas funciones."
            : " volverá a estar disponible en el sistema." }}
        </p>

        <div v-if="statusAction.currentlyActive" class="warning-box">
          Las funciones y reservaciones existentes no se eliminarán. Solamente cambiará la disponibilidad de la
          película.
        </div>

        <div class="modal-actions">
          <button class="ghost-button" type="button" :disabled="Boolean(changingMovieId)"
            @click="closeStatusModal">
            Cancelar
          </button>
          <button class="primary-button" :class="{ 'danger-confirm': statusAction.currentlyActive }" type="button"
            :disabled="Boolean(changingMovieId)" @click="confirmStatusChange">
            {{ changingMovieId
              ? "Procesando..."
              : statusAction.currentlyActive ? "Sí, desactivar" : "Sí, reactivar" }}
          </button>
        </div>
      </section>
    </div>
  </Teleport>

  <Teleport to="body">
    <div v-if="feedback" class="modal-backdrop" @click.self="feedback = null">
      <section class="status-modal feedback-modal" role="alertdialog" aria-modal="true"
        aria-labelledby="movie-feedback-title">
        <button class="modal-close" type="button" aria-label="Cerrar" @click="feedback = null">
          <X class="w-4 h-4" />
        </button>

        <div class="modal-icon" :class="feedback.type === 'success' ? 'success-icon' : 'danger-icon'">
          <CircleCheck v-if="feedback.type === 'success'" class="w-6 h-6" />
          <CircleAlert v-else class="w-6 h-6" />
        </div>
        <p class="modal-eyebrow">{{ feedback.type === "success" ? "Operación completada" : "Ocurrió un error" }}</p>
        <h2 id="movie-feedback-title">{{ feedback.title }}</h2>
        <p class="modal-description">{{ feedback.message }}</p>

        <div class="modal-actions">
          <button class="primary-button" type="button" @click="feedback = null">
            Entendido
          </button>
        </div>
      </section>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref,onMounted } from "vue";
import { useRouter } from "vue-router";
import { AlertTriangle, CircleAlert, CircleCheck, Film, LayoutDashboard, X } from "lucide-vue-next";
import { useCatalogStore } from "../../stores/catalog";
import { useFormat } from "../../composables/use-format";
import { useCatalogHelpers } from "../../composables/use-catalog-helpers";
import { reportesService, type ReporteReserva } from "../../services/reportes.service";



const router = useRouter();
const catalog = useCatalogStore();
const { imageUrl } = useFormat();
const { cinemaFor } = useCatalogHelpers();

const changingMovieId = ref("");
const reservationCounts = ref<Record<string, number>>({});
const statusAction = ref<{
  id: string;
  title: string;
  currentlyActive: boolean;
} | null>(null);
const feedback = ref<{
  type: "success" | "error";
  title: string;
  message: string;
} | null>(null);

onMounted(async () => {
  try {
    await Promise.all([
      catalog.loadAllMovies(),
      loadReservationCounts(),
    ]);
  } catch (error) {
    const apiError = error as { data?: { message?: string } };
    feedback.value = {
      type: "error",
      title: "No se pudieron cargar todos los datos",
      message: apiError.data?.message
        ?? "No fue posible cargar las películas o sus reservas.",
    };
  }
});

async function loadReservationCounts() {
  const firstPage = await reportesService.getReservas({
    pagina: 1,
    limite: 100,
  });
  const reservations: ReporteReserva[] = [...firstPage.data];

  for (let page = 2; page <= firstPage.total_paginas; page++) {
    const response = await reportesService.getReservas({
      pagina: page,
      limite: 100,
    });
    reservations.push(...response.data);
  }

  reservationCounts.value = reservations.reduce<Record<string, number>>(
    (counts, reservation) => {
      if (reservation.estado.toLowerCase() === "cancelada") return counts;

      const movieId = String(reservation.funcion.pelicula.id);
      counts[movieId] = (counts[movieId] ?? 0) + 1;
      return counts;
    },
    {},
  );
}

function reservationCountForMovie(movieId: string): number {
  return reservationCounts.value[movieId] ?? 0;
}

function cinemasForMovie(movieId: string) {
  const movie = catalog.movieById(movieId);
  if (!movie?.activo) return [];

  const cinemaNames = catalog.showtimes
    .filter((showtime) => showtime.movieId === movieId && showtime.status === "activo")
    .map((showtime) => cinemaFor(showtime.cinemaId)?.name)
    .filter(Boolean) as string[];
  return [...new Set(cinemaNames)];
}

function openStatusModal(id: string, title: string, currentlyActive: boolean) {
  statusAction.value = { id, title, currentlyActive };
}

function closeStatusModal() {
  if (!changingMovieId.value) statusAction.value = null;
}

async function confirmStatusChange() {
  if (!statusAction.value) return;

  const action = statusAction.value;
  changingMovieId.value = action.id;

  try {
    await catalog.toggleMovieStatus(action.id);
    statusAction.value = null;
    feedback.value = {
      type: "success",
      title: action.currentlyActive ? "Película desactivada" : "Película reactivada",
      message: `El estado de “${action.title}” se actualizó correctamente.`,
    };
  } catch (error) {
    const apiError = error as { data?: { message?: string } };
    statusAction.value = null;
    feedback.value = {
      type: "error",
      title: "No se pudo cambiar el estado",
      message: apiError.data?.message
        ?? `No se pudo ${action.currentlyActive ? "desactivar" : "reactivar"} la película. Intenta nuevamente.`,
    };
  } finally {
    changingMovieId.value = "";
  }
}
</script>

<style scoped>
.section-header { display: flex; justify-content: space-between; gap: 14px; align-items: flex-end; margin-bottom: 20px; }
.eyebrow { color: #c8a96e; font-family: "DM Mono", monospace; text-transform: uppercase; font-size: 11px; letter-spacing: .09em; margin: 0 0 4px; }
h1 { font-size: clamp(20px, 2.5vw, 30px); font-weight: 600; color: #f0ece4; margin: 0; font-family: "Playfair Display", serif; letter-spacing: -0.01em; }
h2 { font-size: .9375rem; font-weight: 600; color: #f0ece4; margin: 0; }
p, span { color: #7a7590; font-size: .875rem; margin: 0; }
.header-actions { display: flex; flex-wrap: wrap; gap: 8px; }
.grid-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(290px, 1fr)); gap: 20px; }
.catalog-card { min-height: 460px; overflow: hidden; padding: 0; display: flex; flex-direction: column; transition: transform .15s, border-color .15s; }
.catalog-card:hover { transform: translateY(-2px); border-color: rgba(200, 169, 110, .22); }
.catalog-card img { width: 100%; height: 230px; object-fit: contain; background: #0d0d15; }
.card-body { flex: 1; padding: 1.25rem; display: flex; flex-direction: column; gap: 12px; }
.row-between { display: flex; justify-content: space-between; align-items: center; gap: 10px; margin-top: auto; }
.row-actions { display: flex; gap: 7px; }
.is-inactive img { filter: grayscale(1); opacity: .45; }
.is-inactive .card-body { opacity: .65; }
.is-inactive .row-actions { opacity: 1; }
.is-inactive { border-color: rgba(148, 163, 184, .18); background: rgba(30, 32, 42, .78); }
.blocked-pill { border-color: rgba(148, 163, 184, .3); background: rgba(148, 163, 184, .1); color: #a7adba; }
.reactivate-button { border-color: rgba(74, 222, 128, .4); background: rgba(74, 222, 128, .13); color: #78e49e; }
.reactivate-button:hover:not(:disabled) { border-color: rgba(74, 222, 128, .7); background: rgba(74, 222, 128, .2); color: #a1f0bc; }
.modal-backdrop { position: fixed; inset: 0; z-index: 1000; display: grid; place-items: center; padding: 20px; background: rgba(4, 6, 12, .78); backdrop-filter: blur(7px); }
.status-modal { position: relative; width: min(100%, 460px); padding: 28px; border: 1px solid rgba(200, 169, 110, .25); border-radius: 18px; background: linear-gradient(145deg, #171725, #101019); box-shadow: 0 28px 80px rgba(0, 0, 0, .55); animation: modal-in .18s ease-out; }
.modal-close { position: absolute; top: 14px; right: 14px; display: grid; place-items: center; width: 32px; height: 32px; border: 1px solid rgba(255, 255, 255, .08); border-radius: 9px; background: rgba(255, 255, 255, .04); color: #8a8797; cursor: pointer; }
.modal-icon { display: grid; place-items: center; width: 48px; height: 48px; margin-bottom: 18px; border-radius: 14px; }
.danger-icon { background: rgba(239, 100, 100, .13); color: #ef7777; }
.success-icon { background: rgba(74, 222, 128, .12); color: #6fdc96; }
.modal-eyebrow { margin-bottom: 6px; color: #c8a96e; font-family: "DM Mono", monospace; font-size: 10px; letter-spacing: .1em; text-transform: uppercase; }
.status-modal h2 { margin-bottom: 10px; color: #f0ece4; font-family: "Playfair Display", serif; font-size: 24px; }
.modal-description { color: #aaa6b5; line-height: 1.55; }
.modal-description strong { color: #f0ece4; }
.warning-box { margin-top: 18px; padding: 12px; border-left: 3px solid #c8a96e; border-radius: 0 8px 8px 0; background: rgba(200, 169, 110, .07); color: #b9b2a2; font-size: 12px; line-height: 1.5; }
.modal-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 24px; }
.danger-confirm { border-color: #b94b4b; background: #a84242; color: #fff; }
.feedback-modal .modal-actions { justify-content: flex-end; }
@keyframes modal-in { from { opacity: 0; transform: translateY(8px) scale(.98); } }
@media (max-width: 900px) { .section-header { align-items: stretch; flex-direction: column; } }
@media (max-width: 600px) { .status-modal { padding: 24px 20px; } .modal-actions { flex-direction: column-reverse; } }
</style>

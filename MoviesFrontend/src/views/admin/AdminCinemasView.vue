<template>
  <section class="page">
    <div class="page-inner">
      <div class="section-header">
        <div>
          <p class="eyebrow">Panel de administrador</p>
          <h1>Cines</h1>
        </div>
        <div class="header-actions">
          <button class="ghost-button" type="button" @click="router.push('/admin')">
            <LayoutDashboard class="w-3.5 h-3.5" /> Dashboard
          </button>
          <button class="primary-button" type="button" @click="router.push('/admin/cines/crear')">Nuevo cine</button>
        </div>
      </div>
      <div class="search-wrapper">
        <Search class="search-icon w-4 h-4" />
        <input v-model.trim="searchQuery" class="input search-input" type="search" placeholder="Buscar cine..." />
      </div>
      <p v-if="errorMessage" class="error-text">{{ errorMessage }}</p>
      <div class="grid-list">
        <article v-for="cinema in filteredCinemas" :key="cinema.id" class="card catalog-card"
          :class="{ 'is-inactive': cinema.status !== 'activo' }">
          <div class="card-body">
            <span class="pill">{{ cinema.status }}</span>
            <h2>{{ cinema.name }}</h2>
            <p>{{ cinema.city }} · {{ cinema.address }}</p>
            <p>{{ cinema.rooms }} salas · {{ cinema.functions }} funciones</p>
            <p>Ingresos: {{ cinema.revenue }}</p>
            <div class="card-actions">
              <button v-if="cinema.status === 'activo'" class="ghost-button" type="button"
                @click="router.push('/admin/cines/' + cinema.id + '/editar')">
                Editar
              </button>
              <button class="ghost-button toggle-button" type="button"
                @click="toggleStatus(cinema.id, cinema.status === 'activo')">
                {{ cinema.status === "activo" ? "Desactivar" : "Reactivar" }}
              </button>
            </div>
          </div>
        </article>
      </div>
    </div>
  </section>

  <Teleport to="body">
    <div v-if="statusAction" class="modal-backdrop" @click.self="closeStatusModal">
      <section class="status-modal" role="dialog" aria-modal="true" aria-labelledby="status-modal-title">
        <button class="modal-close" type="button" aria-label="Cerrar" :disabled="changingStatus"
          @click="closeStatusModal">
          <X class="w-4 h-4" />
        </button>

        <div class="modal-icon" :class="statusAction.currentlyActive ? 'warning-icon' : 'success-icon'">
          <AlertTriangle v-if="statusAction.currentlyActive" class="w-6 h-6" />
          <Power v-else class="w-6 h-6" />
        </div>

        <p class="modal-eyebrow">
          {{ statusAction.currentlyActive ? "Confirmar desactivación" : "Confirmar reactivación" }}
        </p>
        <h2 id="status-modal-title">
          {{ statusAction.currentlyActive ? "¿Desactivar este cine?" : "¿Reactivar este cine?" }}
        </h2>
        <p class="modal-description">
          <strong>{{ statusAction.name }}</strong>
          {{ statusAction.currentlyActive
            ? " dejará de estar disponible para nuevas operaciones."
            : " volverá a estar disponible en el sistema." }}
        </p>

        <div v-if="statusAction.currentlyActive && (statusAction.activeFunctions > 0 || statusAction.associatedRooms > 0)"
          class="impact-box">
          <span><strong>{{ statusAction.activeFunctions }}</strong> funciones activas</span>
          <span><strong>{{ statusAction.associatedRooms }}</strong> salas asociadas</span>
        </div>

        <p v-if="statusAction.currentlyActive && statusAction.activeFunctions > 0" class="warning-text">
          Las funciones existentes no se eliminarán, pero el cine no estará disponible para nuevas operaciones.
        </p>

        <div class="modal-actions">
          <button class="ghost-button" type="button" :disabled="changingStatus" @click="closeStatusModal">
            Cancelar
          </button>
          <button class="primary-button" :class="{ 'danger-confirm': statusAction.currentlyActive }" type="button"
            :disabled="changingStatus" @click="confirmStatusChange">
            {{ changingStatus
              ? "Procesando..."
              : statusAction.currentlyActive ? "Sí, desactivar" : "Sí, reactivar" }}
          </button>
        </div>
      </section>
    </div>
  </Teleport>
</template>
<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { AlertTriangle, LayoutDashboard, Power, Search, X } from "lucide-vue-next";
import { useCatalogStore } from "../../stores/catalog";

const router = useRouter();
const catalog = useCatalogStore();
const searchQuery = ref("");
const errorMessage = ref("");
const changingStatus = ref(false);
const statusAction = ref<{
  id: string;
  name: string;
  currentlyActive: boolean;
  activeFunctions: number;
  associatedRooms: number;
} | null>(null);

function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

const filteredCinemas = computed(() => {
  if (!searchQuery.value) return catalog.cinemas;
  const query = normalizar(searchQuery.value);
  return catalog.cinemas.filter((cinema) =>
    normalizar(cinema.name).includes(query),
  );
});

onMounted(async () => {
  errorMessage.value = "";
  try {
    await catalog.loadFromAPI();
    await catalog.loadAllShowtimes();
  } catch {
    errorMessage.value = "No se pudieron cargar todos los detalles de los cines.";
  }
});

function toggleStatus(id: string, currentlyActive: boolean) {
  errorMessage.value = "";

  const cinema = catalog.cinemaById(id);
  if (!cinema) {
    errorMessage.value = "No se encontró el cine seleccionado.";
    return;
  }

  const cinemaShowtimes = catalog.showtimes.filter(
    (showtime) => showtime.cinemaId === id,
  );
  const activeFunctions = cinemaShowtimes.filter(
    (showtime) => showtime.status === "activo",
  ).length;
  const associatedRooms = new Set(
    cinemaShowtimes.map((showtime) => showtime.roomId),
  ).size;

  statusAction.value = {
    id,
    name: cinema.name,
    currentlyActive,
    activeFunctions,
    associatedRooms,
  };
}

function closeStatusModal() {
  if (!changingStatus.value) statusAction.value = null;
}

async function confirmStatusChange() {
  if (!statusAction.value) return;

  const action = statusAction.value;
  changingStatus.value = true;
  errorMessage.value = "";

  try {
    if (action.currentlyActive) {
      await catalog.deleteCine(action.id);
    } else {
      await catalog.reactivateCine(action.id);
    }
    statusAction.value = null;
  } catch (err) {
    const apiErr = err as { status?: number };
    if (action.currentlyActive) {
      errorMessage.value =
        apiErr.status === 404
          ? "El cine ya estaba desactivado."
          : "No se pudo desactivar el cine. Intenta de nuevo.";
    } else {
      errorMessage.value =
        apiErr.status === 400
          ? "El cine ya está activo."
          : "No se pudo reactivar el cine. Intenta de nuevo.";
    }
    statusAction.value = null;
  } finally {
    changingStatus.value = false;
  }
}
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

p {
  color: #7a7590;
  font-size: .875rem;
  margin: 0;
}

.header-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.grid-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 14px;
  margin-top: 14px;
}

.catalog-card {
  overflow: hidden;
  padding: 0;
  transition: transform .15s, border-color .15s;
}

.catalog-card:hover {
  transform: translateY(-2px);
  border-color: rgba(200, 169, 110, 0.22);
}

.card-body {
  padding: 1rem 1.125rem;
  display: grid;
  gap: 10px;
}

.card-actions {
  display: flex;
  gap: 8px;
}

.search-wrapper {
  position: relative;
  max-width: 340px;
  margin-bottom: 14px;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #8a8378;
  pointer-events: none;
}

.search-input {
  padding-left: 36px;
}

.error-text {
  color: #e57373;
  font-size: 13px;
  margin: 0 0 10px;
}

.is-inactive h2,
.is-inactive p,
.is-inactive .pill {
  opacity: 0.5;
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: grid;
  place-items: center;
  padding: 20px;
  background: rgba(4, 6, 12, 0.78);
  backdrop-filter: blur(7px);
  animation: fade-in .16s ease-out;
}

.status-modal {
  position: relative;
  width: min(100%, 470px);
  padding: 28px;
  border: 1px solid rgba(200, 169, 110, 0.25);
  border-radius: 18px;
  background: linear-gradient(145deg, #171725, #101019);
  box-shadow: 0 28px 80px rgba(0, 0, 0, 0.55);
  animation: modal-in .18s ease-out;
}

.modal-close {
  position: absolute;
  top: 14px;
  right: 14px;
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 9px;
  background: rgba(255, 255, 255, 0.04);
  color: #8a8797;
  cursor: pointer;
}

.modal-icon {
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  margin-bottom: 18px;
  border-radius: 14px;
}

.warning-icon {
  background: rgba(239, 100, 100, 0.13);
  color: #ef7777;
}

.success-icon {
  background: rgba(74, 222, 128, 0.12);
  color: #6fdc96;
}

.modal-eyebrow {
  margin-bottom: 6px;
  color: #c8a96e;
  font-family: "DM Mono", monospace;
  font-size: 10px;
  letter-spacing: .1em;
  text-transform: uppercase;
}

.status-modal h2 {
  margin-bottom: 10px;
  font-family: "Playfair Display", serif;
  font-size: 24px;
}

.modal-description {
  color: #aaa6b5;
  line-height: 1.55;
}

.modal-description strong {
  color: #f0ece4;
}

.impact-box {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin-top: 20px;
}

.impact-box span {
  padding: 12px;
  border: 1px solid rgba(200, 169, 110, 0.15);
  border-radius: 10px;
  background: rgba(200, 169, 110, 0.06);
  color: #9691a3;
  font-size: 12px;
  text-align: center;
}

.impact-box strong {
  display: block;
  margin-bottom: 2px;
  color: #f0ece4;
  font-size: 20px;
}

.warning-text {
  margin-top: 14px;
  padding: 11px 12px;
  border-left: 3px solid #c8a96e;
  border-radius: 0 8px 8px 0;
  background: rgba(200, 169, 110, 0.07);
  color: #b9b2a2;
  font-size: 12px;
  line-height: 1.5;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 24px;
}

.danger-confirm {
  border-color: #b94b4b;
  background: #a84242;
  color: #fff;
}

@keyframes fade-in {
  from { opacity: 0; }
}

@keyframes modal-in {
  from { opacity: 0; transform: translateY(8px) scale(.98); }
}

@media (max-width: 900px) {
  .section-header {
    align-items: stretch;
    flex-direction: column;
  }

  .status-modal {
    padding: 24px 20px;
  }

  .impact-box {
    grid-template-columns: 1fr;
  }

  .modal-actions {
    flex-direction: column-reverse;
  }
}
</style>

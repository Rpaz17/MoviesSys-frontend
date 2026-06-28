<template>
  <section class="page">
    <div class="page-inner">
      <div class="section-header">
        <div>
          <p class="eyebrow">Panel de administrador</p>
          <h1>{{ isEdit ? "Editar sala" : "Crear sala" }}</h1>
        </div>
        <div class="header-actions">
          <button class="ghost-button" type="button" @click="router.push('/admin')">
            <LayoutDashboard class="w-3.5 h-3.5" /> Dashboard
          </button>
        </div>
      </div>

      <form class="card form-card" @submit.prevent="saveRoom">
        <div v-if="message" class="notice success">{{ message }}</div>
        <div v-if="error" class="notice error">{{ error }}</div>
        <div v-if="activeFunctionsWarning" class="notice warning">
          {{ activeFunctionsWarning }}
        </div>
        <div class="form-grid">
          <label class="field">Nombre<input v-model="roomForm.name" class="input" required /></label>
          <template v-if="!isEdit">
            <label class="field">Cine<select v-model="roomForm.cinemaId" class="input" required><option v-for="cinema in catalog.cinemas" :key="cinema.id" :value="cinema.id">{{ cinema.name }}</option></select></label>
            <label class="field">Tipo<select v-model="roomForm.type" class="input"><option>2D</option><option>3D</option><option>IMAX</option><option>VIP</option></select></label>
            <label class="field">Filas<input v-model.number="roomForm.rows" class="input" type="number" min="1" max="26" required /></label>
            <label class="field">Columnas<input v-model.number="roomForm.cols" class="input" type="number" min="1" max="30" required /></label>
          </template>
        </div>

        <div v-if="!isEdit" class="seat-preview">
          <div class="preview-heading">
            <span>Distribución</span>
            <strong>{{ seatCount }} asientos</strong>
          </div>
          <div class="screen">Pantalla</div>
          <div
            class="seat-grid"
            :style="{ gridTemplateColumns: `repeat(${previewCols}, minmax(18px, 1fr))` }"
          >
            <span
              v-for="seat in previewSeats"
              :key="seat"
              class="seat"
              :title="seat"
            >
              {{ seat }}
            </span>
          </div>
        </div>
        <div class="form-actions">
          <button class="ghost-button" type="button" @click="router.push('/admin/salas')">Cancelar</button>
          <button class="primary-button" type="submit" :disabled="saving">
            {{ saving ? "Guardando..." : "Guardar sala" }}
          </button>
        </div>
      </form>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { LayoutDashboard } from "lucide-vue-next";
import { useCatalogStore } from "../../stores/catalog";
import { ApiError } from "../../lib/api-client";
import { salasService } from "../../services/salas.service";
import type { Room } from "../../types";

const route = useRoute();
const router = useRouter();
const catalog = useCatalogStore();

const isEdit = computed(() => !!route.params.id);

const existing = computed(() =>
  isEdit.value ? catalog.roomById(String(route.params.id)) : undefined,
);

const editingRoomId = computed(() => existing.value?.id ?? String(route.params.id ?? ""));

const roomForm = reactive({
  name: "",
  cinemaId: "",
  type: "2D" as Room["type"],
  rows: 8,
  cols: 10,
});

const saving = ref(false);
const error = ref("");
const message = ref("");
const activeFunctionsWarning = ref("");

const safeRows = computed(() => Math.min(Math.max(Number(roomForm.rows) || 1, 1), 26));
const safeCols = computed(() => Math.min(Math.max(Number(roomForm.cols) || 1, 1), 30));
const previewCols = computed(() => safeCols.value);
const seatCount = computed(() => safeRows.value * safeCols.value);
const previewSeats = computed(() => {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const seats: string[] = [];
  for (let row = 0; row < safeRows.value; row += 1) {
    for (let col = 1; col <= safeCols.value; col += 1) {
      seats.push(`${letters[row]}${col}`);
    }
  }
  return seats;
});

function applyRoom(room: Room) {
  roomForm.name = room.name;
  roomForm.cinemaId = room.cinemaId;
  roomForm.type = room.type;
  roomForm.rows = room.rows || 8;
  roomForm.cols = room.cols || 10;
  activeFunctionsWarning.value =
    room.functions > 0 ? `Esta sala tiene ${room.functions} funcion(es) activa(s)` : "";
}

function errorMessage(err: unknown) {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message;
  return "No se pudo guardar la sala";
}

async function loadRoom() {
  if (catalog.cinemas.length === 0 || catalog.rooms.length === 0) {
    await catalog.loadFromAPI();
  }

  const room = existing.value;
  if (room) {
    applyRoom(room);
    return;
  }

  if (!isEdit.value) {
    roomForm.cinemaId = catalog.cinemas[0]?.id ?? "";
    return;
  }

  const sala = await salasService.getById(String(route.params.id));
  const cinemaId = String(sala.id_cine);
  const cinema = catalog.cinemaById(cinemaId);
  applyRoom({
    id: String(sala.id),
    name: sala.nombre,
    cinemaId,
    cinema: cinema?.name ?? "Desconocido",
    type: "2D",
    rows: sala.filas,
    cols: sala.columnas,
    status: "activo",
    functions: sala.funciones_activas ?? 0,
    occupancy: 0,
  });
}

async function saveRoom() {
  saving.value = true;
  error.value = "";
  message.value = "";
  activeFunctionsWarning.value = "";

  try {
    if (isEdit.value) {
      const result = await catalog.updateRoom(editingRoomId.value, {
        nombre: roomForm.name,
      });
      if (result.warning) {
        activeFunctionsWarning.value = result.warning;
        message.value = "Sala actualizada.";
        return;
      }
    } else {
      await catalog.createRoom({
        nombre: roomForm.name,
        id_cine: roomForm.cinemaId,
        filas: safeRows.value,
        columnas: safeCols.value,
      });
    }
    router.push("/admin/salas");
  } catch (err) {
    error.value = errorMessage(err);
  } finally {
    saving.value = false;
  }
}

onMounted(() => {
  loadRoom().catch((err) => {
    error.value = errorMessage(err);
  });
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
.wide { grid-column: 1 / -1; }
.form-actions { display: flex; justify-content: space-between; align-items: center; gap: 10px; }
.notice { border-radius: 8px; padding: .75rem .875rem; font-size: .875rem; line-height: 1.4; }
.notice.success { background: rgba(96, 165, 250, .12); border: 1px solid rgba(96, 165, 250, .2); color: #bfdbfe; }
.notice.error { background: rgba(248, 113, 113, .12); border: 1px solid rgba(248, 113, 113, .2); color: #fecaca; }
.notice.warning { background: rgba(200, 169, 110, .12); border: 1px solid rgba(200, 169, 110, .24); color: #f7dfaa; }
.seat-preview { display: grid; gap: .875rem; border-top: 1px solid rgba(200,169,110,.12); padding-top: 1rem; }
.preview-heading { display: flex; align-items: center; justify-content: space-between; gap: 10px; color: #c8a96e; font-size: .8125rem; }
.preview-heading strong { color: #f0ece4; font-weight: 600; }
.screen { height: 28px; border: 1px solid rgba(200,169,110,.25); background: rgba(240,236,228,.06); color: #c8a96e; display: grid; place-items: center; border-radius: 8px; font-size: .75rem; font-family: "DM Mono", monospace; text-transform: uppercase; }
.seat-grid { display: grid; gap: 6px; max-width: 100%; overflow: auto; padding-bottom: 2px; }
.seat { min-width: 18px; height: 24px; display: grid; place-items: center; border-radius: 6px 6px 3px 3px; background: rgba(200,169,110,.13); border: 1px solid rgba(200,169,110,.22); color: #f0ece4; font-size: .625rem; font-family: "DM Mono", monospace; }
button:disabled { cursor: not-allowed; opacity: .65; }
@media (max-width: 900px) {
  .section-header, .form-actions { align-items: stretch; flex-direction: column; }
  .form-grid { grid-template-columns: 1fr; }
  .wide { grid-column: auto; }
}
</style>

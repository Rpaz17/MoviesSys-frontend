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
        <div class="form-grid">
          <label class="field">Nombre<input v-model="roomForm.name" class="input" required /></label>
          <template v-if="!isEdit">
            <label class="field">Cine<select v-model="roomForm.cinemaId" class="input" required><option v-for="cinema in catalog.cinemas" :key="cinema.id" :value="cinema.id">{{ cinema.name }}</option></select></label>
            <label class="field">Tipo<select v-model="roomForm.type" class="input"><option>2D</option><option>3D</option><option>IMAX</option><option>VIP</option></select></label>
            <label class="field">Filas<input v-model.number="roomForm.rows" class="input" type="number" min="1" required /></label>
            <label class="field">Columnas<input v-model.number="roomForm.cols" class="input" type="number" min="1" required /></label>
          </template>
          <label class="field">Estado<select v-model="roomForm.status" class="input"><option>activo</option><option>mantenimiento</option><option>inactivo</option></select></label>
        </div>
        <div class="form-actions">
          <button class="ghost-button" type="button" @click="router.push('/admin/salas')">Cancelar</button>
          <button class="primary-button" type="submit">Guardar sala</button>
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
import type { Room, AdminStatus } from "../../types";

const route = useRoute();
const router = useRouter();
const catalog = useCatalogStore();

const isEdit = computed(() => !!route.params.id);

const existing = isEdit.value ? catalog.roomById(String(route.params.id)) : undefined;

const editingRoomId = existing?.id ?? "";

const roomForm = reactive({
  name: existing?.name ?? "",
  cinemaId: existing?.cinemaId ?? "",
  type: (existing?.type ?? "2D") as Room["type"],
  rows: existing?.rows ?? 8,
  cols: existing?.cols ?? 10,
  status: (existing?.status ?? "activo") as AdminStatus,
});

function saveRoom() {
  const cinema = catalog.cinemaById(isEdit.value ? (existing?.cinemaId ?? "") : roomForm.cinemaId);
  if (!cinema) return;
  const previous = editingRoomId ? catalog.roomById(editingRoomId) : undefined;
  catalog.upsertRoom({
    id: editingRoomId || `S${String(catalog.rooms.length + 1).padStart(3, "0")}`,
    name: roomForm.name,
    cinemaId: isEdit.value ? (existing?.cinemaId ?? "") : roomForm.cinemaId,
    cinema: cinema.name,
    type: isEdit.value ? (existing?.type ?? "2D") : roomForm.type,
    rows: isEdit.value ? (existing?.rows ?? 8) : roomForm.rows,
    cols: isEdit.value ? (existing?.cols ?? 10) : roomForm.cols,
    status: roomForm.status,
    functions: previous?.functions ?? 0,
    occupancy: previous?.occupancy ?? 0,
  });
  router.push("/admin/salas");
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
@media (max-width: 900px) {
  .section-header, .form-actions { align-items: stretch; flex-direction: column; }
  .form-grid { grid-template-columns: 1fr; }
  .wide { grid-column: auto; }
}
</style>

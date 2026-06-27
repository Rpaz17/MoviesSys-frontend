<template>
  <section class="page">
    <div class="page-inner">
      <div class="section-header">
        <div>
          <p class="eyebrow">Panel de administrador</p>
          <h1>{{ isEdit ? "Editar cine" : "Crear cine" }}</h1>
        </div>
        <div class="header-actions">
          <button class="ghost-button" type="button" @click="router.push('/admin')">
            <LayoutDashboard class="w-3.5 h-3.5" /> Dashboard
          </button>
        </div>
      </div>

      <form class="card form-card" @submit.prevent="saveCinema">
        <div class="form-grid">
          <label class="field">Nombre<input v-model="cinemaForm.name" class="input" required /></label>
          <label class="field">Ciudad<select v-model="cinemaForm.city" class="input" required><option v-for="city in catalog.cities" :key="city.id" :value="city.name">{{ city.name }}</option></select></label>
          <label class="field wide">Dirección<input v-model="cinemaForm.address" class="input" required /></label>
          <label class="field">Estado<select v-model="cinemaForm.status" class="input"><option>activo</option><option>mantenimiento</option><option>inactivo</option></select></label>
        </div>
        <div class="form-actions">
          <button class="ghost-button" type="button" @click="router.push('/admin/cines')">Cancelar</button>
          <button class="primary-button" type="submit">Guardar cine</button>
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
import type { Cinema, AdminStatus } from "../../types";

const route = useRoute();
const router = useRouter();
const catalog = useCatalogStore();

const isEdit = computed(() => !!route.params.id);

const existing = isEdit.value ? catalog.cinemaById(String(route.params.id)) : undefined;

const editingCinemaId = existing?.id ?? "";

const cinemaForm = reactive({
  name: existing?.name ?? "",
  city: existing?.city ?? "",
  address: existing?.address ?? "",
  status: (existing?.status ?? "activo") as AdminStatus,
});

function saveCinema() {
  const previous = editingCinemaId ? catalog.cinemaById(editingCinemaId) : undefined;
  const cinema: Cinema = {
    id: editingCinemaId || `CI${String(catalog.cinemas.length + 1).padStart(3, "0")}`,
    name: cinemaForm.name,
    city: cinemaForm.city,
    address: cinemaForm.address,
    status: cinemaForm.status,
    rooms: previous?.rooms ?? 0,
    functions: previous?.functions ?? 0,
    revenue: previous?.revenue ?? "$0",
    img: previous?.img ?? "",
  };
  catalog.upsertCinema(cinema);
  router.push("/admin/cines");
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

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
        <p v-if="errorMessage" class="error-text">{{ errorMessage }}</p>
        <div class="form-grid">
          <label class="field">Nombre<input v-model="cinemaForm.name" class="input" required /></label>
          <label class="field">
            Ciudad
            <select v-model="cinemaForm.cityId" class="input" required>
              <option value="" disabled>Selecciona una ciudad</option>
              <option v-for="city in catalog.cities" :key="city.id" :value="city.id">{{ city.name }}</option>
            </select>
          </label>
          <label class="field wide">Dirección<input v-model="cinemaForm.address" class="input" required /></label>
        </div>
        <div class="form-actions">
          <button class="ghost-button" type="button" @click="router.push('/admin/cines')">Cancelar</button>
          <button class="primary-button" type="submit" :disabled="saving">
            {{ saving ? "Guardando..." : "Guardar cine" }}
          </button>
        </div>
      </form>
    </div>
  </section>
</template>

<script setup lang="ts">
import { reactive, computed, ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { LayoutDashboard } from "lucide-vue-next";
import { useCatalogStore } from "../../stores/catalog";

const route = useRoute();
const router = useRouter();
const catalog = useCatalogStore();
const saving = ref(false);
const errorMessage = ref("");

const isEdit = computed(() => !!route.params.id);
const existing = isEdit.value ? catalog.cinemaById(String(route.params.id)) : undefined;
const editingCinemaId = existing?.id ?? "";

const cinemaForm = reactive({
  name: existing?.name ?? "",
  cityId: "" as string | number,
  address: existing?.address ?? "",
});

onMounted(async () => {
  if (catalog.cities.length === 0) {
    await catalog.loadFromAPI();
  }
  if (existing) {
    const matchedCity = catalog.cities.find((c) => c.name === existing.city);
    cinemaForm.cityId = matchedCity?.id ?? "";
  }
});

async function saveCinema() {
  if (!cinemaForm.name || !cinemaForm.cityId || !cinemaForm.address) return;
  saving.value = true;
  errorMessage.value = "";
  try {
    const payload = {
      nombre: cinemaForm.name,
      direccion: cinemaForm.address,
      id_ciudad: Number(cinemaForm.cityId),
    };

    if (editingCinemaId) {
      await catalog.updateCine(editingCinemaId, payload);
    } else {
      await catalog.createCine(payload);
    }
    router.push("/admin/cines");
  } catch (err) {
    const apiErr = err as { status?: number };
    if (apiErr.status === 409) {
      errorMessage.value = "Ya existe un cine con ese nombre en esta ciudad.";
    } else if (apiErr.status === 404) {
      errorMessage.value = "La ciudad seleccionada no fue encontrada.";
    } else {
      errorMessage.value = "No se pudo guardar el cine. Intenta de nuevo.";
    }
  } finally {
    saving.value = false;
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

.wide {
  grid-column: 1 / -1;
}

.form-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}

.error-text {
  color: #e57373;
  font-size: 13px;
  margin: 0;
}

@media (max-width: 900px) {

  .section-header,
  .form-actions {
    align-items: stretch;
    flex-direction: column;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .wide {
    grid-column: auto;
  }
}
</style>
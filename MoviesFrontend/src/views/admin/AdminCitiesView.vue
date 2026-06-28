<template>
  <section class="page">
    <div class="page-inner">
      <div class="section-header">
        <div>
          <p class="eyebrow">Panel de administrador</p>
          <h1>Ciudades</h1>
        </div>
        <div class="header-actions">
          <button class="ghost-button" type="button" @click="router.push('/admin')">
            <LayoutDashboard class="w-3.5 h-3.5" /> Dashboard
          </button>
        </div>
      </div>
      <div class="stack">
        <form class="card inline-form" @submit.prevent="saveCity">
          <input v-model.trim="cityName" class="input" placeholder="Nueva ciudad" required />
          <button class="primary-button" type="submit" :disabled="saving">
            {{ saving ? "Guardando..." : "Agregar" }}
          </button>
        </form>
        <div class="search-wrapper">
          <Search class="search-icon w-4 h-4" />
          <input
            v-model.trim="searchQuery"
            class="input search-input"
            type="search"
            placeholder="Buscar ciudad..."
          />
        </div>
        <p v-if="errorMessage" class="error-text">{{ errorMessage }}</p>
        <p v-if="filteredCities.length === 0" class="empty-text">
          No se encontraron ciudades.
        </p>
        <article v-for="city in filteredCities" :key="city.id" class="card list-row">
          <template v-if="editingId === city.id">
            <input v-model.trim="editName" class="input" />
            <div class="row-actions">
              <button class="ghost-button" type="button" @click="confirmEdit(city.id)">Guardar</button>
              <button class="ghost-button" type="button" @click="cancelEdit">Cancelar</button>
            </div>
          </template>
          <template v-else>
            <div class="city-info" :class="{ 'is-inactive': !city.active }">
              <strong>{{ city.name }}</strong>
            </div>
            <div class="row-actions">
              <button v-if="city.active" class="ghost-button" type="button" @click="startEdit(city.id, city.name)">
                Editar
              </button>
              <button class="ghost-button" type="button" @click="toggleStatus(city.id, city.active)">
                {{ city.active ? "Desactivar" : "Reactivar" }}
              </button>
            </div>
          </template>
        </article>
      </div>
    </div>
  </section>
</template>
<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { LayoutDashboard, Search } from "lucide-vue-next";
import { useCatalogStore } from "../../stores/catalog";

const router = useRouter();
const catalog = useCatalogStore();
const cityName = ref("");
const saving = ref(false);
const errorMessage = ref("");
const editingId = ref<string | null>(null);
const editName = ref("");
const searchQuery = ref("");

function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

const filteredCities = computed(() => {
  if (!searchQuery.value) return catalog.cities;
  const query = normalizar(searchQuery.value);
  return catalog.cities.filter((city) =>
    normalizar(city.name).includes(query),
  );
});

onMounted(() => {
  if (catalog.cities.length === 0) {
    catalog.loadFromAPI();
  }
});

async function saveCity() {
  if (!cityName.value) return;
  saving.value = true;
  errorMessage.value = "";
  try {
    await catalog.createCity(cityName.value);
    cityName.value = "";
  } catch (err) {
    const apiErr = err as { status?: number };
    if (apiErr.status === 409) {
      errorMessage.value = "Ya existe una ciudad con ese nombre.";
    } else {
      errorMessage.value = "No se pudo crear la ciudad. Intenta de nuevo.";
    }
  } finally {
    saving.value = false;
  }
}

function startEdit(id: string, name: string) {
  errorMessage.value = "";
  editingId.value = id;
  editName.value = name;
}

function cancelEdit() {
  errorMessage.value = "";
  editingId.value = null;
  editName.value = "";
}

async function confirmEdit(id: string) {
  if (!editName.value) return;
  errorMessage.value = "";
  try {
    await catalog.updateCity(id, editName.value);
    editingId.value = null;
  } catch (err) {
    const apiErr = err as { status?: number };
    if (apiErr.status === 409) {
      errorMessage.value = "Ya existe otra ciudad con ese nombre";
    } else if (apiErr.status === 404) {
      errorMessage.value = "La ciudad no fue encontrada, puede que ya haya sido eliminada";
    } else {
      errorMessage.value = "No se pudo actualizar la ciudad. Intenta de nuevo";
    }
  }
}

async function toggleStatus(id: string, currentlyActive: boolean) {
  errorMessage.value = "";
  try {
    if (currentlyActive) {
      await catalog.deleteCity(id);
    } else {
      await catalog.reactivateCity(id);
    }
  } catch (err) {
    const apiErr = err as { status?: number };
    if (currentlyActive) {
      errorMessage.value =
        apiErr.status === 404
          ? "La ciudad ya estaba desactivada."
          : "No se pudo desactivar la ciudad. Intenta de nuevo.";
    } else {
      errorMessage.value =
        apiErr.status === 400
          ? "La ciudad ya está activa."
          : "No se pudo reactivar la ciudad. Intenta de nuevo.";
    }
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

.stack {
  display: grid;
  gap: 10px;
}

.list-row,
.inline-form {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}

.list-row,
.inline-form {
  padding: 1rem 1.125rem;
}

.inline-form {
  justify-content: flex-start;
}

.inline-form .input {
  max-width: 340px;
}

.row-actions {
  display: flex;
  gap: 8px;
}

.error-text {
  color: #e57373;
  font-size: 13px;
  margin: 0;
}

strong {
  color: #f0ece4;
}

@media (max-width: 900px) {

  .section-header,
  .list-row {
    align-items: stretch;
    flex-direction: column;
  }
}

.is-inactive {
  opacity: 0.5;
}

.search-wrapper {
  position: relative;
  max-width: 340px;
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

.empty-text {
  color: #8a8378;
  font-size: 14px;
  text-align: center;
  padding: 1rem;
}
</style>
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
</template>
<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { LayoutDashboard, Search } from "lucide-vue-next";
import { useCatalogStore } from "../../stores/catalog";

const router = useRouter();
const catalog = useCatalogStore();
const searchQuery = ref("");
const errorMessage = ref("");

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

onMounted(() => {
  if (catalog.cinemas.length === 0) {
    catalog.loadFromAPI();
  }
});

async function toggleStatus(id: string, currentlyActive: boolean) {
  errorMessage.value = "";
  try {
    if (currentlyActive) {
      await catalog.deleteCine(id);
    } else {
      await catalog.reactivateCine(id);
    }
  } catch (err) {
    const apiErr = err as { status?: number };
    if (currentlyActive) {
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

@media (max-width: 900px) {
  .section-header {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>
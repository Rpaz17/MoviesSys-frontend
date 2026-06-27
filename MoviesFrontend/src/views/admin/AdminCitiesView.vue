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
        <p v-if="errorMessage" class="error-text">{{ errorMessage }}</p>
        <article v-for="city in catalog.cities" :key="city.id" class="card list-row">
          <template v-if="editingId === city.id">
            <input v-model.trim="editName" class="input" />
            <div class="row-actions">
              <button class="ghost-button" type="button" @click="confirmEdit(city.id)">Guardar</button>
              <button class="ghost-button" type="button" @click="cancelEdit">Cancelar</button>
            </div>
          </template>
          <template v-else>
            <strong>{{ city.name }}</strong>
            <button class="ghost-button" type="button" @click="startEdit(city.id, city.name)">Editar</button>
          </template>
        </article>
      </div>
    </div>
  </section>
</template>
<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { LayoutDashboard } from "lucide-vue-next";
import { useCatalogStore } from "../../stores/catalog";

const router = useRouter();
const catalog = useCatalogStore();
const cityName = ref("");
const saving = ref(false);
const errorMessage = ref("");
const editingId = ref<string | null>(null);
const editName = ref("");

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
  } catch {
    errorMessage.value = "No se pudo crear la ciudad. Verifica que no exista ya.";
  } finally {
    saving.value = false;
  }
}

function startEdit(id: string, name: string) {
  editingId.value = id;
  editName.value = name;
}

function cancelEdit() {
  editingId.value = null;
  editName.value = "";
}

async function confirmEdit(id: string) {
  if (!editName.value) return;
  try {
    await catalog.updateCity(id, editName.value);
    editingId.value = null;
  } catch {
    errorMessage.value = "No se pudo actualizar la ciudad.";
  }
}
</script>
<style scoped>
.section-header { display: flex; justify-content: space-between; gap: 14px; align-items: flex-end; margin-bottom: 20px; }
.eyebrow { color: #c8a96e; font-family: "DM Mono", monospace; text-transform: uppercase; font-size: 11px; letter-spacing: .09em; margin: 0 0 4px; }
h1 { font-size: clamp(20px, 2.5vw, 30px); font-weight: 600; color: #f0ece4; margin: 0; font-family: 'Playfair Display', serif; letter-spacing: -0.01em; }
.header-actions { display: flex; flex-wrap: wrap; gap: 8px; }
.stack { display: grid; gap: 10px; }
.list-row, .inline-form { display: flex; justify-content: space-between; align-items: center; gap: 10px; }
.list-row, .inline-form { padding: 1rem 1.125rem; }
.inline-form { justify-content: flex-start; }
.inline-form .input { max-width: 340px; }
.row-actions { display: flex; gap: 8px; }
.error-text { color: #e57373; font-size: 13px; margin: 0; }
strong { color: #f0ece4; }
@media (max-width: 900px) {
  .section-header, .list-row { align-items: stretch; flex-direction: column; }
}
</style>
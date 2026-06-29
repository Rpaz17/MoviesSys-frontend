<template>
  <section class="page">
    <div class="page-inner">
      <div class="section-header">
        <div>
          <p class="eyebrow">Panel de administrador</p>
          <h1>Clientes</h1>
        </div>
        <div class="header-actions">
          <button class="ghost-button" type="button" @click="router.push('/admin')">
            <LayoutDashboard class="w-3.5 h-3.5" /> Dashboard
          </button>
        </div>
      </div>

      <div class="filters-card card">
        <input v-model.trim="search" class="input" placeholder="Buscar por nombre o correo" @input="onSearchInput" />
        <select v-model="statusFilter" class="input" @change="fetchCustomers">
          <option value="">Todos los estados</option>
          <option value="active">Activo</option>
          <option value="inactive">Inactivo</option>
          <option value="suspended">Suspendido</option>
        </select>
      </div>

      <div v-if="isLoading" class="empty-state card">Cargando clientes...</div>

      <div v-else class="table-card card">
        <table>
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Correo</th>
              <th>Estado</th>
              <th>Registro</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="customer in catalog.customers" :key="customer.id">
              <td>
                <strong>{{ customer.name }}</strong>
                <small v-if="customer.phone">{{ customer.phone }}</small>
              </td>
              <td>{{ customer.email }}</td>
              <td>
                <template v-if="customer.status === 'suspendido'">
                  <span class="pill" :class="'status-' + customer.status">{{ customer.status }}</span>
                </template>
                <button v-else class="pill" :class="'status-' + customer.status" @click="catalog.toggleCustomerStatus(customer.id)">{{ customer.status }}</button>
              </td>
              <td>{{ customer.registeredAt ? formatDate(customer.registeredAt) : '-' }}</td>
            </tr>
            <tr v-if="catalog.customers.length === 0">
              <td colspan="4" class="empty-row">No se encontraron clientes.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import { useRouter } from "vue-router";
import { LayoutDashboard } from "lucide-vue-next";
import { useCatalogStore } from "../../stores/catalog";
import { useFormat } from "../../composables/use-format";

const router = useRouter();
const catalog = useCatalogStore();
const { formatDate } = useFormat();

const search = ref("");
const statusFilter = ref("");
const isLoading = ref(false);
let searchTimer: number | undefined;

async function fetchCustomers() {
  isLoading.value = true;
  const query = search.value.trim();
  await catalog.loadCustomers({
    estado: statusFilter.value || undefined,
    ...(query.includes("@")
      ? { email: query }
      : query
        ? { nombre: query }
        : {}),
  });
  isLoading.value = false;
}

function onSearchInput() {
  if (searchTimer) window.clearTimeout(searchTimer);
  searchTimer = window.setTimeout(fetchCustomers, 300);
}

onMounted(() => {
  fetchCustomers();
});

onUnmounted(() => {
  if (searchTimer) window.clearTimeout(searchTimer);
});
</script>

<style scoped>
.section-header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-end;
  width: min(100%, 1100px);
  margin: 0 auto 24px;
}
.eyebrow {
  color: #c8a96e;
  font-family: "DM Mono", monospace;
  text-transform: uppercase;
  font-size: 11px;
  letter-spacing: 0.09em;
  margin: 0 0 4px;
}
h1 {
  font-size: clamp(22px, 3vw, 34px);
  font-weight: 600;
  color: #f0ece4;
  margin: 0;
  font-family: "Playfair Display", serif;
  letter-spacing: -0.01em;
}
.filters-card {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 10px;
  padding: 1rem 1.125rem;
  margin-bottom: 20px;
}
.table-card {
  overflow-x: auto;
  padding: 0;
}
table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}
thead {
  border-bottom: 1px solid rgba(200, 169, 110, 0.1);
}
th {
  text-align: left;
  padding: 0.875rem 1.125rem;
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  font-family: "DM Mono", monospace;
  color: #c8a96e;
}
td {
  padding: 0.75rem 1.125rem;
  color: #f0ece4;
  vertical-align: middle;
}
td strong {
  display: block;
  font-weight: 600;
}
td small {
  display: block;
  color: #7a7590;
  font-size: 0.75rem;
  margin-top: 2px;
}
.empty-row {
  text-align: center;
  color: #7a7590;
  padding: 3rem 1.125rem;
}
.empty-state {
  padding: 3rem 1.5rem;
  text-align: center;
  color: #7a7590;
  font-size: 0.875rem;
}
td button.pill {
  cursor: pointer;
  font: inherit;
}
.pill.status-activo {
  background: rgba(76, 175, 125, 0.1);
  border-color: rgba(76, 175, 125, 0.2);
  color: #4caf7d;
}
.pill.status-inactivo {
  background: rgba(200, 169, 110, 0.1);
  border-color: rgba(200, 169, 110, 0.2);
  color: #c8a96e;
}
.pill.status-suspendido {
  background: rgba(232, 96, 122, 0.1);
  border-color: rgba(232, 96, 122, 0.2);
  color: #e8607a;
}
@media (max-width: 640px) {
  .section-header {
    align-items: stretch;
    flex-direction: column;
  }
  .section-header .ghost-button {
    justify-content: center;
    width: 100%;
  }
}
</style>

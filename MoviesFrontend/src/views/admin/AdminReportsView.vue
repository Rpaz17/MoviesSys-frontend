<template>
  <section class="page">
    <div class="page-inner">
      <div class="section-header">
        <div>
          <p class="eyebrow">Panel de administrador</p>
          <h1>Reporte de reservas</h1>
        </div>
        <div class="header-actions">
          <button class="ghost-button" type="button" @click="router.push('/admin')">
            <LayoutDashboard class="w-3.5 h-3.5" /> Dashboard
          </button>
          <button class="ghost-button" type="button" @click="exportCsv" :disabled="loading">Exportar CSV</button>
        </div>
      </div>

      <div class="filters card">
        <label class="field">
          Pelicula
          <select v-model="filters.id_pelicula" class="input">
            <option :value="undefined">Todas</option>
            <option v-for="movie in catalog.movies" :key="movie.id" :value="Number(movie.id)">{{ movie.title }}</option>
          </select>
        </label>
        <label class="field">
          Cine
          <select v-model="filters.id_cine" class="input">
            <option :value="undefined">Todos</option>
            <option v-for="cinema in catalog.cinemas" :key="cinema.id" :value="Number(cinema.id)">{{ cinema.name }}
            </option>
          </select>
        </label>
        <label class="field">
          Estado
          <select v-model="filters.estado" class="input">
            <option :value="undefined">Todos</option>
            <option value="pendiente">Pendiente</option>
            <option value="pagada">Pagada</option>
            <option value="cancelada">Cancelada</option>
          </select>
        </label>
        <label class="field">
          Desde
          <input v-model="filters.fecha_inicio" class="input" type="date" />
        </label>
        <label class="field">
          Hasta
          <input v-model="filters.fecha_fin" class="input" type="date" />
        </label>
        <button class="primary-button" type="button" @click="applyFilters" :disabled="loading">
          {{ loading ? "Buscando..." : "Filtrar" }}
        </button>
        <button class="ghost-button" type="button" @click="clearFilters" :disabled="loading">Limpiar</button>
      </div>

      <p v-if="errorMessage" class="error-text">{{ errorMessage }}</p>

      <div class="table-card card">
        <table>
          <thead>
            <tr>
              <th>Reserva</th>
              <th>Cliente</th>
              <th>Función</th>
              <th>Cine</th>
              <th>Asientos</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="reservation in reservations" :key="reservation.id">
              <td>{{ reservation.numero_reserva }}</td>
              <td>{{ reservation.usuario.nombre }}<small>{{ reservation.usuario.email }}</small></td>
              <td>{{ reservation.funcion.pelicula.titulo }}<small>{{ formatDate(reservation.funcion.fecha_hora)
                  }}</small></td>
              <td>{{ reservation.funcion.sala.cine.nombre }}<small>{{ reservation.funcion.sala.nombre }}</small></td>
              <td>{{ reservation.total_asientos }}</td>
              <td>{{ reservation.estado }}</td>
            </tr>
            <tr v-if="reservations.length === 0 && !loading">
              <td colspan="6" class="empty-text">No se encontraron reservas con esos filtros.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="totalPaginas > 1" class="pagination">
        <button class="ghost-button" type="button" :disabled="pagina <= 1 || loading"
          @click="goToPage(pagina - 1)">Anterior</button>
        <span>Página {{ pagina }} de {{ totalPaginas }}</span>
        <button class="ghost-button" type="button" :disabled="pagina >= totalPaginas || loading"
          @click="goToPage(pagina + 1)">Siguiente</button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { useRouter } from "vue-router";
import { LayoutDashboard } from "lucide-vue-next";
import { useCatalogStore } from "../../stores/catalog";
import { reportesService, type ReporteReserva } from "../../services/reportes.service";

const router = useRouter();
const catalog = useCatalogStore();
const loading = ref(false);
const errorMessage = ref("");
const reservations = ref<ReporteReserva[]>([]);
const pagina = ref(1);
const totalPaginas = ref(1);
const limite = 10;

const filters = reactive<{
  id_pelicula?: number;
  id_cine?: number;
  estado?: string;
  fecha_inicio?: string;
  fecha_fin?: string;
}>({});

function formatDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleString("es-HN", { dateStyle: "short", timeStyle: "short" });
}

async function loadReport(page = 1) {
  loading.value = true;
  errorMessage.value = "";
  try {
    const response = await reportesService.getReservas({
      ...filters,
      pagina: page,
      limite,
    });
    reservations.value = response.data;
    pagina.value = response.pagina;
    totalPaginas.value = response.total_paginas;
  } catch (err) {
    const apiErr = err as { status?: number };
    errorMessage.value =
      apiErr.status === 403
        ? "No tienes permisos para ver este reporte."
        : "No se pudo cargar el reporte. Intenta de nuevo.";
  } finally {
    loading.value = false;
  }
}

function applyFilters() {
  loadReport(1);
}

function clearFilters() {
  filters.id_pelicula = undefined;
  filters.id_cine = undefined;
  filters.estado = undefined;
  filters.fecha_inicio = undefined;
  filters.fecha_fin = undefined;
  loadReport(1);
}

function goToPage(page: number) {
  loadReport(page);
}

onMounted(async () => {
  if (catalog.movies.length === 0 || catalog.cinemas.length === 0) {
    await catalog.loadFromAPI();
  }
  loadReport(1);
});

function exportCsv() {
  const rows = [["reserva", "cliente", "correo", "pelicula", "cine", "fecha", "asientos", "estado"]];
  reservations.value.forEach((r) => rows.push([
    r.numero_reserva,
    r.usuario.nombre,
    r.usuario.email,
    r.funcion.pelicula.titulo,
    r.funcion.sala.cine.nombre,
    formatDate(r.funcion.fecha_hora),
    String(r.total_asientos),
    r.estado,
  ]));
  const blob = new Blob([rows.map((row) => row.join(",")).join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "reporte-reservas.csv";
  link.click();
  URL.revokeObjectURL(url);
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

.filters {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: flex-end;
  padding: 1rem 1.125rem;
  margin-bottom: 14px;
}

.field {
  display: grid;
  gap: 6px;
  color: #c8a96e;
  font-size: .8125rem;
  font-weight: 500;
  min-width: 160px;
}

.table-card {
  overflow: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  min-width: 700px;
}

th,
td {
  text-align: left;
  padding: .875rem 1rem;
  border-bottom: 1px solid rgba(200, 169, 110, .09);
  color: #d0ccde;
  vertical-align: top;
  font-size: .875rem;
}

th {
  color: #c8a96e;
  font-size: .6875rem;
  text-transform: uppercase;
  font-family: "DM Mono", monospace;
  letter-spacing: .07em;
  background: rgba(200, 169, 110, 0.03);
}

tr:hover td {
  background: rgba(200, 169, 110, 0.03);
}

small {
  display: block;
  margin-top: 3px;
  font-size: .8125rem;
  color: #7a7590;
}

.error-text {
  color: #e57373;
  font-size: 13px;
  margin: 0 0 10px;
}

.empty-text {
  text-align: center;
  color: #7a7590;
  padding: 2rem;
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  margin-top: 14px;
  color: #d0ccde;
  font-size: .875rem;
}

@media (max-width: 900px) {
  .section-header {
    align-items: stretch;
    flex-direction: column;
  }

  .filters {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
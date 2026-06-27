<template>
  <section class="page">
    <div class="page-inner">
      <div class="section-header">
        <div>
          <p class="eyebrow">Panel de administrador</p>
          <h1>Salas</h1>
        </div>
        <div class="header-actions">
          <button class="ghost-button" type="button" @click="router.push('/admin')">
            <LayoutDashboard class="w-3.5 h-3.5" /> Dashboard
          </button>
          <button class="primary-button" type="button" @click="router.push('/admin/salas/crear')">Nueva sala</button>
        </div>
      </div>

      <div class="table-card card">
        <table>
          <thead><tr><th>Nombre</th><th>Cine</th><th>Tipo</th><th>Capacidad</th><th>Estado</th><th>Funciones</th><th>Ocupación</th><th>Acciones</th></tr></thead>
          <tbody>
            <tr v-for="room in catalog.rooms" :key="room.id">
              <td><strong>{{ room.name }}</strong></td>
              <td>{{ room.cinema }}</td>
              <td>{{ room.type }}</td>
              <td>{{ room.rows * room.cols }} asientos</td>
              <td><span class="pill status">{{ room.status }}</span></td>
              <td>{{ room.functions }}</td>
              <td>{{ room.occupancy }}%</td>
              <td><button class="ghost-button" type="button" @click="router.push('/admin/salas/' + room.id + '/editar')">Editar</button></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";
import { LayoutDashboard } from "lucide-vue-next";
import { useCatalogStore } from "../../stores/catalog";

const router = useRouter();
const catalog = useCatalogStore();
</script>

<style scoped>
.section-header { display: flex; justify-content: space-between; gap: 14px; align-items: flex-end; margin-bottom: 20px; }
.eyebrow { color: #c8a96e; font-family: "DM Mono", monospace; text-transform: uppercase; font-size: 11px; letter-spacing: .09em; margin: 0 0 4px; }
h1 { font-size: clamp(20px, 2.5vw, 30px); font-weight: 600; color: #f0ece4; margin: 0; font-family: 'Playfair Display', serif; letter-spacing: -0.01em; }
.header-actions { display: flex; flex-wrap: wrap; gap: 8px; }
.table-card { overflow: auto; }
table { width: 100%; border-collapse: collapse; min-width: 700px; }
th, td { text-align: left; padding: .875rem 1rem; border-bottom: 1px solid rgba(200,169,110,.09); color: #d0ccde; vertical-align: top; font-size: .875rem; }
th { color: #c8a96e; font-size: .6875rem; text-transform: uppercase; font-family: "DM Mono", monospace; letter-spacing: .07em; background: rgba(200,169,110,0.03); }
tr:hover td { background: rgba(200,169,110,0.03); }
strong { color: #f0ece4; }
.pill.status { background: rgba(200,169,110,.08); border: 1px solid rgba(200,169,110,.16); color: #c8a96e; }
@media (max-width: 900px) {
  .section-header { align-items: stretch; flex-direction: column; }
}
</style>

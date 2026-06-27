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

      <div class="table-card card">
        <table>
          <thead><tr><th>Cliente</th><th>Correo</th><th>Estado</th><th>Reservas</th><th>Gastado</th></tr></thead>
          <tbody>
            <tr v-for="customer in catalog.customers" :key="customer.id">
              <td><strong>{{ customer.name }}</strong><small>{{ customer.phone }}</small></td>
              <td>{{ customer.email }}</td>
              <td>
                <button class="pill status-toggle" :class="'status-' + customer.status" type="button" @click="catalog.toggleCustomerStatus(customer.id)">
                  {{ customer.status }}
                </button>
              </td>
              <td>{{ customer.reservations }}</td>
              <td>{{ customer.spent }}</td>
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
small { display: block; margin-top: 3px; font-size: .8125rem; color: #7a7590; }
.status-toggle { cursor: pointer; transition: background .12s, border-color .12s; }
.status-toggle:hover { opacity: .85; }
.status-activo { background: rgba(76,175,125,0.08); border-color: rgba(76,175,125,0.2); color: #4caf7d; }
.status-inactivo { background: rgba(122,117,144,0.08); border-color: rgba(122,117,144,0.2); color: #7a7590; }
.status-suspendido { background: rgba(232,96,122,0.08); border-color: rgba(232,96,122,0.2); color: #e8607a; }
@media (max-width: 900px) {
  .section-header { align-items: stretch; flex-direction: column; }
}
</style>

<script setup lang="ts">
import { computed } from "vue";
import { useRouter } from "vue-router";
import { Ban, BarChart3, Building2, CalendarClock, Clapperboard, LayoutGrid, MapPin, Percent, Ticket, Users } from "lucide-vue-next";
import { useSessionStore } from "../../stores/session";

const router = useRouter();
const session = useSessionStore();

const greeting = computed(() => {
  const h = new Date().getHours();
  if (h < 12) return "Buenos días";
  if (h < 18) return "Buenas tardes";
  return "Buenas noches";
});
</script>

<template>
  <section class="page">
    <div class="page-inner">
      <div class="section-header">
        <div>
          <p class="eyebrow">Panel de administrador</p>
          <h1>{{ greeting }}, {{ session.user?.name.split(' ')[0] }}</h1>
        </div>
      </div>

      <div class="dashboard-grid">
        <button class="dash-card" @click="router.push('/admin/clientes')">
          <Users class="dash-icon" />
          <span class="dash-label">Clientes</span>
          <span class="dash-desc">Gestionar clientes registrados</span>
        </button>
        <button class="dash-card" @click="router.push('/admin/peliculas')">
          <Clapperboard class="dash-icon" />
          <span class="dash-label">Películas</span>
          <span class="dash-desc">Catálogo y estados</span>
        </button>
        <button class="dash-card" @click="router.push('/admin/cines')">
          <Building2 class="dash-icon" />
          <span class="dash-label">Cines</span>
          <span class="dash-desc">Sucursales y estados</span>
        </button>
        <button class="dash-card" @click="router.push('/admin/salas')">
          <LayoutGrid class="dash-icon" />
          <span class="dash-label">Salas</span>
          <span class="dash-desc">Salas, tipos y capacidad</span>
        </button>
        <button class="dash-card" @click="router.push('/admin/ciudades')">
          <MapPin class="dash-icon" />
          <span class="dash-label">Ciudades</span>
          <span class="dash-desc">Activar o desactivar ciudades</span>
        </button>
        <button class="dash-card" @click="router.push('/admin/funciones')">
          <CalendarClock class="dash-icon" />
          <span class="dash-label">Funciones</span>
          <span class="dash-desc">Crear y gestionar funciones</span>
        </button>
        <button class="dash-card" @click="router.push('/recepcion/vender')">
          <Ticket class="dash-icon" />
          <span class="dash-label">Vender boletos</span>
          <span class="dash-desc">Cobrar en efectivo en taquilla</span>
        </button>
        <button class="dash-card" @click="router.push('/admin/reportes')">
          <BarChart3 class="dash-icon" />
          <span class="dash-label">Reportes</span>
          <span class="dash-desc">Reservas, pagos y CSV</span>
        </button>
        <button class="dash-card" @click="router.push('/admin/cupones')">
          <Percent class="dash-icon" />
          <span class="dash-label">Cupones</span>
          <span class="dash-desc">Crear y activar descuentos</span>
        </button>
        <button class="dash-card" @click="router.push('/admin/cancelaciones')">
          <Ban class="dash-icon" />
          <span class="dash-label">Cancelaciones</span>
          <span class="dash-desc">Política de reembolsos</span>
        </button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.section-header { display: flex; justify-content: space-between; gap: 14px; align-items: flex-end; margin-bottom: 20px; }
.eyebrow { color: #c8a96e; font-family: "DM Mono", monospace; text-transform: uppercase; font-size: 11px; letter-spacing: .09em; margin: 0 0 4px; }
h1 { font-size: clamp(20px, 2.5vw, 30px); font-weight: 600; color: #f0ece4; margin: 0; font-family: 'Playfair Display', serif; letter-spacing: -0.01em; }
.dashboard-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px; }
.dash-card { display: flex; flex-direction: column; align-items: flex-start; gap: .375rem; padding: 1.25rem 1.25rem 1.125rem; border-radius: 4px; text-align: left; border: 1px solid rgba(200,169,110,0.12); background: rgba(200,169,110,0.04); transition: transform .12s, border-color .12s, background .12s; }
.dash-card:hover { transform: translateY(-1px); background: rgba(200,169,110,0.08); border-color: rgba(200,169,110,0.25); }
.dash-card:active { transform: scale(.98); }
.dash-icon { width: 1.25rem; height: 1.25rem; color: #c8a96e; margin-bottom: .25rem; }
.dash-label { font-size: .9375rem; font-weight: 600; color: #f0ece4; line-height: 1.2; }
.dash-desc { font-size: .75rem; color: #7a7590; line-height: 1.3; }
@media (max-width: 900px) {
  .section-header { align-items: stretch; flex-direction: column; }
}
</style>

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

      <div class="grid-list">
        <article v-for="cinema in catalog.cinemas" :key="cinema.id" class="card catalog-card">
          <div class="card-body">
            <span class="pill">{{ cinema.status }}</span>
            <h2>{{ cinema.name }}</h2>
            <p>{{ cinema.city }} · {{ cinema.address }}</p>
            <p>{{ cinema.rooms }} salas · {{ cinema.functions }} funciones</p>
            <p>Ingresos: {{ cinema.revenue }}</p>
            <button class="ghost-button" type="button" @click="router.push('/admin/cines/' + cinema.id + '/editar')">Editar</button>
          </div>
        </article>
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
h2 { font-size: .9375rem; font-weight: 600; color: #f0ece4; margin: 0; }
p { color: #7a7590; font-size: .875rem; margin: 0; }
.header-actions { display: flex; flex-wrap: wrap; gap: 8px; }
.grid-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 14px; }
.catalog-card { overflow: hidden; padding: 0; transition: transform .15s, border-color .15s; }
.catalog-card:hover { transform: translateY(-2px); border-color: rgba(200,169,110,0.22); }
.card-body { padding: 1rem 1.125rem; display: grid; gap: 10px; }
@media (max-width: 900px) {
  .section-header { align-items: stretch; flex-direction: column; }
}
</style>
